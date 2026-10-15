# Per-IP Rate Limiting With An nginx Proxy In Front Of A Kubernetes App

How to put a small nginx Deployment in front of an existing app Service to limit requests per client IP, then roll it out to production without risking the site. Taken from a production rollout on GKE (Next.js app, platform-owned TLS edge, internal load balancer). Names below are examples.

## When To Use This

An app that used to sit behind an office IP allowlist is opened to the internet. One script can now flood a single app Pod. Per-IP rate limiting replaces the allowlist as the abuse control.

Options:

- **Standalone nginx proxy Deployment** (this note): one Helm chart, namespace-scoped, no CI change, no platform ticket. Chosen.
- **ingress-nginx `limit-rps` annotations**: right choice when the app already sits behind ingress-nginx you own. Here there was no Ingress, and installing a controller needs cluster-scoped RBAC and an IngressClass.
- **nginx sidecar in the app Pod**: edits the app chart, so every change goes through the app pipeline.
- **`bitnami/nginx` chart**: Bitnami moved free versioned images to `bitnamilegacy` in 2025; a 3-file local chart is simpler.

## Path

```txt
browser
  -> edge proxy (TLS ends here, adds X-Forwarded-For)
  -> internal LB VIP
  -> Service myapp-internal (type LoadBalancer)   selector: app=myapp-proxy  (was app=myapp)
  -> nginx Pods x2                                 rate limit here
  -> Service myapp (ClusterIP)
  -> app Pods
```

Only the entry Service's `selector` changes. VIP, DNS, and edge stay the same.

## Client IP: The Part That Breaks Everything

Per-IP limiting is only as good as the IP nginx keys on.

- `externalTrafficPolicy: Cluster`: the node SNATs the source, so `$remote_addr` is a node IP.
- `externalTrafficPolicy: Local` keeps the source IP, but behind an L7 edge proxy that source is the proxy, not the user.
- So behind an L7 edge, `X-Forwarded-For` is the only source of the client IP. If the edge does not send it, every user shares one bucket and turning limits on returns 429 to the whole site.

nginx config to trust it:

```nginx
set_real_ip_from 10.0.0.0/8;      # ranges the edge connects from; never 0.0.0.0/0
real_ip_header   X-Forwarded-For;
real_ip_recursive on;             # take the rightmost address that is not trusted
```

With `real_ip_recursive on`, a client that sends a fake `X-Forwarded-For` only adds addresses to the left of the one the edge appends, so the result is still its real IP. Anything inside the trusted ranges (for example another Pod in the cluster) can set any IP. That is useful for testing and acceptable inside the cluster, but keep the trusted ranges as narrow as the network allows.

## nginx Config

Stock `nginx:1.27-alpine` includes `conf.d/*.conf` inside the `http` block, the only context where `limit_req_zone` is allowed. Mount a ConfigMap at `/etc/nginx/conf.d`.

```nginx
# Allowlist: an empty key is never limited.
geo $rl_exempt {
    default 0;
    198.51.100.10/32 1;           # office egress, monitoring, uptime checks
}
map $rl_exempt $rl_key {
    0 $binary_remote_addr;
    1 "";
}

limit_req_zone  $rl_key zone=perip_req:10m rate=10r/s;
limit_conn_zone $rl_key zone=perip_conn:10m;
limit_req_status  429;            # nginx default is 503, which looks like an outage
limit_conn_status 429;

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Log xff next to remote_addr: proves real-IP resolution before limits go live.
log_format ratelimit '$remote_addr $status $request_time "$request" '
                     'xff="$http_x_forwarded_for" host="$host"';

upstream app {
    server myapp.myns.svc.cluster.local:80;
    keepalive 32;
}

server {
    listen 8080;
    access_log /dev/stdout ratelimit;
    client_max_body_size 12m;     # above the app's own body limit, so the app returns its error

    location = /healthz {         # kubelet probes: never limited, never logged
        access_log off;
        return 200 "ok\n";
    }

    location /_next/static/ {     # one page load pulls 20-30 immutable assets; limiting them blocks real users
        proxy_pass http://app;
        include /etc/nginx/conf.d/proxy_headers.inc;
    }

    location / {
        limit_req  zone=perip_req burst=20 nodelay;
        limit_conn perip_conn 10;
        proxy_pass http://app;
        include /etc/nginx/conf.d/proxy_headers.inc;
    }
}
```

`proxy_headers.inc` (named `.inc` so `conf.d/*.conf` does not load it as config):

```nginx
proxy_http_version 1.1;
proxy_set_header Host              $host;   # keep verbatim: Next.js server actions reject Origin != Host
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade           $http_upgrade;
proxy_set_header Connection        $connection_upgrade;
```

Helm chart notes:

- Wrap the two `limit_*` lines in `location /` with `{{- if .Values.rateLimit.enabled }}`. `enabled: false` keeps the proxy in the path but limits nothing: the safe first install and the fast rollback.
- Put `checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}` on the Pod template so config changes trigger a rolling restart.
- 2 replicas plus a `/healthz` readiness probe: the proxy is now a single point of failure.
- Keep real CIDRs and allowlist in an untracked `values.prod.yaml`; commit a `values.prod.example.yaml`.

## How The Numbers Behave

- `rate=10r/s, burst=20, nodelay`: a flood gets about 20-25 requests through at once, then `429` for anything above 10/s. Backing off recovers immediately; no ban.
- Counters are **per Pod** and not shared. With 2 replicas and no affinity an IP gets roughly `rate x replicas`. Set `rate = target / replicas` and re-derive when replicas change. Shared counters need nginx Plus or Lua/Redis.
- Counters reset on restart. Harmless.
- An office NAT puts many users behind one IP, so allowlist it.

Tuning:

- Real users hit 429 on page load: raise `burst`. Absorbs spikes without raising what an attacker can sustain.
- Throttled during steady use: raise `rate`.
- One known heavy caller: allowlist it instead of raising global limits.
- `limit_conn`: rarely needs changing; it guards slow-loris style connection holding.

## Rollout

1. **Test locally with Docker.** Render the ConfigMap, mount it into `nginx:1.27-alpine` next to a dummy backend, run `nginx -t`, and send forged `X-Forwarded-For` values to check limit, allowlist, and static-asset exemption.

   ```bash
   docker network create rlnet
   docker run -d --name rl-echo  --network rlnet nginx:1.27-alpine
   docker run -d --name rl-proxy --network rlnet -p 18080:8080 \
     -v /tmp/nginxrl/conf:/etc/nginx/conf.d:ro nginx:1.27-alpine
   docker exec rl-proxy nginx -t
   curl -s -w '%{http_code} ' -H 'X-Forwarded-For: 203.0.113.7' \
     $(for i in $(seq 1 60); do printf -- '-o /dev/null http://localhost:18080/ '; done)
   docker rm -f rl-echo rl-proxy && docker network rm rlnet
   ```

2. **Install with limits off.** Changes no traffic path yet.

   ```bash
   helm --kube-context $KCTX upgrade --install myapp-proxy ./deploy/nginx-proxy -n myns \
     -f ./deploy/nginx-proxy/values.prod.yaml --set rateLimit.enabled=false --dry-run=server
   # then the same without --dry-run
   kubectl --context $KCTX -n myns rollout status deploy/myapp-proxy
   ```

3. **Smoke-test through the proxy** before any user goes through it:

   ```bash
   kubectl --context $KCTX -n myns port-forward svc/myapp-proxy 9090:80 &
   curl -sI -H 'Host: myapp.example.com' http://localhost:9090/   # 200, real app page
   kill %1
   ```

4. **Cut over** by repointing the entry Service. Record the old selector first.

   ```bash
   kubectl --context $KCTX -n myns get svc myapp-internal -o jsonpath='{.spec.selector}'
   # {"app":"myapp"}
   kubectl --context $KCTX -n myns patch svc myapp-internal -p '{"spec":{"selector":{"app":"myapp-proxy"}}}'
   ```

5. **Read the access log.** First field must be a real public client IP and `xff=` must be non-empty. Also check login and one form submit (Host header regression).

   ```bash
   kubectl --context $KCTX -n myns logs -l app=myapp-proxy --since=2m | grep '"GET'
   # bad:  10.140.15.221 200 0.020 "GET / HTTP/1.1" xff="-" ...      edge sends no X-Forwarded-For
   # good: 198.51.100.10 200 0.018 "GET / HTTP/1.1" xff="198.51.100.10" ...
   ```

   Bad: revert the selector and get the edge owner to add the header. Limits being off is what made this finding harmless.

6. **Enable limits**: rerun the helm upgrade without `--set rateLimit.enabled=false`.

7. **Verify from inside the cluster** with a forged, non-allowlisted IP:

   ```bash
   kubectl --context $KCTX -n myns run rl-tester --image=curlimages/curl:8.10.1 --restart=Never --command -- sh -c \
     'A=""; i=0; while [ $i -lt 100 ]; do A="$A -o /dev/null http://myapp-proxy.myns.svc.cluster.local/"; i=$((i+1)); done;
      curl -s -w "%{http_code} " -H "X-Forwarded-For: 203.0.113.55" $A'
   kubectl --context $KCTX -n myns logs rl-tester      # ~25 x 200, then mostly 429
   kubectl --context $KCTX -n myns delete pod rl-tester
   ```

   Also send 60+ requests from an allowlisted IP: all `200`.

**Testing pitfall:** a shell loop starting one `curl` per request reaches only about 5 requests/s, below a 10r/s limit, so a working limiter looks broken. Give one `curl` many URLs (reuses the connection) or run requests concurrently.

## Rollback

```bash
# Keep proxy, stop limiting (limits too tight):
helm --kube-context $KCTX upgrade myapp-proxy ./deploy/nginx-proxy -n myns \
  --reuse-values --set rateLimit.enabled=false

# Take proxy out of the path (proxy misbehaves): back to the original state.
kubectl --context $KCTX -n myns patch svc myapp-internal -p '{"spec":{"selector":{"app":"myapp"}}}'
```

Change limits by editing `values.prod.yaml`, not with `--set` alone: the next file-based upgrade silently reverts a `--set`.

## Risks

- **Hand-made entry Service.** If the entry Service was created with `kubectl apply` and someone re-applies the original manifest, the selector silently reverts and traffic bypasses the proxy: no error, just no limits. Re-check the selector after infra changes.
- **Upstream must resolve at startup.** nginx resolves `upstream` hosts when it loads config; a missing app Service gives `[emerg] host not found in upstream` and CrashLoopBackOff.
- **Static paths are unlimited** by design; cheap and immutable, revisit only if they show up in load.

## Errors Seen

```txt
ImagePullBackOff                 kubectl get events --field-selector involvedObject.kind=Pod --sort-by=.lastTimestamp
manifest unknown                 registry mirror lacks that image/tag; use another registry or tag
host not found in upstream       app Service must exist before the proxy starts
all 200, no 429 in a test        test too slow; one curl with many URLs
xff="-" in access log            edge sends no X-Forwarded-For; do not enable limits
whole site 429                   keying on proxy/node IP: wrong set_real_ip_from or missing header
```

# Oracle VPS Best Usage For Node.js Backends

This guide targets one Oracle Cloud Always Free VPS used to learn DevOps deeply while hosting multiple Node.js backend services.

Main recommendation:

```txt
Oracle Ampere A1 VPS
-> Ubuntu ARM64
-> k3s Kubernetes
-> ingress-nginx
-> cert-manager
-> Helm
-> GitHub Container Registry
-> GitHub Actions or manual kubectl deploy
```

Separate optimized/simple path is included at end:

```txt
Oracle VPS
-> Docker Compose
-> Caddy or Nginx
```

Use Kubernetes path if learning is primary goal. Use Compose/Caddy path if uptime with least maintenance is primary goal.

## 1. Best Learning Architecture: Kubernetes On Oracle VPS

### 1.1 Why k3s, Not Full kubeadm

Use k3s for one Oracle Free Tier VPS.

k3s is real CNCF-certified Kubernetes, but lighter. It gives Kubernetes objects, scheduling, Services, Ingress, Helm, Secrets, ConfigMaps, probes, rolling deploys, and cluster networking without full kubeadm overhead.

Do not start with kubeadm on one free VPS. It teaches Kubernetes, but it also burns more CPU/RAM and creates more operational noise than useful learning.

Good learning path:

```txt
k3s
-> disable default Traefik
-> install ingress-nginx yourself
-> install cert-manager yourself
-> deploy apps with Helm
-> add monitoring/logging later
```

This avoids Caddy magic and teaches actual Kubernetes networking.

### 1.2 Target Architecture

```txt
Browser / API client
  |
DNS A records
  |
Oracle public IP
  |
OCI Network Security Group or Security List
  |
Ubuntu UFW firewall
  |
k3s node
  |
ingress-nginx controller :80/:443
  |
Kubernetes Ingress
  |
Kubernetes Service
  |
Node.js Deployment Pods
  |
ConfigMaps / Secrets / PVCs
```

Recommended hostnames:

```txt
api.example.com       -> general API
stream.example.com    -> stream/torrent backend
socket.example.com    -> Socket.IO backend
admin.example.com     -> internal admin tools
monitor.example.com   -> Uptime Kuma/Grafana, protected
```

### 1.3 Oracle Free Tier Shape

Prefer:

```txt
VM.Standard.A1.Flex
Ubuntu 24.04 ARM64 or Ubuntu 22.04 ARM64
2 OCPU / 12 GB RAM minimum
4 OCPU / 24 GB RAM ideal
100-200 GB boot volume
```

Oracle Always Free currently documents Ampere A1 as 3,000 OCPU hours and 18,000 GB-hours per month, equivalent to 4 OCPU and 24 GB memory for Always Free tenancies. Capacity can be unavailable in some regions or availability domains.

Official docs:

- Oracle Free Tier: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- Always Free resources: https://docs.oracle.com/iaas/Content/FreeTier/resourceref.htm

Avoid AMD micro instances for this use case. They are fine for tiny cron/API tests, not for Kubernetes plus multiple Node services.

## 2. Cloud And Server Setup

### 2.1 Oracle Cloud Resources

Create:

```txt
1 compartment: personal-apps
1 VCN: apps-vcn
1 public subnet
1 Network Security Group: apps-public-nsg
1 reserved public IPv4
1 Ampere A1 instance
```

Prefer Network Security Groups over editing broad default security lists. Security lists and NSGs act as virtual firewalls in OCI.

Official docs:

- Security lists: https://docs.oracle.com/iaas/Content/Network/Concepts/securitylists.htm
- Security rules: https://docs.public.content.oci.oraclecloud.com/en-us/iaas/compute-cloud-at-customer/cmn/network/security-rules.htm

### 2.2 OCI Ingress Rules

Open only:

```txt
22/tcp    from your home IP only
80/tcp    from 0.0.0.0/0
443/tcp   from 0.0.0.0/0
```

Optional for Kubernetes learning across multiple nodes:

```txt
6443/tcp  from your IP only
```

Do not expose app ports like `3000`, `4000`, `5000` publicly. Kubernetes Services should stay internal.

Optional for legal torrent/media backend:

```txt
custom peer port/tcp+udp from 0.0.0.0/0
```

Only open peer ports if backend needs inbound peer connectivity and you understand bandwidth/legal risk.

### 2.3 DNS

At DNS provider:

```txt
A api.example.com      <oracle_reserved_public_ip>
A stream.example.com   <oracle_reserved_public_ip>
A socket.example.com   <oracle_reserved_public_ip>
A monitor.example.com  <oracle_reserved_public_ip>
```

Use low TTL during setup:

```txt
300 seconds
```

Raise later:

```txt
3600 seconds
```

### 2.4 Ubuntu Bootstrap

SSH into VM:

```bash
ssh ubuntu@YOUR_ORACLE_IP
```

Update:

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

Create deploy user:

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Harden SSH:

```bash
sudo nano /etc/ssh/sshd_config
```

Set:

```txt
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

Restart SSH:

```bash
sudo systemctl restart ssh
```

Keep current SSH session open. Test new session before closing old one:

```bash
ssh deploy@YOUR_ORACLE_IP
```

### 2.5 UFW Firewall

Install and enable:

```bash
sudo apt install -y ufw fail2ban unattended-upgrades
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

If you expose Kubernetes API to your own IP:

```bash
sudo ufw allow from YOUR_HOME_IP to any port 6443 proto tcp
```

## 3. Install Kubernetes With k3s

### 3.1 Install k3s Without Default Traefik

k3s deploys Traefik by default. For learning ingress-nginx, disable Traefik.

Official docs:

- k3s requirements: https://docs.k3s.io/installation/requirements
- k3s networking services: https://docs.k3s.io/networking/networking-services
- k3s packaged components: https://docs.k3s.io/installation/packaged-components

Install:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable=traefik" sh -
```

Make kubeconfig usable:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown "$USER":"$USER" ~/.kube/config
chmod 600 ~/.kube/config
```

Check:

```bash
kubectl get nodes -o wide
kubectl get pods -A
```

Expected:

```txt
node Ready
coredns Running
local-path-provisioner Running
metrics-server Running
```

### 3.2 Learn What k3s Installed

Important pieces:

```txt
kube-apiserver    Kubernetes API
scheduler         chooses which node runs Pod
controller        reconciles desired state
containerd        container runtime
CoreDNS           service DNS inside cluster
Flannel           pod network
ServiceLB         simple LoadBalancer implementation
local-path        local PersistentVolume provider
metrics-server    basic CPU/RAM metrics
```

k3s minimum server requirement is 2 cores and 2 GB RAM, but real apps need more. For this VPS, 2 OCPU/12 GB is comfortable for learning. 4 OCPU/24 GB is much better for multiple services.

## 4. Install Kubernetes Tooling

### 4.1 Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

Helm teaches production-style packaging better than raw YAML only.

Use raw YAML first for learning basic objects. Move to Helm once patterns repeat.

### 4.2 Install ingress-nginx

Ingress is needed to route public HTTP/HTTPS traffic to many services by hostname/path.

Official docs:

- ingress-nginx bare metal notes: https://kubernetes.github.io/ingress-nginx/deploy/baremetal/

Install:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
kubectl create namespace ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --set controller.service.type=LoadBalancer \
  --set controller.service.externalTrafficPolicy=Local
```

Check:

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

On k3s, ServiceLB should expose `80` and `443` on the node.

Verify ports:

```bash
sudo ss -tulpn | grep -E ':80|:443'
```

### 4.3 Install cert-manager

cert-manager automates Let's Encrypt certificates for Ingress.

Official docs:

- cert-manager installation: https://cert-manager.io/docs/installation/

Install with Helm:

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
kubectl create namespace cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --set crds.enabled=true
```

Check:

```bash
kubectl get pods -n cert-manager
kubectl get crds | grep cert-manager
```

Create production ClusterIssuer:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: your-email@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
```

Apply:

```bash
kubectl apply -f clusterissuer-letsencrypt-prod.yaml
```

Use staging while testing:

```yaml
server: https://acme-staging-v02.api.letsencrypt.org/directory
```

Switch to production after HTTP routing works.

## 5. Kubernetes Object Model For Node Apps

Every backend service should have:

```txt
Namespace
ConfigMap
Secret
Deployment
Service
Ingress
HorizontalPodAutoscaler optional
PersistentVolumeClaim optional
```

### 5.1 Namespace Per App Or Environment

Simple personal setup:

```txt
apps
monitoring
ingress-nginx
cert-manager
```

Use one `apps` namespace first:

```bash
kubectl create namespace apps
```

Later:

```txt
watchtogether-prod
stream-prod
socket-prod
```

### 5.2 Deployment Template For Node.js API

Example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stream-api
  namespace: apps
  labels:
    app: stream-api
spec:
  replicas: 1
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: stream-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    metadata:
      labels:
        app: stream-api
    spec:
      containers:
        - name: stream-api
          image: ghcr.io/YOUR_USER/stream-api:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 4000
          envFrom:
            - configMapRef:
                name: stream-api-config
            - secretRef:
                name: stream-api-secret
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1024Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 6
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 20
            timeoutSeconds: 2
            failureThreshold: 3
```

Why these matter:

```txt
readinessProbe  keeps broken Pod out of traffic
livenessProbe   restarts stuck process
resources       prevents one service eating whole VPS
rollingUpdate   deploys new Pod before killing old Pod
```

For very small VPS, use `replicas: 1`. For critical stateless API, use `replicas: 2` if CPU/RAM allow.

### 5.3 Service Template

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stream-api
  namespace: apps
spec:
  type: ClusterIP
  selector:
    app: stream-api
  ports:
    - name: http
      port: 80
      targetPort: 4000
```

Use `ClusterIP` for app services. Only ingress-nginx gets public traffic.

### 5.4 Ingress Template

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: stream-api
  namespace: apps
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - stream.example.com
      secretName: stream-api-tls
  rules:
    - host: stream.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: stream-api
                port:
                  number: 80
```

Long timeouts matter for WebSocket and streaming APIs.

### 5.5 ConfigMap And Secret

ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: stream-api-config
  namespace: apps
data:
  NODE_ENV: "production"
  PORT: "4000"
  LOG_LEVEL: "info"
```

Secret:

```bash
kubectl create secret generic stream-api-secret \
  --namespace apps \
  --from-literal=API_KEY='replace-me' \
  --from-literal=DATABASE_URL='replace-me'
```

Do not commit raw Secret YAML with real values.

Better later:

```txt
SOPS + age
External Secrets Operator
Sealed Secrets
OCI Vault
```

For learning, start with `kubectl create secret`. Upgrade once deployment flow is stable.

## 6. Containerizing Node.js Apps

### 6.1 Dockerfile For Node 22 API

Use multi-stage build:

```dockerfile
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 4000
CMD ["node", "server.js"]
```

For Next.js standalone backend:

```dockerfile
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Add `.dockerignore`:

```txt
node_modules
.next
.git
.env*
npm-debug.log
Dockerfile
docker-compose.yml
```

### 6.2 Health Endpoint

Every backend should expose:

```txt
GET /health
```

Response:

```json
{
  "ok": true,
  "service": "stream-api",
  "version": "1.0.0"
}
```

Readiness should not require external optional providers. If database is required for all requests, include DB ping. If provider outage should not remove whole app from traffic, keep readiness local.

## 7. Deployment Workflow

### 7.1 Container Registry

Use GitHub Container Registry:

```txt
ghcr.io/YOUR_USER/service-name:git-sha
ghcr.io/YOUR_USER/service-name:latest
```

Avoid deploying only `latest` for serious services. Pin deployments to git SHA when possible.

### 7.2 Manual Deploy First

Build locally or in GitHub Actions:

```bash
docker build -t ghcr.io/YOUR_USER/stream-api:latest .
docker push ghcr.io/YOUR_USER/stream-api:latest
```

On VPS:

```bash
kubectl rollout restart deployment/stream-api -n apps
kubectl rollout status deployment/stream-api -n apps
kubectl get pods -n apps
kubectl logs -n apps deployment/stream-api --tail=100
```

Better:

```bash
kubectl set image deployment/stream-api \
  stream-api=ghcr.io/YOUR_USER/stream-api:GIT_SHA \
  -n apps
```

Rollback:

```bash
kubectl rollout history deployment/stream-api -n apps
kubectl rollout undo deployment/stream-api -n apps
```

### 7.3 GitHub Actions Deploy Later

Pipeline:

```txt
push main
-> npm ci
-> npm run lint
-> npm run build
-> docker build
-> docker push ghcr.io
-> ssh to VPS
-> kubectl set image
-> kubectl rollout status
```

Use GitHub secrets:

```txt
VPS_HOST
VPS_USER
VPS_SSH_KEY
GHCR_TOKEN
```

Do not store kubeconfig in GitHub unless needed. SSH command on VPS can use local kubeconfig.

## 8. Storage And Databases

### 8.1 Local Path Storage

k3s includes local-path provisioner. Good for learning and single-node data.

Example PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: stream-cache
  namespace: apps
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

Mount:

```yaml
volumeMounts:
  - name: stream-cache
    mountPath: /data/cache
volumes:
  - name: stream-cache
    persistentVolumeClaim:
      claimName: stream-cache
```

Important:

```txt
local-path storage ties Pod data to this node
single node is fine
multi-node later needs real storage plan
```

### 8.2 Database Options

Personal/small:

```txt
Postgres in Kubernetes with PVC
Redis in Kubernetes with PVC or no persistence
```

More production:

```txt
managed Postgres outside cluster
OCI Autonomous DB if fits workload
external backup storage
```

For learning, run Postgres in cluster once. For important data, backup aggressively.

### 8.3 Backup Strategy

Back up:

```txt
Kubernetes manifests / Helm values
Secrets source, encrypted
Postgres dumps
PVC data if important
/etc/rancher/k3s/k3s.yaml if remote admin needed
```

Postgres dump CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: apps
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: postgres:16
              command:
                - sh
                - -c
                - |
                  pg_dump "$DATABASE_URL" > /backup/db-$(date +%F).sql
              envFrom:
                - secretRef:
                    name: postgres-backup-secret
              volumeMounts:
                - name: backup
                  mountPath: /backup
          volumes:
            - name: backup
              persistentVolumeClaim:
                claimName: backup-pvc
```

Better: push backup to external object storage after dump.

## 9. Streaming/Torrent Backend Notes

This section is for content you have rights to stream.

Vercel cannot reliably run persistent torrent/server streaming. VPS can.

Recommended architecture:

```txt
Next.js frontend on Vercel
-> HTTPS API on Oracle VPS
-> Node streamer Pod
-> persistent process while playback active
-> HTTP range endpoint
-> browser <video>
```

Streamer service requirements:

```txt
long-running Node process
range request support
cache directory PVC
file cleanup job
bandwidth guardrails
auth/rate limiting
```

Ingress annotations for streaming:

```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-buffering: "off"
```

Resource example:

```yaml
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 4096Mi
```

Cache cleanup CronJob:

```txt
delete files older than 24 hours
keep total cache under fixed GB limit
never let disk fill above 85%
```

Use direct streaming first. Avoid transcoding unless required. Transcoding burns CPU and can make free VPS unusable.

## 10. Observability

### 10.1 First Tools

Use built-in commands:

```bash
kubectl get pods -A
kubectl describe pod POD_NAME -n apps
kubectl logs -n apps deployment/stream-api --tail=200
kubectl top nodes
kubectl top pods -A
```

Host tools:

```bash
htop
df -h
du -sh /var/lib/rancher/k3s
sudo journalctl -u k3s -f
```

### 10.2 Uptime Kuma

Deploy Uptime Kuma after core apps work.

Monitor:

```txt
https://api.example.com/health
https://stream.example.com/health
https://socket.example.com/health
disk space via push monitor
```

Protect admin UI with:

```txt
strong password
separate hostname
optional IP allowlist
```

### 10.3 Prometheus/Grafana Later

Do not install full monitoring stack on day one. It uses memory and adds many moving parts.

Add later:

```txt
kube-prometheus-stack
Prometheus
Grafana
Loki or Vector
```

Learning order:

```txt
kubectl logs
-> Uptime Kuma
-> metrics-server
-> Prometheus/Grafana
-> Loki
```

## 11. Security Baseline

### 11.1 Network

Rules:

```txt
Only 80/443 public
SSH only from your IP
Kubernetes API not public unless IP restricted
No public NodePort apps
No public database ports
```

### 11.2 Kubernetes RBAC

Single-user personal cluster can start with admin kubeconfig.

Learn RBAC later:

```txt
ServiceAccount
Role
RoleBinding
least privilege CI deploy user
```

### 11.3 Secrets

Bad:

```txt
commit Secret YAML with base64 values
put secrets in Docker image
put .env in git
```

Acceptable first step:

```bash
kubectl create secret generic app-secret ...
```

Better:

```txt
SOPS + age encrypted secrets in git
Sealed Secrets
External Secrets Operator
OCI Vault
```

### 11.4 Image Security

Use:

```txt
small base images
non-root user
npm ci
dependency scanning
no build secrets in final image
fixed tags or SHA digests for critical services
```

## 12. Resource Planning For One Free VPS

Example 4 OCPU / 24 GB layout:

```txt
k3s system                1-2 GB RAM
ingress-nginx             256-512 MB
cert-manager              256-512 MB
3 small Node APIs          1-3 GB total
stream backend             1-4 GB depending workload
Postgres                   1-4 GB
Redis                      256 MB-1 GB
monitoring light           512 MB-2 GB
free headroom              keep 25-35%
```

Do not run everything without limits. One memory leak can kill node.

Use requests/limits for every app:

```txt
small API request: 100m CPU, 256Mi memory
small API limit:   500m CPU, 512Mi memory
stream request:    250m CPU, 512Mi memory
stream limit:      2000m CPU, 4096Mi memory
```

Watch:

```bash
kubectl top pods -A
kubectl top nodes
free -h
df -h
```

## 13. Learning Roadmap

### Phase 1: Server Foundation

Goal:

```txt
secure Oracle VPS
k3s running
kubectl works
ingress-nginx receives traffic
cert-manager issues cert
```

Deploy one hello app:

```txt
Deployment
Service
Ingress
TLS
```

### Phase 2: First Real Node Service

Goal:

```txt
containerize Node API
push image to GHCR
deploy with Kubernetes YAML
rollout restart
rollback
logs
health checks
```

### Phase 3: Multiple Services

Goal:

```txt
api.example.com
stream.example.com
socket.example.com
```

Learn:

```txt
namespaces
ConfigMaps
Secrets
resource limits
Ingress host routing
WebSocket routing
```

### Phase 4: Helm

Goal:

```txt
convert repeated YAML to one Helm chart
use values per service
deploy with helm upgrade --install
```

Chart structure:

```txt
charts/node-service/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    configmap.yaml
```

### Phase 5: CI/CD

Goal:

```txt
push main
-> tests
-> image build
-> push
-> deploy
-> rollout status
```

### Phase 6: Data And Backups

Goal:

```txt
Postgres in cluster
PVC
backup CronJob
restore test
```

### Phase 7: Observability

Goal:

```txt
Uptime Kuma
basic alerts
Prometheus/Grafana later
central logs later
```

## 14. Common Commands

Cluster:

```bash
kubectl get nodes -o wide
kubectl get pods -A
kubectl get svc -A
kubectl get ingress -A
kubectl get certificates -A
```

Debug app:

```bash
kubectl describe deployment stream-api -n apps
kubectl describe pod POD_NAME -n apps
kubectl logs POD_NAME -n apps
kubectl logs -f deployment/stream-api -n apps
kubectl exec -it POD_NAME -n apps -- sh
```

Rollout:

```bash
kubectl rollout status deployment/stream-api -n apps
kubectl rollout history deployment/stream-api -n apps
kubectl rollout undo deployment/stream-api -n apps
```

Ingress/cert:

```bash
kubectl describe ingress stream-api -n apps
kubectl describe certificate stream-api-tls -n apps
kubectl describe challenge -A
kubectl logs -n cert-manager deployment/cert-manager
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

k3s service logs:

```bash
sudo journalctl -u k3s -f
```

Disk:

```bash
df -h
sudo du -sh /var/lib/rancher/k3s
sudo du -sh /var/lib/rancher/k3s/storage
```

## 15. Failure Modes And Fixes

### 15.1 Domain Does Not Work

Check:

```bash
dig api.example.com
curl -I http://api.example.com
kubectl get ingress -A
kubectl get svc -n ingress-nginx
sudo ufw status
```

Likely causes:

```txt
DNS A record wrong
OCI port 80/443 closed
UFW port 80/443 closed
ingress-nginx not running
Ingress host mismatch
```

### 15.2 Certificate Not Issued

Check:

```bash
kubectl describe certificate -A
kubectl describe challenge -A
kubectl logs -n cert-manager deployment/cert-manager
```

Likely causes:

```txt
HTTP port 80 blocked
DNS not pointed to VPS
wrong ingressClassName
Let's Encrypt rate limit
using prod issuer during testing
```

### 15.3 Pod CrashLoopBackOff

Check:

```bash
kubectl logs POD_NAME -n apps --previous
kubectl describe pod POD_NAME -n apps
```

Likely causes:

```txt
missing env secret
wrong PORT
app binds localhost instead of 0.0.0.0
bad image architecture
startup too slow for liveness probe
```

For Node apps inside containers, bind:

```txt
0.0.0.0
```

not:

```txt
localhost
```

### 15.4 Image Pull Fails

Check:

```bash
kubectl describe pod POD_NAME -n apps
```

Likely causes:

```txt
private GHCR image
missing imagePullSecret
wrong tag
ARM64 image missing
```

Build multi-arch if needed:

```bash
docker buildx build --platform linux/arm64 -t ghcr.io/YOUR_USER/app:tag --push .
```

### 15.5 Node Disk Full

Check:

```bash
df -h
sudo du -xh / | sort -h | tail -50
```

Clean:

```bash
sudo k3s crictl images
sudo k3s crictl rmi --prune
```

Remove old logs if needed:

```bash
sudo journalctl --vacuum-time=7d
```

For stream cache, create cleanup CronJob.

## 16. When To Add More Kubernetes Complexity

Do not install everything early.

Add only when pain appears:

```txt
Helm                 after 2-3 services repeat YAML
SOPS/SealedSecrets   after secrets become hard to track
Prometheus           after kubectl top/logs insufficient
Loki                 after logs across services become painful
Argo CD              after manual deploys become risky
External DNS         after many hostnames
MetalLB              after multi-node/bare-metal LB learning
Longhorn             after multi-node persistent storage need
```

Avoid for one-node first month:

```txt
service mesh
Istio
Linkerd
multi-cluster
full ELK stack
Kafka
overcomplicated GitOps
```

## 17. Best Practice Defaults

Use these defaults unless there is a reason not to:

```txt
Kubernetes distro:       k3s
Ingress controller:      ingress-nginx
TLS:                     cert-manager + Let's Encrypt
Package manager:         Helm
Container registry:      GHCR
Namespace:               apps
Service type:            ClusterIP
Public entrypoint:       Ingress only
Secrets v1:              kubectl create secret
Secrets v2:              SOPS or Sealed Secrets
Storage v1:              local-path PVC
Monitoring v1:           kubectl + Uptime Kuma
Monitoring v2:           Prometheus/Grafana
Deployment v1:           manual kubectl/helm
Deployment v2:           GitHub Actions
```

## 18. Separate Optimized Plan: Docker Compose + Caddy

This path is better if you want fewer moving parts and more practical uptime. It teaches less Kubernetes.

### 18.1 Optimized Architecture

```txt
Internet
-> DNS
-> Oracle public IP
-> OCI NSG/Security List
-> UFW
-> Caddy :80/:443
-> Docker network
-> Node containers
```

### 18.2 Why Caddy

Caddy automatically handles HTTPS and renewal. It is simpler than Nginx plus certbot.

Official docs:

- Caddy automatic HTTPS: https://caddyserver.com/docs/automatic-https
- Caddy reverse_proxy: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy

### 18.3 Folder Layout

```txt
/opt/apps/
  proxy/
    docker-compose.yml
    Caddyfile
  api/
    docker-compose.yml
    .env
  stream-api/
    docker-compose.yml
    .env
  socket-api/
    docker-compose.yml
    .env
```

### 18.4 Shared Docker Network

```bash
docker network create proxy
```

### 18.5 Caddy Compose

```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - proxy

volumes:
  caddy_data:
  caddy_config:

networks:
  proxy:
    external: true
```

### 18.6 Caddyfile

```txt
api.example.com {
  reverse_proxy api:3000
}

stream.example.com {
  reverse_proxy stream-api:4000
}

socket.example.com {
  reverse_proxy socket-api:5000
}
```

### 18.7 App Compose

```yaml
services:
  stream-api:
    image: ghcr.io/YOUR_USER/stream-api:latest
    restart: unless-stopped
    env_file:
      - .env
    expose:
      - "4000"
    networks:
      - proxy
    volumes:
      - stream_cache:/data/cache

volumes:
  stream_cache:

networks:
  proxy:
    external: true
```

### 18.8 Compose Deploy

```bash
cd /opt/apps/stream-api
docker compose pull
docker compose up -d
docker compose logs -f --tail=100
```

### 18.9 Compose Pros And Cons

Pros:

```txt
less memory
less setup
easier debugging
faster deploys
automatic HTTPS with Caddy
best practical choice for one VPS
```

Cons:

```txt
less Kubernetes learning
manual service discovery
manual rollout/rollback
less declarative cluster model
weaker scaling story
```

## 19. Which Path To Use

Use Kubernetes path when:

```txt
learning DevOps matters
you want ingress, cert-manager, deployments, services, probes, Helm
you accept more complexity
you want experience transferable to real clusters
```

Use Compose/Caddy path when:

```txt
you only need personal production hosting
you want least maintenance
you have one VPS
you do not need Kubernetes practice
```

Best combined approach:

```txt
Use Kubernetes for learning and main backend services.
Keep Compose/Caddy notes as fallback.
If Kubernetes becomes too much, switch production services to Compose but keep k3s lab separately.
```

## 20. Final Recommended Build Order

1. Create Oracle A1 VPS with Ubuntu ARM64, 4 OCPU / 24 GB if possible.
2. Reserve public IP and point test domain to it.
3. Harden SSH, UFW, fail2ban.
4. Install k3s with Traefik disabled.
5. Install Helm.
6. Install ingress-nginx.
7. Install cert-manager.
8. Deploy hello app with TLS.
9. Deploy first Node API with Deployment, Service, Ingress, ConfigMap, Secret.
10. Add health checks and resource limits.
11. Add second and third services.
12. Convert repeated YAML into Helm chart.
13. Add GitHub Actions deploy.
14. Add backups.
15. Add Uptime Kuma.
16. Add Prometheus/Grafana only after basics are stable.

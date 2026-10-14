{{- define "shop-api.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "shop-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "shop-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "shop-api.labels" -}}
{{ include "shop-api.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "shop-api.image" -}}
{{- required "image.tag is required (use the git SHA)" .Values.image.tag | printf "%s:%s" .Values.image.repository -}}
{{- end -}}

{{- define "shop-api.secretName" -}}
{{- printf "%s-secrets" (include "shop-api.name" .) -}}
{{- end -}}

{{/* Cloud SQL Auth Proxy as a native sidecar (initContainer with restartPolicy: Always). */}}
{{- define "shop-api.cloudSqlProxy" -}}
- name: cloud-sql-proxy
  image: {{ .Values.cloudSqlProxy.image }}
  restartPolicy: Always
  args:
    - --private-ip
    - --port=5432
    - --structured-logs
    - --health-check
    - --http-address=0.0.0.0
    - --http-port=9801
    - --exit-zero-on-sigterm
    - {{ .Values.cloudSqlProxy.instanceConnectionName }}
  startupProbe:
    httpGet:
      path: /startup
      port: 9801
    periodSeconds: 1
    failureThreshold: 60
  livenessProbe:
    httpGet:
      path: /liveness
      port: 9801
    periodSeconds: 10
    failureThreshold: 3
  resources:
    {{- toYaml .Values.cloudSqlProxy.resources | nindent 4 }}
  securityContext:
    runAsNonRoot: true
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]
{{- end -}}

{{- define "shop-api.containerSecurityContext" -}}
runAsNonRoot: true
runAsUser: 1000
runAsGroup: 1000
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities:
  drop: ["ALL"]
{{- end -}}

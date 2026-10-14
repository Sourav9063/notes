resource "google_monitoring_uptime_check_config" "api" {
  display_name = "shop-api /healthz"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/healthz"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "api.${var.domain}"
    }
  }
}

resource "google_monitoring_notification_channel" "oncall_email" {
  display_name = "On-call email"
  type         = "email"
  labels = {
    email_address = "oncall@${var.domain}"
  }
}

resource "google_monitoring_alert_policy" "api_down" {
  display_name = "shop-api is down"
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failing"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${google_monitoring_uptime_check_config.api.uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "120s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.oncall_email.name]
}

# p95 latency from the app's Prometheus histogram (Managed Service for Prometheus).
resource "google_monitoring_alert_policy" "api_latency" {
  display_name = "shop-api p95 latency > 1s"
  combiner     = "OR"

  conditions {
    display_name = "p95 latency"
    condition_prometheus_query_language {
      query    = "histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{namespace=\"shop\"}[5m]))) > 1"
      duration = "300s"
    }
  }

  notification_channels = [google_monitoring_notification_channel.oncall_email.name]
}

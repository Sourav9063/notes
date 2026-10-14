resource "google_storage_bucket" "uploads" {
  name     = "${var.project_id}-uploads"
  location = var.region

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  # Browsers PUT/GET directly to the bucket with signed URLs.
  # response_header also lists request headers allowed in preflight (size-limit header from section 3.8).
  cors {
    origin          = ["https://app.${var.domain}"]
    method          = ["PUT", "GET"]
    response_header = ["Content-Type", "x-goog-content-length-range"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }
}

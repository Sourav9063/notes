resource "google_artifact_registry_repository" "shop" {
  repository_id = "shop"
  location      = var.region
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]

  # Keep the 30 newest images; delete untagged images after 7 days.
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 30
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}

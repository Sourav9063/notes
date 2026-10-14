# ---- Application identity ----
resource "google_service_account" "shop_api" {
  account_id   = "shop-api"
  display_name = "shop-api workload"
}

# Kubernetes SA shop/shop-api may act as this Google SA (Workload Identity).
resource "google_service_account_iam_member" "shop_api_workload_identity" {
  service_account_id = google_service_account.shop_api.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[shop/shop-api]"
}

# Sign GCS URLs without a private key (IAM signBlob on itself).
resource "google_service_account_iam_member" "shop_api_sign" {
  service_account_id = google_service_account.shop_api.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = google_service_account.shop_api.member
}

resource "google_project_iam_member" "shop_api_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = google_service_account.shop_api.member
}

resource "google_storage_bucket_iam_member" "shop_api_uploads" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectUser"
  member = google_service_account.shop_api.member
}

resource "google_secret_manager_secret_iam_member" "shop_api_db_password" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.shop_api.member
}

# ---- GitHub Actions identity (no JSON keys) ----
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "shop-api"
  display_name                       = "shop-api repository"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  # Only tokens from this repository are accepted.
  attribute_condition = "assertion.repository == '${var.github_repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

locals {
  github_principal = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_artifact_registry_repository_iam_member" "github_push" {
  location   = google_artifact_registry_repository.shop.location
  repository = google_artifact_registry_repository.shop.name
  role       = "roles/artifactregistry.writer"
  member     = local.github_principal
}

resource "google_project_iam_member" "github_deploy" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = local.github_principal
}

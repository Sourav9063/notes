terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State lives in a versioned GCS bucket created once by hand (section 13.1).
  backend "gcs" {
    bucket = "acme-shop-prod-tfstate"
    prefix = "shop/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_service_account" "gke_nodes" {
  account_id   = "gke-nodes"
  display_name = "GKE node pool"
}

# Minimum permissions nodes need (logs, metrics, image pulls).
resource "google_project_iam_member" "gke_nodes" {
  project = var.project_id
  role    = "roles/container.defaultNodeServiceAccount"
  member  = google_service_account.gke_nodes.member
}

resource "google_artifact_registry_repository_iam_member" "gke_nodes_pull" {
  location   = google_artifact_registry_repository.shop.location
  repository = google_artifact_registry_repository.shop.name
  role       = "roles/artifactregistry.reader"
  member     = google_service_account.gke_nodes.member
}

resource "google_container_cluster" "shop" {
  name     = "shop-gke"
  location = var.region

  network    = google_compute_network.shop.id
  subnetwork = google_compute_subnetwork.gke.id

  # Node pools are managed separately below.
  remove_default_node_pool = true
  initial_node_count       = 1

  release_channel {
    channel = "REGULAR"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Dataplane V2 (eBPF) enforces NetworkPolicy.
  datapath_provider = "ADVANCED_DATAPATH"

  private_cluster_config {
    enable_private_nodes = true
  }

  control_plane_endpoints_config {
    # IAM-protected DNS endpoint: CI reaches the control plane without IP allowlists.
    dns_endpoint_config {
      allow_external_traffic = true
    }
  }

  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.admin_cidrs
      content {
        cidr_block = cidr_blocks.value
      }
    }
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  deletion_protection = true
}

resource "google_container_node_pool" "general" {
  name     = "general"
  cluster  = google_container_cluster.shop.id
  location = var.region

  # Per zone: regional cluster has 3 zones.
  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type    = "e2-standard-4"
    disk_size_gb    = 50
    disk_type       = "pd-balanced"
    service_account = google_service_account.gke_nodes.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

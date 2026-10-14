resource "google_compute_network" "shop" {
  name                    = "shop-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "gke" {
  name                     = "shop-gke-subnet"
  network                  = google_compute_network.shop.id
  region                   = var.region
  ip_cidr_range            = "10.10.0.0/20"
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.16.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.20.0.0/20"
  }
}

# Private nodes have no public IP; Cloud NAT gives them outbound internet.
resource "google_compute_router" "shop" {
  name    = "shop-router"
  network = google_compute_network.shop.id
  region  = var.region
}

resource "google_compute_router_nat" "shop" {
  name                               = "shop-nat"
  router                             = google_compute_router.shop.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Private Service Access: lets Cloud SQL get a private IP inside this VPC.
resource "google_compute_global_address" "private_services" {
  name          = "google-managed-services-shop-vpc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.shop.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.shop.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]
}

# Public entry point: ingress-nginx LoadBalancer Service uses this IP.
resource "google_compute_address" "ingress" {
  name   = "shop-ingress-ip"
  region = var.region
}

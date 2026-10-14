resource "google_sql_database_instance" "shop" {
  name             = "shop-pg"
  region           = var.region
  database_version = "POSTGRES_17"
  depends_on       = [google_service_networking_connection.private_services]

  settings {
    edition           = "ENTERPRISE"
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_size         = 20
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.shop.id
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "19:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 14
      }
    }

    maintenance_window {
      day  = 7
      hour = 20
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "shop" {
  name     = "shop"
  instance = google_sql_database_instance.shop.name
}

# Hex keeps the password URL-safe inside DATABASE_URL.
resource "random_id" "db_password" {
  byte_length = 32
}

resource "google_sql_user" "shop_api" {
  name     = "shop_api"
  instance = google_sql_database_instance.shop.name
  password = random_id.db_password.hex
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "shop-api-db-password"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_id.db_password.hex
}

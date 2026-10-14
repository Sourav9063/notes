output "ingress_ip" {
  value = google_compute_address.ingress.address
}

output "dns_name_servers" {
  description = "Set these at your domain registrar"
  value       = google_dns_managed_zone.shop.name_servers
}

output "sql_connection_name" {
  value = google_sql_database_instance.shop.connection_name
}

output "github_workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

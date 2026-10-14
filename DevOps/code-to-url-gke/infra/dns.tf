resource "google_dns_managed_zone" "shop" {
  name       = "example-com"
  dns_name   = "${var.domain}."
  depends_on = [google_project_service.apis]
}

resource "google_dns_record_set" "api" {
  managed_zone = google_dns_managed_zone.shop.name
  name         = "api.${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_address.ingress.address]
}

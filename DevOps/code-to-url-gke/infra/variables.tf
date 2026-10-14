variable "project_id" {
  type    = string
  default = "acme-shop-prod"
}

variable "region" {
  type    = string
  default = "asia-southeast1"
}

variable "github_repository" {
  description = "owner/repo allowed to deploy through Workload Identity Federation"
  type        = string
  default     = "acme/shop-api"
}

variable "admin_cidrs" {
  description = "CIDRs allowed to reach the GKE control plane IP endpoint"
  type        = list(string)
  default     = ["203.0.113.10/32"]
}

variable "domain" {
  type    = string
  default = "example.com"
}

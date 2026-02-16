variable "aws_region" {
  default = "us-east-1"
}

variable "name_prefix" {
  default = "solutions"
}

variable "db_username" {
  default = "solutions_admins"
}

variable "db_name" {
  default = "solutions_db"
}

variable "publicly_accessible" {
  type    = bool
  default = true
}

variable "allowed_cidr" {
  type    = string
  default = "45.238.182.48/32"
}

variable "environment" {
  type    = string
  default = "prod"
}

# -----------------------------------------------------------------------------
# Variables para Frontend (S3)
# -----------------------------------------------------------------------------
variable "frontend_force_destroy" {
  description = "Allow S3 bucket to be destroyed even if not empty"
  type        = bool
  default     = false # false en prod para proteger el bucket
}

variable "frontend_allow_public_access" {
  description = "Habilitar acceso público global al bucket S3 (NO recomendado en prod, usar CloudFront)"
  type        = bool
  default     = false # false en prod - usar CloudFront en su lugar
}

# -----------------------------------------------------------------------------
# Variables para DNS (ACM + Route53) - Configurar cuando se tenga el dominio
# -----------------------------------------------------------------------------
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "" # Ej: "solutions-delivery.com"
}

variable "hosted_zone_id" {
  description = "Route53 Hosted Zone ID (if already exists)"
  type        = string
  default     = ""
}
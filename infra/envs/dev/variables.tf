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
  default = "191.97.12.16/32"
}

variable "environment" {
  type    = string
  default = "dev"
}

# -----------------------------------------------------------------------------
# Variables para Frontend (S3)
# -----------------------------------------------------------------------------
variable "frontend_force_destroy" {
  description = "Allow S3 bucket to be destroyed even if not empty"
  type        = bool
  default     = true # true en dev para facilitar cleanup
}

variable "frontend_allow_public_access" {
  description = "Habilitar acceso público global al bucket S3 (para compartir URL con cliente)"
  type        = bool
  default     = true # true en dev para testing/demos
}

# -----------------------------------------------------------------------------
# Variables para DNS (ACM + Route53) - Configurar cuando se tenga el dominio
# -----------------------------------------------------------------------------
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "" # Ej: "dev.solutions-delivery.com" o "solutions-delivery.com"
}

variable "hosted_zone_id" {
  description = "Route53 Hosted Zone ID (if already exists)"
  type        = string
  default     = ""
}
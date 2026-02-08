# =============================================================================
# VARIABLES - DNS Module (ACM + Route53)
# =============================================================================
# Este módulo está comentado por defecto.
# Descomentar cuando se tenga el dominio configurado.
# =============================================================================

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
}

# -----------------------------------------------------------------------------
# Variables de Dominio
# -----------------------------------------------------------------------------
variable "domain_name" {
  description = "Primary domain name (e.g., example.com)"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for the frontend (e.g., 'app' for app.example.com, or '' for root domain)"
  type        = string
  default     = ""
}

variable "create_www_alias" {
  description = "Create www alias for the domain"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Variables de Route53
# -----------------------------------------------------------------------------
variable "create_hosted_zone" {
  description = "Create a new hosted zone (false if using existing)"
  type        = bool
  default     = false
}

variable "hosted_zone_id" {
  description = "Existing Route53 Hosted Zone ID (required if create_hosted_zone is false)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Variables de ACM
# -----------------------------------------------------------------------------
variable "create_certificate" {
  description = "Create a new ACM certificate"
  type        = bool
  default     = true
}

variable "existing_certificate_arn" {
  description = "ARN of existing ACM certificate (if not creating new one)"
  type        = string
  default     = ""
}

variable "subject_alternative_names" {
  description = "Additional domain names for the certificate"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Variables de Target (CloudFront o S3)
# -----------------------------------------------------------------------------
variable "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  type        = string
  default     = ""
}

variable "cloudfront_distribution_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  type        = string
  default     = "Z2FDTNDATAQYW2" # CloudFront's fixed hosted zone ID
}

variable "s3_website_endpoint" {
  description = "S3 website endpoint (for non-CloudFront setup)"
  type        = string
  default     = ""
}

variable "s3_website_hosted_zone_id" {
  description = "S3 website hosted zone ID for the region"
  type        = string
  default     = "Z3AQBSTGFYJSTF" # us-east-1 S3 website hosted zone
}

# -----------------------------------------------------------------------------
# API Gateway (opcional)
# -----------------------------------------------------------------------------
variable "create_api_record" {
  description = "Create DNS record for API Gateway"
  type        = bool
  default     = false
}

variable "api_subdomain" {
  description = "Subdomain for API (e.g., 'api' for api.example.com)"
  type        = string
  default     = "api"
}

variable "api_gateway_domain_name" {
  description = "API Gateway custom domain name"
  type        = string
  default     = ""
}

variable "api_gateway_hosted_zone_id" {
  description = "API Gateway regional hosted zone ID"
  type        = string
  default     = ""
}

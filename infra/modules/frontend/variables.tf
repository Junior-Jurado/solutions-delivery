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

variable "index_document" {
  description = "Index document for the website"
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = "Error document for the website"
  type        = string
  default     = "index.html"
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "force_destroy" {
  description = "Allow bucket to be destroyed even if not empty"
  type        = bool
  default     = false
}

variable "allow_public_access" {
  description = "Deshabilitar el bloqueo de acceso público a nivel de cuenta AWS para permitir compartir la URL globalmente (usar solo en dev/testing)"
  type        = bool
  default     = false
}

# Variables para CloudFront (futuro)
variable "enable_cloudfront" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # Only US, Canada, Europe
}

# Variable para certificado ACM (futuro)
variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name for the frontend"
  type        = string
  default     = ""
}

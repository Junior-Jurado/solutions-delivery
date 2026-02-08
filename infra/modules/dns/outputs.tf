# =============================================================================
# OUTPUTS - DNS Module (ACM + Route53)
# =============================================================================
# Descomentar cuando se habilite el módulo
# =============================================================================

# -----------------------------------------------------------------------------
# Hosted Zone Outputs
# -----------------------------------------------------------------------------
# output "hosted_zone_id" {
#   description = "Route53 Hosted Zone ID"
#   value       = local.hosted_zone_id
# }

# output "hosted_zone_name_servers" {
#   description = "Name servers for the hosted zone (if created)"
#   value       = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : null
# }

# -----------------------------------------------------------------------------
# Certificate Outputs
# -----------------------------------------------------------------------------
# output "certificate_arn" {
#   description = "ARN of the ACM certificate"
#   value       = aws_acm_certificate.main.arn
# }

# output "certificate_domain_name" {
#   description = "Domain name of the certificate"
#   value       = aws_acm_certificate.main.domain_name
# }

# output "certificate_status" {
#   description = "Status of the certificate"
#   value       = aws_acm_certificate.main.status
# }

# output "certificate_validation_complete" {
#   description = "Whether certificate validation is complete"
#   value       = aws_acm_certificate_validation.main.id != ""
# }

# -----------------------------------------------------------------------------
# DNS Record Outputs
# -----------------------------------------------------------------------------
# output "frontend_fqdn" {
#   description = "Fully qualified domain name for the frontend"
#   value       = local.frontend_fqdn
# }

# output "frontend_url" {
#   description = "Full HTTPS URL for the frontend"
#   value       = "https://${local.frontend_fqdn}"
# }

# output "www_fqdn" {
#   description = "WWW FQDN (if created)"
#   value       = var.create_www_alias && var.subdomain == "" ? "www.${var.domain_name}" : null
# }

# -----------------------------------------------------------------------------
# API Outputs (if enabled)
# -----------------------------------------------------------------------------
# output "api_certificate_arn" {
#   description = "ARN of the API ACM certificate"
#   value       = var.create_api_record ? aws_acm_certificate.api[0].arn : null
# }

# output "api_domain_name" {
#   description = "Custom domain name for the API"
#   value       = var.create_api_record ? aws_apigatewayv2_domain_name.api[0].domain_name : null
# }

# output "api_domain_target" {
#   description = "Target domain name for API Gateway custom domain"
#   value       = var.create_api_record ? aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name : null
# }

# output "api_url" {
#   description = "Full HTTPS URL for the API"
#   value       = var.create_api_record ? "https://${var.api_subdomain}.${var.domain_name}" : null
# }

# -----------------------------------------------------------------------------
# Outputs temporales mientras el módulo está comentado
# -----------------------------------------------------------------------------
output "module_status" {
  description = "Status of the DNS module"
  value       = "Module is currently disabled. Uncomment resources in main.tf to enable."
}

output "domain_name" {
  description = "Configured domain name (for reference)"
  value       = var.domain_name
}

output "environment" {
  description = "Environment"
  value       = var.environment
}

# =============================================================================
# DNS MODULE - ACM Certificate + Route53 Configuration
# =============================================================================
# Este módulo configura:
# - Certificado SSL/TLS con AWS Certificate Manager (ACM)
# - Registros DNS en Route53
# - Validación automática del certificado via DNS
#
# IMPORTANTE: ACM para CloudFront DEBE estar en us-east-1
# =============================================================================
#
# INSTRUCCIONES DE USO:
# 1. Descomentar todo el código de este archivo
# 2. Configurar las variables en el entorno (dev/prod)
# 3. Si ya tienes una hosted zone, pasar hosted_zone_id
# 4. Si necesitas crear la hosted zone, configurar create_hosted_zone = true
# 5. Ejecutar terraform apply
# =============================================================================

# -----------------------------------------------------------------------------
# Data Source - Hosted Zone existente
# -----------------------------------------------------------------------------
# data "aws_route53_zone" "main" {
#   count = var.create_hosted_zone ? 0 : 1
#
#   zone_id = var.hosted_zone_id != "" ? var.hosted_zone_id : null
#   name    = var.hosted_zone_id == "" ? var.domain_name : null
# }

# -----------------------------------------------------------------------------
# Route53 Hosted Zone (solo si se necesita crear)
# -----------------------------------------------------------------------------
# resource "aws_route53_zone" "main" {
#   count = var.create_hosted_zone ? 1 : 0
#
#   name    = var.domain_name
#   comment = "Managed by Terraform - ${var.name_prefix} ${var.environment}"
#
#   tags = {
#     Name        = var.domain_name
#     Environment = var.environment
#     ManagedBy   = "Terraform"
#   }
# }

# locals {
#   hosted_zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.main[0].zone_id
#
#   # Construir el FQDN del frontend
#   frontend_fqdn = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
#
#   # Lista de SANs para el certificado
#   certificate_sans = concat(
#     var.create_www_alias && var.subdomain == "" ? ["www.${var.domain_name}"] : [],
#     var.subject_alternative_names
#   )
# }

# =============================================================================
# ACM CERTIFICATE
# =============================================================================
# NOTA: Para usar con CloudFront, el certificado DEBE estar en us-east-1
# Si tu infraestructura está en otra región, necesitarás un provider adicional
# =============================================================================

# Para certificados en us-east-1 (requerido para CloudFront)
# provider "aws" {
#   alias  = "us_east_1"
#   region = "us-east-1"
# }

# -----------------------------------------------------------------------------
# Certificado ACM
# -----------------------------------------------------------------------------
# resource "aws_acm_certificate" "main" {
#   # provider = aws.us_east_1  # Descomentar si se usa CloudFront y la región principal no es us-east-1
#
#   domain_name               = local.frontend_fqdn
#   subject_alternative_names = local.certificate_sans
#   validation_method         = "DNS"
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = {
#     Name        = "${var.name_prefix}-cert-${var.environment}"
#     Environment = var.environment
#     Domain      = local.frontend_fqdn
#   }
# }

# -----------------------------------------------------------------------------
# Registros DNS para validación del certificado
# -----------------------------------------------------------------------------
# resource "aws_route53_record" "cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }
#
#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = local.hosted_zone_id
# }

# -----------------------------------------------------------------------------
# Validación del Certificado
# -----------------------------------------------------------------------------
# resource "aws_acm_certificate_validation" "main" {
#   # provider = aws.us_east_1  # Descomentar si se usa el provider de us-east-1
#
#   certificate_arn         = aws_acm_certificate.main.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
#
#   timeouts {
#     create = "30m"
#   }
# }

# =============================================================================
# ROUTE53 DNS RECORDS
# =============================================================================

# -----------------------------------------------------------------------------
# Registro A para el Frontend (CloudFront)
# -----------------------------------------------------------------------------
# resource "aws_route53_record" "frontend" {
#   zone_id = local.hosted_zone_id
#   name    = local.frontend_fqdn
#   type    = "A"
#
#   alias {
#     name                   = var.cloudfront_distribution_domain
#     zone_id                = var.cloudfront_distribution_zone_id
#     evaluate_target_health = false
#   }
# }

# -----------------------------------------------------------------------------
# Registro AAAA para el Frontend (IPv6 - CloudFront)
# -----------------------------------------------------------------------------
# resource "aws_route53_record" "frontend_ipv6" {
#   zone_id = local.hosted_zone_id
#   name    = local.frontend_fqdn
#   type    = "AAAA"
#
#   alias {
#     name                   = var.cloudfront_distribution_domain
#     zone_id                = var.cloudfront_distribution_zone_id
#     evaluate_target_health = false
#   }
# }

# -----------------------------------------------------------------------------
# Registro WWW (si aplica)
# -----------------------------------------------------------------------------
# resource "aws_route53_record" "www" {
#   count = var.create_www_alias && var.subdomain == "" ? 1 : 0
#
#   zone_id = local.hosted_zone_id
#   name    = "www.${var.domain_name}"
#   type    = "A"
#
#   alias {
#     name                   = var.cloudfront_distribution_domain
#     zone_id                = var.cloudfront_distribution_zone_id
#     evaluate_target_health = false
#   }
# }

# =============================================================================
# API GATEWAY CUSTOM DOMAIN (Opcional)
# =============================================================================

# -----------------------------------------------------------------------------
# Certificado para API (puede ser regional)
# -----------------------------------------------------------------------------
# resource "aws_acm_certificate" "api" {
#   count = var.create_api_record ? 1 : 0
#
#   domain_name       = "${var.api_subdomain}.${var.domain_name}"
#   validation_method = "DNS"
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = {
#     Name        = "${var.name_prefix}-api-cert-${var.environment}"
#     Environment = var.environment
#   }
# }

# -----------------------------------------------------------------------------
# Validación del certificado de API
# -----------------------------------------------------------------------------
# resource "aws_route53_record" "api_cert_validation" {
#   for_each = var.create_api_record ? {
#     for dvo in aws_acm_certificate.api[0].domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   } : {}
#
#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = local.hosted_zone_id
# }

# resource "aws_acm_certificate_validation" "api" {
#   count = var.create_api_record ? 1 : 0
#
#   certificate_arn         = aws_acm_certificate.api[0].arn
#   validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
# }

# -----------------------------------------------------------------------------
# API Gateway Custom Domain
# -----------------------------------------------------------------------------
# resource "aws_apigatewayv2_domain_name" "api" {
#   count = var.create_api_record ? 1 : 0
#
#   domain_name = "${var.api_subdomain}.${var.domain_name}"
#
#   domain_name_configuration {
#     certificate_arn = aws_acm_certificate_validation.api[0].certificate_arn
#     endpoint_type   = "REGIONAL"
#     security_policy = "TLS_1_2"
#   }
#
#   tags = {
#     Name        = "${var.name_prefix}-api-domain-${var.environment}"
#     Environment = var.environment
#   }
# }

# -----------------------------------------------------------------------------
# Registro DNS para API Gateway
# -----------------------------------------------------------------------------
# resource "aws_route53_record" "api" {
#   count = var.create_api_record ? 1 : 0
#
#   zone_id = local.hosted_zone_id
#   name    = "${var.api_subdomain}.${var.domain_name}"
#   type    = "A"
#
#   alias {
#     name                   = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name
#     zone_id                = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].hosted_zone_id
#     evaluate_target_health = false
#   }
# }

# =============================================================================
# OUTPUTS - Se configuran en outputs.tf
# =============================================================================

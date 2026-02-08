# =============================================================================
# FRONTEND MODULE - S3 Static Website Hosting
# =============================================================================
# Este módulo configura un bucket S3 para hosting estático del frontend Angular
# Para testing inicial, se usa el endpoint de S3.
# Para producción, se recomienda habilitar CloudFront (descomentar sección).
# =============================================================================

# -----------------------------------------------------------------------------
# Desbloqueo de acceso público a nivel de CUENTA AWS
# -----------------------------------------------------------------------------
# NOTA: Esto afecta toda la cuenta AWS. Solo usar en dev/testing.
# Para producción, usar CloudFront en lugar de S3 público.
# -----------------------------------------------------------------------------
resource "aws_s3_account_public_access_block" "account" {
  count = var.allow_public_access ? 1 : 0

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# -----------------------------------------------------------------------------
# S3 Bucket para el Frontend
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.name_prefix}-frontend-${var.environment}"
  force_destroy = var.force_destroy

  tags = {
    Name        = "${var.name_prefix}-frontend-${var.environment}"
    Environment = var.environment
    Purpose     = "Frontend Static Website"
  }
}

# -----------------------------------------------------------------------------
# Configuración de Website Hosting
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = var.index_document
  }

  error_document {
    key = var.error_document
  }
}

# -----------------------------------------------------------------------------
# Bloqueo de acceso público - Deshabilitado para website hosting
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# -----------------------------------------------------------------------------
# Política del Bucket - Acceso público de lectura
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  # Esperar a que el bloqueo de acceso público se configure (bucket y cuenta)
  depends_on = [
    aws_s3_bucket_public_access_block.frontend,
    aws_s3_account_public_access_block.account
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Configuración de CORS
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_cors_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# -----------------------------------------------------------------------------
# Versionamiento del Bucket (opcional, recomendado para rollbacks)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

# =============================================================================
# CLOUDFRONT DISTRIBUTION (Descomentar cuando se necesite)
# =============================================================================
# CloudFront proporciona:
# - CDN global con menor latencia
# - HTTPS con certificado personalizado
# - Caché en edge locations
# - Protección DDoS básica
# =============================================================================

# resource "aws_cloudfront_origin_access_control" "frontend" {
#   count = var.enable_cloudfront ? 1 : 0
#
#   name                              = "${var.name_prefix}-frontend-oac-${var.environment}"
#   description                       = "OAC for ${var.name_prefix} frontend"
#   origin_access_control_origin_type = "s3"
#   signing_behavior                  = "always"
#   signing_protocol                  = "sigv4"
# }

# resource "aws_cloudfront_distribution" "frontend" {
#   count = var.enable_cloudfront ? 1 : 0
#
#   enabled             = true
#   is_ipv6_enabled     = true
#   default_root_object = var.index_document
#   comment             = "${var.name_prefix} Frontend - ${var.environment}"
#   price_class         = var.cloudfront_price_class
#
#   # Dominio personalizado (si está configurado)
#   aliases = var.domain_name != "" ? [var.domain_name] : []
#
#   origin {
#     domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
#     origin_id                = "S3-${aws_s3_bucket.frontend.id}"
#     origin_access_control_id = aws_cloudfront_origin_access_control.frontend[0].id
#   }
#
#   default_cache_behavior {
#     allowed_methods  = ["GET", "HEAD", "OPTIONS"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "S3-${aws_s3_bucket.frontend.id}"
#
#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }
#
#     viewer_protocol_policy = "redirect-to-https"
#     min_ttl                = 0
#     default_ttl            = 3600
#     max_ttl                = 86400
#     compress               = true
#   }
#
#   # Configuración para SPA - redirigir 403/404 a index.html
#   custom_error_response {
#     error_caching_min_ttl = 10
#     error_code            = 403
#     response_code         = 200
#     response_page_path    = "/${var.index_document}"
#   }
#
#   custom_error_response {
#     error_caching_min_ttl = 10
#     error_code            = 404
#     response_code         = 200
#     response_page_path    = "/${var.index_document}"
#   }
#
#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }
#
#   # Certificado SSL
#   viewer_certificate {
#     # Si hay certificado ACM, usarlo; sino, usar el default de CloudFront
#     acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
#     cloudfront_default_certificate = var.acm_certificate_arn == ""
#     ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
#     minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null
#   }
#
#   tags = {
#     Name        = "${var.name_prefix}-frontend-cdn-${var.environment}"
#     Environment = var.environment
#   }
# }

# -----------------------------------------------------------------------------
# Política del Bucket para CloudFront (usar en lugar de la pública)
# -----------------------------------------------------------------------------
# Cuando se habilite CloudFront, reemplazar aws_s3_bucket_policy.frontend con:
#
# resource "aws_s3_bucket_policy" "frontend_cloudfront" {
#   count  = var.enable_cloudfront ? 1 : 0
#   bucket = aws_s3_bucket.frontend.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid       = "AllowCloudFrontServicePrincipal"
#         Effect    = "Allow"
#         Principal = {
#           Service = "cloudfront.amazonaws.com"
#         }
#         Action   = "s3:GetObject"
#         Resource = "${aws_s3_bucket.frontend.arn}/*"
#         Condition = {
#           StringEquals = {
#             "AWS:SourceArn" = aws_cloudfront_distribution.frontend[0].arn
#           }
#         }
#       }
#     ]
#   })
# }

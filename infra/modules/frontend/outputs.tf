output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.frontend.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

# URL del Website (S3 endpoint)
output "website_endpoint" {
  description = "S3 static website endpoint URL"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "website_url" {
  description = "Full URL of the S3 static website"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

# CloudFront outputs (descomentar cuando se habilite)
# output "cloudfront_distribution_id" {
#   description = "ID of the CloudFront distribution"
#   value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].id : null
# }

# output "cloudfront_domain_name" {
#   description = "Domain name of the CloudFront distribution"
#   value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].domain_name : null
# }

# output "cloudfront_url" {
#   description = "Full HTTPS URL of CloudFront distribution"
#   value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.frontend[0].domain_name}" : null
# }

# URL final del sitio (S3 o CloudFront según configuración)
output "site_url" {
  description = "Final URL of the site (S3 or CloudFront)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
  # Cuando se habilite CloudFront, cambiar a:
  # value = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.frontend[0].domain_name}" : "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

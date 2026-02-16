output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_app_client_id" {
  value = module.cognito.app_client_id
}

output "cognito_hosted_ui" {
  value = module.cognito.hosted_ui_url
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "rds_port" {
  value = module.rds.port
}

output "db_secret_arn" {
  value = module.secrets.secret_arn
}

output "api_base_url" {
  value = "${module.api_gateway.api_base_url}/api/v1"
}

output "ecr_repository_url" {
  description = "URL del repositorio ECR para Lambda"
  value       = module.guides.ecr_repository_url
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda"
  value       = module.guides.lambda_function_name
}

# =============================================================================
# Frontend Outputs
# =============================================================================
output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket"
  value       = module.frontend.bucket_name
}

output "frontend_website_url" {
  description = "URL of the S3 static website (for testing)"
  value       = module.frontend.website_url
}

output "frontend_website_endpoint" {
  description = "S3 website endpoint"
  value       = module.frontend.website_endpoint
}

# DNS Outputs (descomentar cuando se habilite el módulo dns)
# output "frontend_domain_url" {
#   description = "Custom domain URL for the frontend"
#   value       = module.dns.frontend_url
# }
#
# output "certificate_arn" {
#   description = "ARN of the ACM certificate"
#   value       = module.dns.certificate_arn
# }

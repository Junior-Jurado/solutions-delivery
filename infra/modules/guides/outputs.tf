output "ecr_repository_url" {
  description = "URL del repositorio ECR"
  value       = module.lambda.ecr_repository_url
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda"
  value       = module.lambda.lambda_function_name
}
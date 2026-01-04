output "ecr_repository_url" {
  description = "URL del repositorio ECR"
  value       = module.lambda.ecr_repository_url
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda"
  value       = module.lambda.lambda_function_name
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "lambda_function_arn" {
  description = "ARN of the PDF Lambda function"
  value       = module.lambda.lambda_function_arn
}

output "lambda_invoke_arn" {
  description = "Invoke ARN of the PDF Lambda function"
  value       = module.lambda.lambda_invoke_arn
}

output "function_name" {
  value       = aws_lambda_function.this.function_name
  description = "Nombre de la función Lambda"
}

output "lambda_invoke_arn" {
  value       = aws_lambda_function.this.invoke_arn
  description = "ARN de invocación de la función Lambda"
}

output "lambda_role_name" {
  value       = aws_iam_role.lambda_create_guides.name
  description = "Nombre del rol IAM asociado a la Lambda"
}

output "lambda_arn" {
  value       = aws_lambda_function.this.arn
  description = "ARN de la función Lambda"
}


output "ecr_repository_url" {
  description = "URL del repositorio ECR"
  value       = aws_ecr_repository.lambda_pdf_repo.repository_url
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda"
  value       = aws_lambda_function.this.function_name
}
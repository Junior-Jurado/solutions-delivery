output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}

output "post_confirm_lambda_name" {
  value = aws_lambda_function.post_confirm.function_name
}

output "post_confirm_lambda_arn" {
  value = aws_lambda_function.post_confirm.arn
}

output "api_base_url" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "api_id" {
  value = aws_apigatewayv2_api.api.id
}

output "execution_arn" {
  value = aws_apigatewayv2_api.api.execution_arn
}

output "authorizer_id" {
  value = aws_apigatewayv2_authorizer.cognito.id
}
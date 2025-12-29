resource "aws_apigatewayv2_integration" "guides_lambda" {
  api_id = var.api_id
  integration_type = "AWS_PROXY"
  integration_uri = module.lambda.lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_guide" {
  api_id = var.api_id
  route_key = "POST /api/v1/guides"
  target = "integrations/${aws_apigatewayv2_integration.guides_lambda.id}"

  authorization_type = "JWT"
  authorizer_id = var.authorizer_id
}
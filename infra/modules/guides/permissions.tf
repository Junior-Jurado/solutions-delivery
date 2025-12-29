resource "aws_lambda_permission" "allow_apigw" {
  statement_id = "AllowAPIGatewayInvoke"
  action = "lambda:InvokeFunction"
  function_name = module.lambda.function_name
  principal = "apigateway.amazonaws.com"
  source_arn = "${var.api_execution_arn}/*/*"
}
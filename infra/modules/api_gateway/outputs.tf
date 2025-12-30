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

output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

# OUTPUTS - Endpoints específicos
output "endpoints" {
  description = "Endpoints disponibles de la API"
  value = {
    # Auth
    auth_role     = "${aws_apigatewayv2_stage.default.invoke_url}/api/v1/auth/role"
   
    # Locations
    locations_departments = "${aws_apigatewayv2_stage.default.invoke_url}/api/v1/locations/departments"
    locations_cities      = "${aws_apigatewayv2_stage.default.invoke_url}/api/v1/locations/cities"
    locations_search      = "${aws_apigatewayv2_stage.default.invoke_url}/api/v1/locations/search"
  }
}
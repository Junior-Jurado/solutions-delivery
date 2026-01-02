resource "aws_apigatewayv2_api" "api" {
  name          = "${var.name_prefix}-http-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "http://localhost:4200"
    ]

    allow_methods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ]

    allow_headers = [
      "Content-Type",
      "Authorization"
    ]

    expose_headers = [ 
      "Authorization"
     ]

     max_age = 3600
  }
}

# Cognito JWT authorizer
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id = aws_apigatewayv2_api.api.id
  name   = "${var.name_prefix}-jwt-authorizer"

  authorizer_type = "JWT"
  identity_sources = [
    "$request.header.Authorization"
  ]

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# Integración con Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.lambda_api_invoke_arn
  payload_format_version = "2.0"
}

# Deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.api.id
  name   = "$default"
  auto_deploy = true
}

# Lambda permission
resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_api_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# RUTAS PROTEGIDAS

# -----------------------------------------
## Auth
resource "aws_apigatewayv2_route" "auth_role" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/auth/role"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id = aws_apigatewayv2_authorizer.cognito.id
}
# -----------------------------------------

## Locations
resource "aws_apigatewayv2_route" "locations_cities" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/locations/cities"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/locations/cities/{id} - Obtener ciudad por ID (Protegida)
resource "aws_apigatewayv2_route" "locations_city_by_id" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/locations/cities/{id}"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/locations/search - Buscar ciudades (Protegida)
resource "aws_apigatewayv2_route" "locations_search" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/locations/search"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /guides/{id}/pdf
resource "aws_apigatewayv2_route" "guides_pdf" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/guides/{id}/pdf"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# -----------------------------------------
# Guides

# GET /api/v1/guides
resource "aws_apigatewayv2_route" "guides" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/guides"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/guides/{id}
resource "aws_apigatewayv2_route" "guides_by_id" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/guides/{id}"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/guides/stats
resource "aws_apigatewayv2_route" "guides_stats" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/guides/stats"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/guides/search
resource "aws_apigatewayv2_route" "guides_search" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/guides/search"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# PUT /guides/{id}/status
resource "aws_apigatewayv2_route" "guides_status" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "PUT /api/v1/guides/{id}/status"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

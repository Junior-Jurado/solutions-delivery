resource "aws_apigatewayv2_api" "api" {
  name          = "${var.name_prefix}-http-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allowed_origins

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
resource "aws_apigatewayv2_route" "locations_departments" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/locations/departments"

  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

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

# -----------------------------------------
# Cash Closes

# POST /api/v1/cash-close - Generar cierre
resource "aws_apigatewayv2_route" "cash_close_create" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/cash-close"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/cash-close - Listar cierres
resource "aws_apigatewayv2_route" "cash_close_list" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/cash-close"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/cash-close/stats - Estadísticas
resource "aws_apigatewayv2_route" "cash_close_stats" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/cash-close/stats"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/cash-close/{id} - Ver cierre específico
resource "aws_apigatewayv2_route" "cash_close_by_id" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/cash-close/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# GET /api/v1/cash-close/{id}/pdf - Obtener PDF
resource "aws_apigatewayv2_route" "cash_close_pdf" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/cash-close/{id}/pdf"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# -----------------------------------------
# Client

// GET /api/v1/client/profile - Obtener perfil del cliente
resource "aws_apigatewayv2_route" "get_client_profile" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/client/profile"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// PUT /api/v1/client/profile - Actualizar perfil del cliente
resource "aws_apigatewayv2_route" "put_client_profile" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "PUT /api/v1/client/profile"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /client/guides/active - Obtener guías activas
resource "aws_apigatewayv2_route" "get_guides_active" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/client/guides/active"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /client/guides/history
resource "aws_apigatewayv2_route" "get_guides_history" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/client/guides/history"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /client/guides/track/{guideNumber} - Rastrear guía por número
resource "aws_apigatewayv2_route" "get_guides_track" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/client/guides/track/{guideNumber}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /client/guides/stats
resource "aws_apigatewayv2_route" "get_guides_stats" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/client/guides/stats"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id 
}

// GET /client/ratings/pending
resource "aws_apigatewayv2_route" "get_ratings_pending" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/client/ratings/pending"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// POST /client/ratings
resource "aws_apigatewayv2_route" "post_ratings" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/client/ratings"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# -----------------------------------------
# Frequent Parties

// GET /frequent-parties/search-by-name - Buscar por nombre o documento
resource "aws_apigatewayv2_route" "frequent_parties_search_by_name" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/frequent-parties/search-by-name"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /frequent-parties/by-name-and-city - Obtener direcciones por nombre y ciudad
resource "aws_apigatewayv2_route" "frequent_parties_by_name_and_city" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/frequent-parties/by-name-and-city"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /frequent-parties/by-document
resource "aws_apigatewayv2_route" "frequent_parties_by_document" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/frequent-parties/by-document"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// POST /frequent-parties - Crear nueva dirección
resource "aws_apigatewayv2_route" "frequent_parties_create" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/frequent-parties"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /frequent-parties/stats
resource "aws_apigatewayv2_route" "frequent_parties_stats" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/frequent-parties/stats"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# -----------------------------------------
# Assignments

// POST /assignments - Crear nueva asignación
resource "aws_apigatewayv2_route" "assignments_create" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/assignments"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments
resource "aws_apigatewayv2_route" "assignments" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments/my
resource "aws_apigatewayv2_route" "assignments_my" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/my"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments/my/performance
resource "aws_apigatewayv2_route" "assignments_my_performance" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/my/performance"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments/delivery-users
resource "aws_apigatewayv2_route" "assignments_delivery_users" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/delivery-users"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments/pending-guides
resource "aws_apigatewayv2_route" "assignments_pending_guides" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/pending-guides"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments/stats
resource "aws_apigatewayv2_route" "assignments_stats" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/stats"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}


// GET /assignments/{id}
resource "aws_apigatewayv2_route" "assignments_by_id" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// PUT /assignments/{id}/reassign
resource "aws_apigatewayv2_route" "assignments_reassign" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "PUT /api/v1/assignments/{id}/reassign"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// PUT /assignments/{id}/status
resource "aws_apigatewayv2_route" "assignments_status" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "PUT /api/v1/assignments/{id}/status"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /assignments/{id}/history
resource "aws_apigatewayv2_route" "assignments_history" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/assignments/{id}/history"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# -----------------------------------------
# ADMIN

// GET /admin/stats
resource "aws_apigatewayv2_route" "admin_stats" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/admin/stats"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /admin/employees
resource "aws_apigatewayv2_route" "admin_employees" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/admin/employees"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /admin/users/search
resource "aws_apigatewayv2_route" "admin_users_search" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/admin/users/search"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /admin/employees/{id}
resource "aws_apigatewayv2_route" "admin_employees_by_id" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/admin/employees/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// POST /admin/employees/{id}
resource "aws_apigatewayv2_route" "admin_employees_create" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/admin/employees/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// PUT /admin/employees/{id} - Actualizar empleado (rol, etc.)
resource "aws_apigatewayv2_route" "admin_employees_update" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "PUT /api/v1/admin/employees/{id}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

// GET /admin/clients/ranking - Obtener ranking de mejores clientes
resource "aws_apigatewayv2_route" "admin_clients_ranking" {
  api_id = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/admin/clients/ranking"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
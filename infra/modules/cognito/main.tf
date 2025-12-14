resource "aws_cognito_user_pool" "this" {
  name = "${var.name_prefix}-user-pool-${var.environment}"

  auto_verified_attributes = ["email"]

  # SOLO UNO de estos debe tener email, no ambos
  username_attributes = ["email"]
  # alias_attributes         = ["email"]

  mfa_configuration = "OFF"

  password_policy {
    minimum_length = 8
    require_lowercase = true
    require_numbers = true
    require_symbols = false
    require_uppercase = true
    temporary_password_validity_days = 7
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }
  # =========================
  # FULL NAME
  # =========================
  schema {
    name = "full_name"
    attribute_data_type = "string"
    required = false
    mutable = true

    string_attribute_constraints {
      min_length = 2
      max_length = 100
    }
  }

  # =========================
  # TYPE DOCUMENT
  # =========================
  schema {
    name                = "type_document"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 2
      max_length = 10
    }
  }

  # =========================
  # NUMBER DOCUMENT
  # =========================
  schema {
    name = "number_document"
    attribute_data_type = "string"
    required = false
    mutable = true

    string_attribute_constraints {
      min_length = 5
      max_length = 30
    }
  }

  # # =========================
  # # ROLE (user / worker / admin)
  # # =========================
  # schema {
  #   name                = "role"
  #   attribute_data_type = "String"
  #   required            = false
  #   mutable             = true

  #   string_attribute_constraints {
  #     min_length = 3
  #     max_length = 20
  #   }
  # }


  # Agregar triggers aquí
  lambda_config {
    post_confirmation     = var.post_confirmation_lambda_arn
    
  }
  
  lifecycle {
    prevent_destroy = false
  }
}


resource "aws_cognito_user_pool_client" "spa" {
  name = "${var.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.this.id

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
  
  allowed_oauth_flows = ["code"]
  allowed_oauth_scopes = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true

  callback_urls = var.callback_urls
  logout_urls = var.logout_urls

  generate_secret = false
  prevent_user_existence_errors = "ENABLED"
  refresh_token_validity = var.refresh_token_validity_days

  token_validity_units {
    access_token = "hours"
    id_token = "hours"
    refresh_token = "days"
  }
  access_token_validity  = var.access_token_validity_hours
  id_token_validity      = var.id_token_validity_hours
  
  # Configuraciones OAuth
  supported_identity_providers = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "hosted" {
  domain = "${var.domain_prefix}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id
}


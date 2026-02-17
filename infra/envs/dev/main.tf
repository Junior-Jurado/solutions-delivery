module "artifacts" {
  source = "../../modules/artifacts"
  environment = var.environment
  name_prefix = var.name_prefix
}

module "cognito" {
  source                       = "../../modules/cognito"
  environment                  = var.environment
  aws_region                   = var.aws_region
  name_prefix                  = var.name_prefix
  domain_prefix                = var.name_prefix
  callback_urls                = ["https://localhost:3000/callback"]
  logout_urls                  = ["https://localhost:3000/logout"]
  access_token_validity_hours  = 2
  id_token_validity_hours      = 24
  refresh_token_validity_days  = 30
  post_confirmation_lambda_arn = module.lambda_custom_auth.post_confirm_lambda_arn

}

module "rds" {
  source                = "../../modules/rds"
  environment           = var.environment
  aws_region            = var.aws_region
  name_prefix           = var.name_prefix
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = "db.t3.micro"
  allocated_storage     = 20
  master_username       = var.db_username
  master_password       = module.secrets.db_password
  db_name               = var.db_name
  publicly_accessible   = var.publicly_accessible
  backup_retention_days = 7
}


module "secrets" {
  source      = "../../modules/secrets"
  environment = var.environment
  aws_region  = var.aws_region
  name_prefix = var.name_prefix
  db_username = var.db_username
  db_engine   = "mysql"
  db_host     = module.rds.endpoint
  db_port     = module.rds.port
  db_name     = var.db_name
}

module "lambda_custom_auth" {
  source                = "../../modules/lambda_custom_auth"
  environment           = var.environment
  aws_region            = var.aws_region
  name_prefix           = var.name_prefix
  db_secret_arn         = module.secrets.secret_arn
  cognito_user_pool_arn = module.cognito.user_pool_arn
  secret_name           = module.secrets.secret_name
  artifacts_bucket = module.artifacts.bucket_name
  s3_key = "auth/main.zip"
}

module "api_gateway" {
  source                = "../../modules/api_gateway"
  environment           = var.environment
  aws_region            = var.aws_region
  name_prefix           = var.name_prefix
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_client_id     = module.cognito.app_client_id
  lambda_api_invoke_arn = module.lambda_api.invoke_arn
  lambda_api_name       = module.lambda_api.function_name

  # CORS - Orígenes permitidos
  cors_allowed_origins = [
    "http://localhost:4200",
    "http://${var.name_prefix}-frontend-${var.environment}.s3-website-us-east-1.amazonaws.com"
  ]
}

module "guides" {
  source = "../../modules/guides"

  environment = var.environment
  name_prefix = var.name_prefix
  aws_region  = var.aws_region
  secret_name = module.secrets.secret_name
  db_secret_arn = module.secrets.secret_arn
  api_id            = module.api_gateway.api_id
  api_execution_arn = module.api_gateway.execution_arn
  authorizer_id     = module.api_gateway.authorizer_id
}

module "lambda_api" {
  source        = "../../modules/lambda_api"
  environment   = var.environment
  aws_region    = var.aws_region
  name_prefix   = var.name_prefix
  db_secret_arn = module.secrets.secret_arn
  secret_name   = module.secrets.secret_name
  s3_bucket_name = module.guides.s3_bucket_name
  pdf_lambda_function_name = module.guides.lambda_function_name
  pdf_lambda_arn = module.guides.lambda_function_arn
  artifacts_bucket = module.artifacts.bucket_name
  s3_key           = "backend/main.zip"
}

# =============================================================================
# FRONTEND - S3 Static Website Hosting
# =============================================================================
module "frontend" {
  source = "../../modules/frontend"

  environment   = var.environment
  aws_region    = var.aws_region
  name_prefix   = var.name_prefix
  force_destroy = var.frontend_force_destroy

  # Habilitar acceso público global (para compartir URL con cliente)
  allow_public_access = var.frontend_allow_public_access

  # Configuración del website
  index_document = "index.html"
  error_document = "index.html" # SPA: redirigir todo a index.html

  # CORS - Permitir acceso desde localhost en desarrollo
  allowed_origins = ["*"]

  # CloudFront deshabilitado por ahora (para testing con S3 directo)
  enable_cloudfront = false

  # Estas variables se usarán cuando se habilite CloudFront + DNS
  # acm_certificate_arn = module.dns.certificate_arn
  # domain_name         = var.domain_name
}

# =============================================================================
# DNS - ACM + Route53 (COMENTADO - Descomentar cuando se tenga el dominio)
# =============================================================================
# INSTRUCCIONES:
# 1. Configurar var.domain_name en variables.tf o en dev.tfvars
# 2. Si ya tienes una hosted zone, configurar var.hosted_zone_id
# 3. Descomentar el módulo de abajo
# 4. Ejecutar terraform plan/apply
# =============================================================================

# module "dns" {
#   source = "../../modules/dns"
#
#   environment = var.environment
#   aws_region  = var.aws_region
#   name_prefix = var.name_prefix
#
#   # Configuración del dominio
#   domain_name        = var.domain_name  # Ej: "dev.solutions-delivery.com"
#   subdomain          = ""               # "" para root, "app" para app.domain.com
#   create_www_alias   = false            # En dev no necesitamos www
#
#   # Route53
#   create_hosted_zone = false            # true si necesitas crear la zona
#   hosted_zone_id     = var.hosted_zone_id
#
#   # ACM
#   create_certificate = true
#
#   # CloudFront (descomentar cuando se habilite en el módulo frontend)
#   # cloudfront_distribution_domain = module.frontend.cloudfront_domain_name
#   # cloudfront_distribution_zone_id = "Z2FDTNDATAQYW2"
#
#   # API Gateway custom domain (opcional)
#   create_api_record  = false
#   api_subdomain      = "api"
# }
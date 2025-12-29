module "lambda" {
  source       = "./lambda"
  environment = var.environment
  name_prefix  = var.name_prefix
  aws_region   = var.aws_region
  secret_name = var.secret_name
  db_secret_arn = var.db_secret_arn
  s3_bucket_name       = module.s3.bucket_name
}

module "s3" {
  source       = "./s3"
  name_prefix = var.name_prefix
  environment = var.environment
  lambda_role_name = module.lambda.lambda_role_name
}

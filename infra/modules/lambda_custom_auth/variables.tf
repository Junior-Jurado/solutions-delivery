variable "aws_region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "db_secret_arn" {
  type = string
}

variable "cognito_user_pool_arn" {
  type = string
}

variable "secret_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "artifacts_bucket" {
  description = "Nombre del bucket S3 donde están los .zip de las lambdas"
  type = string
}

variable "s3_key" {
  description = "Ruta del .zip dentro del bucket S3"
  default = "auth/main.zip"
}

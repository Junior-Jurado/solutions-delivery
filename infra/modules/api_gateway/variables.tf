variable "aws_region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_client_id" {}

variable "lambda_api_invoke_arn" {}

variable "lambda_api_name" {
  type = string
}

variable "environment" {
  type = string
}
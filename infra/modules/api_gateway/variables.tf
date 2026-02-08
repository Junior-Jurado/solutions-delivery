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

variable "cors_allowed_origins" {
  description = "Lista de orígenes permitidos para CORS"
  type        = list(string)
  default     = ["http://localhost:4200"]
}
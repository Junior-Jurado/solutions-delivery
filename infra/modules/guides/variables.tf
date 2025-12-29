variable "environment" {
  type        = string 
}

variable "name_prefix" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "api_id" {
  description = "Id del Api Gateway principal"  
}

variable "authorizer_id" {
  description = "ID del cognito authorizer"
}

variable "api_execution_arn" {}
variable "secret_name" {}
variable "db_secret_arn" {}
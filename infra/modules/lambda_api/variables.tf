
variable "aws_region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "db_secret_arn" {
  type = string
}

variable "secret_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "s3_bucket_name" {
  type = string
}

variable "pdf_lambda_function_name" {
  type = string
}

variable "pdf_lambda_arn" {
  type = string
}

variable "artifacts_bucket" {
  type = string
}

variable "s3_key" {
  type = string
}
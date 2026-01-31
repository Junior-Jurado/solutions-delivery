variable "environment" {
  type        = string 
}

variable "name_prefix" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for PDFs"
  type        = string
}

variable "db_secret_arn" {
  type = string
}

variable "secret_name" {
  type = string
}


variable "aws_region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "domain_prefix" {
  type = string
}

variable "callback_urls" {
  type = list(string)
}

variable "logout_urls" {
  type = list(string)
}

variable "access_token_validity_hours" {
  type = number
  default = 2
}

variable "id_token_validity_hours" {
  type = number
  default = 24
}

variable "refresh_token_validity_days" {
  type = number
  default = 30
}

variable "post_confirmation_lambda_arn" {
    type = string
    default = ""
}

variable "define_auth_challenge_lambda_arn" { 
  type = string 
  default = "" 
}
variable "create_auth_challenge_lambda_arn" { 
  type = string 
  default = "" 
}
variable "verify_auth_challenge_lambda_arn" {
  type = string 
  default = "" 
}

variable "environment" {
  type = string
}
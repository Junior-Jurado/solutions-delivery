variable "aws_region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "db_username" {
  type = string
  default = "solutions_admins"
}

variable "db_engine" {
  type = string
  default = "mysql"
}

variable "db_host" {
  type = string
}

variable "db_port" {
  type = string
  default = "3306"
}

variable "db_name" {
  type = string
  default = "solutions_db"
}

variable "environment" {
  type = string
}
variable "aws_region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "engine" {
  type = string
  default = "mysql"
}

variable "engine_version" {
  type = string
  default = "8.0"
}

variable "instance_class" {
  type = string
  default = "db.t3.micro"
}

variable "allocated_storage" {
  type = number
  default = 20
}

variable "master_username" {
  type = string
}

variable "master_password" {
  type = string
  sensitive = true
}

variable "db_name" {
  type = string
}

variable "publicly_accessible" {
  type = bool
  default = false
}


variable "backup_retention_days" {
  type = number
  default = 7
}

variable "skip_final_snapshot" {
  type = bool
  default = true
}

variable "deletion_protection" {
  type = bool
  default = false
}

variable "environment" {
  type = string
}
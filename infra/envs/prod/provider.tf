terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # =========================================================================
  # REMOTE STATE - S3 + DynamoDB
  # =========================================================================
  # Mismo bucket que dev pero key diferente (prod/terraform.tfstate).
  # Cada environment tiene su propio state, no se mezclan.
  # =========================================================================
  backend "s3" {
    bucket         = "solutions-terraform-state-386452074334"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "solutions-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
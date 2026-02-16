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
  # Tanto tu PC como GitHub Actions usan este mismo state.
  # Si haces terraform destroy, se destruye TODO (incluido lo que deployo CI/CD).
  #
  # DynamoDB lock: si alguien esta haciendo apply, nadie mas puede al mismo tiempo.
  #
  # IMPORTANTE: Antes de hacer terraform init por primera vez con este backend,
  # ejecuta: ./bootstrap-state.sh (crea el bucket y la tabla)
  # =========================================================================
  backend "s3" {
    bucket         = "solutions-terraform-state-386452074334"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "solutions-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
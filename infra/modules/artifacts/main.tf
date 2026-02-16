resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.name_prefix}-lambda-artifacts-${var.environment}"

  force_destroy = var.environment == "dev" ? true : false

  tags = {
      Name        = "${var.name_prefix}-lambda-artifacts-${var.environment}"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
}

# Versionado por si deploys fallan
resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Bloquear acceso público -> estos son binarios internos
resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

# Lifecycle -> borrar versiones viejas despues de 30 días
resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
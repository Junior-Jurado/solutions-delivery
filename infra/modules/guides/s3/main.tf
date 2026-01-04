resource "aws_s3_bucket" "pdfs" {
  bucket = "${var.name_prefix}-pdfs"
}

# Configuración CORS para permitir fetch desde el frontend
resource "aws_s3_bucket_cors_configuration" "pdfs" {
  bucket = aws_s3_bucket.pdfs.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = [
      "http://localhost:4200",
      "http://localhost:3000",
      # Agrega aquí tu dominio de producción
      # "https://tu-dominio.com"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.pdfs.id

  # regla para archivar guias PDFs
  rule {
    id     = "archive-old-pdfs"
    status = "Enabled"

    filter {
      prefix = "guias/"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }

  # Regla para cierre de caja PDFs
  rule {
    id     = "archive-cash-closes"
    status = "Enabled"
    filter {
      prefix = "cash-closes/"
    }

    transition {
      days          = 180 # 6 meses antes de archivar
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 años (retención legal contable en Colombia)
    }
  }
}

resource "aws_iam_policy" "lambda_s3_put" {
  name        = "${var.name_prefix}-lambda-s3-policy"
  description = "Permite que Lambda suba PDFs al bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "arn:aws:s3:::${var.name_prefix}-pdfs/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = var.lambda_role_name
  policy_arn = aws_iam_policy.lambda_s3_put.arn
}

resource "aws_iam_policy" "lambda_s3_get" {
  name = "${var.name_prefix}-lambda-s3-get"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectAttributes"
        ]
        Resource = "arn:aws:s3:::${var.name_prefix}-pdfs/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::${var.name_prefix}-pdfs"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_get_attach" {
  role       = var.lambda_role_name
  policy_arn = aws_iam_policy.lambda_s3_get.arn
}
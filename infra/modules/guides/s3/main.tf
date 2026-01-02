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
}

# resource "aws_s3_bucket_public_access_block" "this" {
#   bucket = aws_s3_bucket.pdfs.id

#   block_public_acls       = false
#   block_public_policy     = false
#   ignore_public_acls      = false
#   restrict_public_buckets = false
# }


# resource "aws_s3_bucket_policy" "public_pdf" {
#   bucket = aws_s3_bucket.pdfs.id
#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect = "Allow",
#         Principal = "*",
#         Action = ["s3:GetObject"],
#         Resource = "arn:aws:s3:::${aws_s3_bucket.pdfs.id}/*"
#       }
#     ]
#   })
# }

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

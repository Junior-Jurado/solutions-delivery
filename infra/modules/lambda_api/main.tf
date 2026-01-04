resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-apilambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_lambda_function" "api" {
  function_name = "${var.name_prefix}-api-${var.environment}"
  handler = "bootstrap"
  runtime = "provided.al2023"
  role = aws_iam_role.lambda_role.arn

  filename = "${path.module}/src/main.zip"
  source_code_hash = filebase64sha256("${path.module}/src/main.zip")
 
  architectures = [ "arm64" ]
  timeout = 60
  memory_size = 1024

  environment {
    variables = {
      DB_SECRET_ARN = var.db_secret_arn,
      SecretName = var.secret_name
      UrlPrefix = "/api/v1"
      S3_BUCKET_NAME = var.s3_bucket_name
      PDF_LAMBDA_FUNCTION = var.pdf_lambda_function_name
    }
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Secrets Manager Access
resource "aws_iam_policy" "lambda_secrets_policy" {
  name = "${var.name_prefix}-secrets-policy-${var.environment}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect = "Allow"
        Resource = var.db_secret_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secrets_attach" {
  role = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_secrets_policy.arn
}

# Politicas S3
resource "aws_iam_policy" "lambda_s3_full" {
  name = "${var.name_prefix}-lambda-s3-full-${var.environment}"
  description = "Permite a Lambda leer y escribir en el bucket de S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectAttributes"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_attach" {
  role = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_s3_full.arn
}

# Política para invocar Lambda de PDFs (Node.js)
resource "aws_iam_policy" "lambda_invoke_pdf" {
  name = "${var.name_prefix}-lambda-invoke-pdf-${var.environment}"
  description = "Permite a Lambda API invocar la Lambda de generación de PDFs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = var.pdf_lambda_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_invoke_pdf_attach" {
  role = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_invoke_pdf.arn
}
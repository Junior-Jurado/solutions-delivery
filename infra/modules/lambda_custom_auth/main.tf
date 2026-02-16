# VPC por defecto
data "aws_vpc" "default" {
  default = true
}
# Subnets por defecto dentro de esa VPC
data "aws_subnets" "default" {
  filter {
    name = "default-for-az"
    values = [ "true" ]
  }
}

# Security groups por defecto dentro de esa VPC
data "aws_security_groups" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# LEER .zip DESDE S3
data "aws_s3_object" "lambda_zip" {
  bucket = var.artifacts_bucket
  key = var.s3_key
}

resource "aws_iam_role" "lambda" {
  name = "${var.name_prefix}-lambda-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Sid = ""
      }
    ]
  })
}

# Logs & CloudWatch 
resource "aws_iam_role_policy_attachment" "basic" {
  role = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC - Requerida
resource "aws_iam_role_policy_attachment" "vpc_access" {
  role = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Secrets Manager
resource "aws_iam_policy_attachment" "secrets_attach" {
  name = "${var.name_prefix}-attach-secrets-${var.environment}"
  policy_arn = aws_iam_policy.secrets_policy.arn
  roles = [ aws_iam_role.lambda.name ]
}

resource "aws_iam_policy" "secrets_policy" {
  name = "${var.name_prefix}-lambda-secrets-policy-${var.environment}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Effect = "Allow"
        Resource = var.db_secret_arn
      }
    ]
  })
}

resource "aws_lambda_function" "post_confirm" {
  function_name = "${var.name_prefix}-post-confirmation-${var.environment}"
  role = aws_iam_role.lambda.arn
  handler = "bootstrap"
  runtime = "provided.al2023"
  architectures = [ "arm64" ]

  memory_size = 128
  timeout = 15

  s3_bucket = var.artifacts_bucket
  s3_key = var.s3_key
  source_code_hash = data.aws_s3_object.lambda_zip.etag
  
  environment {
    variables = {
      DB_SECRET_ARN = var.db_secret_arn,
      SecretName = var.secret_name
    }
  }
}

resource "aws_lambda_permission" "allow_cognito_post_confirm" {
  statement_id  = "AllowCognitoInvokePostConfirm"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirm.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = var.cognito_user_pool_arn
}

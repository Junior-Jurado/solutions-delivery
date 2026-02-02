##########################################
# IAM Role y Policies
##########################################

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_create_guides" {
  name               = "${var.name_prefix}-lambda-role_create_guides-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_create_guides" {
  role       = aws_iam_role.lambda_create_guides.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "lambda_secrets" {
  name = "${var.name_prefix}-lambda-secrets-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "${var.db_secret_arn}*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = aws_iam_role.lambda_create_guides.name
  policy_arn = aws_iam_policy.lambda_secrets.arn
}

## KMS
resource "aws_kms_key" "lambda_env" {
  description             = "KMS for Lambda env vars (${var.environment})"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "lambda_env" {
  name          = "alias/${var.name_prefix}-lambda-env-${var.environment}"
  target_key_id = aws_kms_key.lambda_env.key_id
}

resource "aws_iam_policy" "lambda_kms" {
  name = "${var.name_prefix}-lambda-kms-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.lambda_env.arn
      }
    ]
  })
}
resource "aws_kms_key_policy" "lambda_env" {
  key_id = aws_kms_key.lambda_env.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "EnableRootPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid = "AllowLambdaUse"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_create_guides.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_create_guides.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}

##########################################
# Data source para account ID
##########################################

data "aws_caller_identity" "current" {}

##########################################
# ECR Repository
##########################################

resource "aws_ecr_repository" "lambda_pdf_repo" {
  name = "${var.name_prefix}-lambda-repo-create_guides-${var.environment}"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

##########################################
# Lambda Function
##########################################

resource "aws_lambda_function" "this" {
  function_name = "${var.name_prefix}-lambda-create-guides-${var.environment}"
  package_type  = "Image"
  role          = aws_iam_role.lambda_create_guides.arn
  image_uri     = "${aws_ecr_repository.lambda_pdf_repo.repository_url}:latest"
  memory_size   = 768
  timeout       = 60

  
  kms_key_arn = aws_kms_key.lambda_env.arn

  architectures = ["x86_64"]

  environment {
    variables = {
      S3_BUCKET      = var.s3_bucket_name
      ENVIRONMENT    = var.environment
      DB_SECRET_NAME = var.secret_name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_kms,
    aws_kms_key_policy.lambda_env
  ]

  # lifecycle {
  #   ignore_changes = [image_uri]
  # }
}

##########################################
# CloudWatch Warmup
##########################################
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_event_rule" "keep_warm" {
  name                = "${var.name_prefix}-keep-lambda-warm-${var.environment}"
  description         = "Keep Lambda Warm"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.keep_warm.name
  target_id = "lambda"
  arn       = aws_lambda_function.this.arn
  input     = jsonencode({ warmup = true })
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.keep_warm.arn
}

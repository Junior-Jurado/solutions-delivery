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
  timeout = 20

  environment {
    variables = {
      DB_SECRET_ARN = var.db_secret_arn,
      SecretName = var.secret_name
      UrlPrefix = "/api/v1"
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
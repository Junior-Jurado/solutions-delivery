resource "random_password" "db_password" {
  length = 16
  special = false
}


resource "aws_secretsmanager_secret" "db_creds" {
  name = "${var.name_prefix}-db-credentials-${var.environment}"
  description = "RDS credentials for ${var.name_prefix} ${var.environment}"

  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_creds_version" {
  secret_id = aws_secretsmanager_secret.db_creds.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine = var.db_engine
    host = var.db_host
    port = var.db_port
    dbname = var.db_name
  })
}



output "secret_arn" {
  value = aws_secretsmanager_secret.db_creds.arn
}

output "db_password" {
  value = random_password.db_password.result 
}

output "secret_name" {
  value = aws_secretsmanager_secret.db_creds.name
}
output "user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.this.arn
}

output "app_client_id" {
    value = aws_cognito_user_pool_client.spa.id
}

output "cognito_domain" {
    value = aws_cognito_user_pool_domain.hosted.domain
}

output "hosted_ui_url" {
  value = "https://${aws_cognito_user_pool_domain.hosted.domain}/login?response_type=code&client_id=${aws_cognito_user_pool_client.spa.id}&redirect_uri=${urlencode(var.callback_urls[0])}"
}
## 🔐 IAM – Acceso a Secrets Manager

Las Lambdas acceden a Secrets Manager mediante la policy:

- Name: solutions-lambda-secrets-prod
- Rol: solutions-lambda-role_create_guides-prod

### Verificar policy activa

```bash
aws iam list-attached-role-policies \
  --role-name solutions-lambda-role_create_guides-prod

aws iam list-policy-versions \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/solutions-lambda-secrets-prod

# Comandos iniciales Terraform (prod)

## En infra/envs/prod
cd infra/envs/prov
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars" -auto-approve
terraform destroy -var-file="prod.tfvars" -auto-approve

# Para loguearse en cognito y obtener token
aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id 25vaa2k172genlkaf0731ip8j5 --auth-parameters USERNAME=germane.juradov+4@gmail.com,PASSWORD=G3rm4n**

# Eliminar lambda
aws lambda delete-function --function-name solutions-lambda-create-guides-prod
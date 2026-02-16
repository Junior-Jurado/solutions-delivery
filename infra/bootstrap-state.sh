#!/bin/bash
# =============================================================================
# BOOTSTRAP - Crear S3 + DynamoDB para Terraform Remote State
# =============================================================================
# Este script se ejecuta UNA SOLA VEZ para crear los recursos que Terraform
# necesita para guardar su state de forma remota.
#
# ¿Por que no se crea con Terraform?
#   Problema del huevo y la gallina: Terraform necesita el bucket para guardar
#   su state, pero no puede crear el bucket sin tener un state primero.
#   Por eso se crea con AWS CLI directamente.
#
# Uso:
#   ./bootstrap-state.sh          (crea en us-east-1)
#   ./bootstrap-state.sh prod     (mismos recursos, solo valida)
#
# Solo necesitas ejecutar esto UNA VEZ. Despues de eso, tanto tu PC como
# GitHub Actions usaran el mismo bucket para el state.
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_REGION="us-east-1"
BUCKET_NAME="solutions-terraform-state-386452074334"
DYNAMODB_TABLE="solutions-terraform-locks"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Bootstrap: Terraform Remote State${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# -----------------------------------------------------------------------------
# 1. Verificar AWS CLI
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/4]${NC} Verificando AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI no esta instalado${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}OK${NC} - Account: $AWS_ACCOUNT_ID"

# -----------------------------------------------------------------------------
# 2. Crear S3 Bucket para state
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[2/4]${NC} Creando bucket S3: ${BUCKET_NAME}..."

if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${GREEN}OK${NC} - Bucket ya existe"
else
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$AWS_REGION"

    # Habilitar versionamiento (permite recuperar states anteriores)
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled

    # Bloquear acceso publico
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
            BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

    # Encriptar por defecto
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration \
            '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

    echo -e "${GREEN}OK${NC} - Bucket creado"
fi

# -----------------------------------------------------------------------------
# 3. Crear tabla DynamoDB para state locking
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[3/4]${NC} Creando tabla DynamoDB: ${DYNAMODB_TABLE}..."

if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null | grep -q "ACTIVE"; then
    echo -e "${GREEN}OK${NC} - Tabla ya existe"
else
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"

    echo "Esperando que la tabla este activa..."
    aws dynamodb wait table-exists \
        --table-name "$DYNAMODB_TABLE" \
        --region "$AWS_REGION"

    echo -e "${GREEN}OK${NC} - Tabla creada"
fi

# -----------------------------------------------------------------------------
# 4. Verificar todo
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[4/4]${NC} Verificando..."

aws s3api head-bucket --bucket "$BUCKET_NAME"
aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" --query "Table.TableStatus" --output text

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Bootstrap completado!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "S3 Bucket:      ${BLUE}${BUCKET_NAME}${NC}"
echo -e "DynamoDB Table:  ${BLUE}${DYNAMODB_TABLE}${NC}"
echo -e "Region:          ${BLUE}${AWS_REGION}${NC}"
echo ""
echo -e "State keys:"
echo -e "  Dev:  ${BLUE}dev/terraform.tfstate${NC}"
echo -e "  Prod: ${BLUE}prod/terraform.tfstate${NC}"
echo ""
echo -e "${YELLOW}Siguiente paso:${NC}"
echo -e "  cd infra/envs/dev"
echo -e "  terraform init -migrate-state"
echo -e ""
echo -e "  cd infra/envs/prod"
echo -e "  terraform init -migrate-state"

exit 0

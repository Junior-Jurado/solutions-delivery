#!/bin/bash
# =============================================================================
# BUILD SCRIPT - Solutions Delivery Guides (Node.js Lambda - Docker)
# =============================================================================
# Construye y sube la imagen Docker para la Lambda de generacion de PDFs
# Usa Puppeteer + Chromium para renderizar HTML a PDF
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Configuracion
# -----------------------------------------------------------------------------
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${1:-dev}"

# Validar entorno
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}Error: Entorno invalido. Usa 'dev' o 'prod'${NC}"
    echo "Uso: ./build.sh dev"
    exit 1
fi

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Solutions Delivery - Guides Lambda Build${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "Entorno: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -----------------------------------------------------------------------------
# 1. Verificar requisitos
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/6]${NC} Verificando requisitos..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no esta instalado${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI no esta instalado${NC}"
    exit 1
fi

echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 2. Obtener Account ID y configurar ECR
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[2/6]${NC} Obteniendo configuracion AWS..."

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="solutions-lambda-repo-create_guides-${ENVIRONMENT}"
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG="${ECR_URL}/${ECR_REPO}:latest"

echo -e "Account ID: ${BLUE}$AWS_ACCOUNT_ID${NC}"
echo -e "ECR Repo: ${BLUE}$ECR_REPO${NC}"
echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 3. Login en ECR
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[3/6]${NC} Autenticando con ECR..."

aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_URL"

echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 4. Build de la imagen Docker
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[4/6]${NC} Construyendo imagen Docker..."

export DOCKER_BUILDKIT=0

docker build \
    --platform linux/amd64 \
    -t "$ECR_REPO" \
    -f Dockerfile \
    .

echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 5. Tag de la imagen
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[5/6]${NC} Etiquetando imagen..."

docker tag "$ECR_REPO:latest" "$IMAGE_TAG"

echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 6. Push a ECR
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[6/6]${NC} Subiendo imagen a ECR..."

docker push "$IMAGE_TAG"

echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# Resultado
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Build y Push completado!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "Imagen: ${BLUE}$IMAGE_TAG${NC}"

exit 0

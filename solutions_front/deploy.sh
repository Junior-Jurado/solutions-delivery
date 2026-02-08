#!/bin/bash
# =============================================================================
# DEPLOY SCRIPT - Solutions Delivery Frontend
# =============================================================================
# Uso:
#   ./deploy.sh dev     # Deploy a desarrollo
#   ./deploy.sh prod    # Deploy a producción
#   ./deploy.sh         # Por defecto: dev
# =============================================================================

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Configuración
# -----------------------------------------------------------------------------
PROJECT_NAME="solutions_front"
NAME_PREFIX="solutions"
DIST_PATH="dist/${PROJECT_NAME}/browser"

# Determinar entorno
ENVIRONMENT="${1:-dev}"

# Validar entorno
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}Error: Entorno inválido. Usa 'dev' o 'prod'${NC}"
    exit 1
fi

# Nombre del bucket según entorno
BUCKET_NAME="${NAME_PREFIX}-frontend-${ENVIRONMENT}"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Solutions Delivery - Frontend Deploy${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}Entorno:${NC} ${ENVIRONMENT}"
echo -e "${YELLOW}Bucket:${NC}  ${BUCKET_NAME}"
echo ""

# -----------------------------------------------------------------------------
# Verificaciones previas
# -----------------------------------------------------------------------------
echo -e "${BLUE}[1/4]${NC} Verificando requisitos..."

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI no está instalado${NC}"
    echo "Instala AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar credenciales AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Credenciales AWS no configuradas${NC}"
    echo "Ejecuta: aws configure"
    exit 1
fi

# Verificar que el bucket existe
if ! aws s3 ls "s3://${BUCKET_NAME}" &> /dev/null; then
    echo -e "${RED}Error: El bucket ${BUCKET_NAME} no existe${NC}"
    echo "Ejecuta primero terraform apply en infra/envs/${ENVIRONMENT}"
    exit 1
fi

echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# Build de Angular
# -----------------------------------------------------------------------------
echo -e "${BLUE}[2/4]${NC} Compilando Angular (production)..."

# Verificar que estamos en el directorio correcto
if [ ! -f "angular.json" ]; then
    echo -e "${RED}Error: No se encontró angular.json${NC}"
    echo "Ejecuta este script desde la carpeta solutions_front"
    exit 1
fi

# Build con configuración de producción
npm run build -- --configuration=production

if [ ! -d "$DIST_PATH" ]; then
    echo -e "${RED}Error: No se generó el directorio de build${NC}"
    exit 1
fi

echo -e "${GREEN}Build completado${NC}"

# -----------------------------------------------------------------------------
# Subir a S3
# -----------------------------------------------------------------------------
echo -e "${BLUE}[3/4]${NC} Subiendo archivos a S3..."

# Sync con delete para eliminar archivos viejos
aws s3 sync "$DIST_PATH" "s3://${BUCKET_NAME}" \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "index.html" \
    --exclude "*.json"

# Subir index.html y JSON sin caché (para que siempre cargue la versión nueva)
aws s3 cp "$DIST_PATH/index.html" "s3://${BUCKET_NAME}/index.html" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --content-type "text/html"

# Subir archivos JSON sin caché
for json_file in "$DIST_PATH"/*.json; do
    if [ -f "$json_file" ]; then
        aws s3 cp "$json_file" "s3://${BUCKET_NAME}/$(basename $json_file)" \
            --cache-control "no-cache,no-store,must-revalidate" \
            --content-type "application/json"
    fi
done

echo -e "${GREEN}Archivos subidos${NC}"

# -----------------------------------------------------------------------------
# Obtener URL del sitio
# -----------------------------------------------------------------------------
echo -e "${BLUE}[4/4]${NC} Obteniendo URL del sitio..."

WEBSITE_URL=$(aws s3api get-bucket-website --bucket "${BUCKET_NAME}" 2>/dev/null && \
    echo "http://${BUCKET_NAME}.s3-website-us-east-1.amazonaws.com" || \
    echo "http://${BUCKET_NAME}.s3-website.us-east-1.amazonaws.com")

# Intentar obtener la URL desde Terraform outputs si está disponible
INFRA_PATH="../infra/envs/${ENVIRONMENT}"
if [ -d "$INFRA_PATH" ]; then
    pushd "$INFRA_PATH" > /dev/null
    TF_URL=$(terraform output -raw frontend_website_url 2>/dev/null || echo "")
    popd > /dev/null

    if [ -n "$TF_URL" ]; then
        WEBSITE_URL="$TF_URL"
    fi
fi

# -----------------------------------------------------------------------------
# Resultado final
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Deploy completado exitosamente!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${YELLOW}URL del sitio:${NC}"
echo -e "${BLUE}${WEBSITE_URL}${NC}"
echo ""

# Confirmación para producción
if [ "$ENVIRONMENT" == "prod" ]; then
    echo -e "${YELLOW}NOTA: Este es el entorno de PRODUCCIÓN${NC}"
fi

exit 0

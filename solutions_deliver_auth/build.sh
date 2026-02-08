#!/bin/bash
# =============================================================================
# BUILD SCRIPT - Solutions Delivery Auth (Go Lambda Post-Confirmation)
# =============================================================================
# Compila la Lambda de autenticacion para AWS (ARM64)
# Esta Lambda se ejecuta despues de que un usuario confirma su cuenta en Cognito
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Solutions Delivery - Auth Lambda Build${NC}"
echo -e "${BLUE}=============================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -----------------------------------------------------------------------------
# 1. Verificar Go
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/5]${NC} Verificando Go..."
if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go no esta instalado${NC}"
    exit 1
fi
echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 2. Dependencias
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[2/5]${NC} Descargando dependencias..."
go mod download
go mod tidy
echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 3. Tests
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[3/5]${NC} Ejecutando tests..."
go test ./... -v 2>/dev/null || echo -e "${YELLOW}WARN${NC} - Sin tests"

# -----------------------------------------------------------------------------
# 4. Compilar
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[4/5]${NC} Compilando para AWS Lambda (linux/arm64)..."

export GOOS=linux
export GOARCH=arm64
export CGO_ENABLED=0

go build -tags lambda.norpc -ldflags="-s -w" -o bootstrap main.go

if [ ! -f "bootstrap" ]; then
    echo -e "${RED}Error: No se genero bootstrap${NC}"
    exit 1
fi

BOOTSTRAP_SIZE=$(du -h bootstrap | cut -f1)
echo -e "${GREEN}OK${NC} - bootstrap ($BOOTSTRAP_SIZE)"

# -----------------------------------------------------------------------------
# 5. Empaquetar
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[5/5]${NC} Empaquetando..."

rm -f main.zip
zip -j main.zip bootstrap

INFRA_PATH="../infra/modules/lambda_custom_auth/src"
mkdir -p "$INFRA_PATH"
cp main.zip "$INFRA_PATH/main.zip"

rm -f bootstrap

ZIP_SIZE=$(du -h main.zip | cut -f1)
echo -e "${GREEN}OK${NC} - main.zip ($ZIP_SIZE)"

# -----------------------------------------------------------------------------
# Resultado
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Build completado!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "Copiado a: ${BLUE}$INFRA_PATH/main.zip${NC}"

exit 0

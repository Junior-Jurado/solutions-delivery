#!/bin/bash
# =============================================================================
# BUILD SCRIPT - Solutions Delivery Backend (Go Lambda API)
# =============================================================================
# Compila el backend Go para AWS Lambda (ARM64)
# Genera el archivo main.zip listo para desplegar
# =============================================================================

set -e  # Salir si hay error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Solutions Delivery - Backend Build${NC}"
echo -e "${BLUE}=============================================${NC}"

# Directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -----------------------------------------------------------------------------
# 1. Verificar Go instalado
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/5]${NC} Verificando Go..."
if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go no esta instalado${NC}"
    exit 1
fi
GO_VERSION=$(go version)
echo -e "${GREEN}OK${NC} - $GO_VERSION"

# -----------------------------------------------------------------------------
# 2. Descargar dependencias
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[2/5]${NC} Descargando dependencias..."
go mod download
go mod tidy
echo -e "${GREEN}OK${NC}"

# -----------------------------------------------------------------------------
# 3. Ejecutar tests (opcional)
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[3/5]${NC} Ejecutando tests..."
if go test ./... -v 2>/dev/null; then
    echo -e "${GREEN}OK${NC} - Tests pasaron"
else
    echo -e "${YELLOW}WARN${NC} - No hay tests o algunos fallaron (continuando...)"
fi

# -----------------------------------------------------------------------------
# 4. Compilar para Lambda (Linux ARM64)
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[4/5]${NC} Compilando para AWS Lambda (linux/arm64)..."

export GOOS=linux
export GOARCH=arm64
export CGO_ENABLED=0

go build -tags lambda.norpc -ldflags="-s -w" -o bootstrap main.go

if [ ! -f "bootstrap" ]; then
    echo -e "${RED}Error: No se genero el binario bootstrap${NC}"
    exit 1
fi

BOOTSTRAP_SIZE=$(du -h bootstrap | cut -f1)
echo -e "${GREEN}OK${NC} - bootstrap generado ($BOOTSTRAP_SIZE)"

# -----------------------------------------------------------------------------
# 5. Crear ZIP y copiar a infra
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[5/5]${NC} Empaquetando..."

rm -f main.zip
zip -j main.zip bootstrap

INFRA_PATH="../infra/modules/lambda_api/src"
mkdir -p "$INFRA_PATH"
cp main.zip "$INFRA_PATH/main.zip"

rm -f bootstrap

ZIP_SIZE=$(du -h main.zip | cut -f1)
echo -e "${GREEN}OK${NC} - main.zip generado ($ZIP_SIZE)"

# -----------------------------------------------------------------------------
# Resultado
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Build completado exitosamente!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "Archivo: ${BLUE}main.zip${NC} ($ZIP_SIZE)"
echo -e "Copiado a: ${BLUE}$INFRA_PATH/main.zip${NC}"

exit 0

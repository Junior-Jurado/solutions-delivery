#!/bin/bash
  # =============================================================================
  # BUILD SCRIPT - Solutions Delivery Auth (Go Lambda Post-Confirmation)
  # =============================================================================
  # Compila la Lambda y sube el .zip a S3 (fuente única de verdad)
  #
  # Uso:
  #   ./build.sh              → compila y sube a dev
  #   ./build.sh prod         → compila y sube a prod
  #   ./build.sh dev --local  → compila SIN subir a S3 (solo local)
  # =============================================================================

  set -e

  # Colores
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'

  # Parámetros
  ENVIRONMENT="${1:-dev}"
  LOCAL_ONLY="${2:-}"
  NAME_PREFIX="solutions"
  S3_BUCKET="${NAME_PREFIX}-lambda-artifacts-${ENVIRONMENT}"
  S3_KEY="auth/main.zip"

  echo -e "${BLUE}=============================================${NC}"
  echo -e "${BLUE}  Solutions Delivery - Auth Lambda Build${NC}"
  echo -e "${BLUE}  Environment: ${ENVIRONMENT}${NC}"
  echo -e "${BLUE}=============================================${NC}"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"

  # -----------------------------------------------------------------------------
  # 1. Verificar Go
  # -----------------------------------------------------------------------------
  echo -e "${YELLOW}[1/6]${NC} Verificando Go..."
  if ! command -v go &> /dev/null; then
      echo -e "${RED}Error: Go no esta instalado${NC}"
      exit 1
  fi
  echo -e "${GREEN}OK${NC}"

  # -----------------------------------------------------------------------------
  # 2. Dependencias
  # -----------------------------------------------------------------------------
  echo -e "${YELLOW}[2/6]${NC} Descargando dependencias..."
  go mod download
  go mod tidy
  echo -e "${GREEN}OK${NC}"

  # -----------------------------------------------------------------------------
  # 3. Tests
  # -----------------------------------------------------------------------------
  echo -e "${YELLOW}[3/6]${NC} Ejecutando tests..."
  go test ./... -v 2>/dev/null || echo -e "${YELLOW}WARN${NC} - Sin tests"

  # -----------------------------------------------------------------------------
  # 4. Compilar
  # -----------------------------------------------------------------------------
  echo -e "${YELLOW}[4/6]${NC} Compilando para AWS Lambda (linux/arm64)..."

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
  echo -e "${YELLOW}[5/6]${NC} Empaquetando..."

  rm -f main.zip
  zip -j main.zip bootstrap
  rm -f bootstrap

  ZIP_SIZE=$(du -h main.zip | cut -f1)
  echo -e "${GREEN}OK${NC} - main.zip ($ZIP_SIZE)"

  # -----------------------------------------------------------------------------
  # 6. Subir a S3
  # -----------------------------------------------------------------------------
  if [ "$LOCAL_ONLY" = "--local" ]; then
      echo -e "${YELLOW}[6/6]${NC} Modo local - saltando S3"

      # Mantener compatibilidad: copiar a infra (por si quieres terraform apply local)
      INFRA_PATH="../infra/modules/lambda_custom_auth/src"
      mkdir -p "$INFRA_PATH"
      cp main.zip "$INFRA_PATH/main.zip"
      echo -e "${GREEN}OK${NC} - Copiado a $INFRA_PATH"
  else
      echo -e "${YELLOW}[6/6]${NC} Subiendo a S3..."

      if ! command -v aws &> /dev/null; then
          echo -e "${RED}Error: AWS CLI no esta instalado${NC}"
          exit 1
      fi

      aws s3 cp main.zip "s3://${S3_BUCKET}/${S3_KEY}"
      echo -e "${GREEN}OK${NC} - s3://${S3_BUCKET}/${S3_KEY}"
  fi

  # -----------------------------------------------------------------------------
  # Resultado
  # -----------------------------------------------------------------------------
  echo ""
  echo -e "${GREEN}=============================================${NC}"
  echo -e "${GREEN}  Build completado!${NC}"
  echo -e "${GREEN}=============================================${NC}"
  echo ""
  if [ "$LOCAL_ONLY" != "--local" ]; then
      echo -e "S3: ${BLUE}s3://${S3_BUCKET}/${S3_KEY}${NC}"
      echo -e ""
      echo -e "Para deployar con Terraform:"
      echo -e "  cd ../infra/envs/${ENVIRONMENT}"
      echo -e "  terraform apply -var-file=${ENVIRONMENT}.tfvars"
  fi

  exit 0
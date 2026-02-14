#!/bin/bash

echo "=========================================="
echo "🔍 Simulando Pipeline de GitHub Actions"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navegar al directorio del frontend
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || { echo -e "${RED}No se pudo acceder al directorio del frontend${NC}"; exit 1; }
echo -e "Directorio de trabajo: ${YELLOW}$(pwd)${NC}"
echo ""

# Función para verificar si el último comando falló
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}$1 - PASÓ${NC}"
        echo ""
    else
        echo -e "${RED}$1 - FALLÓ${NC}"
        echo ""
        exit 1
    fi
}

# Paso 1: Limpiar
echo -e "${YELLOW}Paso 1: Limpiando node_modules...${NC}"
rm -rf node_modules
check_status "Limpieza"

# Paso 2: Instalar dependencias (como en el pipeline)
echo -e "${YELLOW}Paso 2: Instalando dependencias (npm ci)...${NC}"
npm ci
check_status "Instalación de dependencias"

# Paso 3: Validar variables de entorno
echo -e "${YELLOW}Paso 3: Validando variables de entorno...${NC}"
npm run validate:env
check_status "Validación de entorno"

# Paso 4: Lint
echo -e "${YELLOW}Paso 4: Ejecutando ESLint...${NC}"
npm run lint
check_status "Lint"

# Paso 5: Tests
echo -e "${YELLOW}Paso 5: Ejecutando tests unitarios...${NC}"
npm run test:ci
check_status "Tests"

# Paso 6: Build
echo -e "${YELLOW}Paso 6: Build de producción...${NC}"
npm run build -- --configuration=production
check_status "Build"

# Paso 7: Verificar artefactos
echo -e "${YELLOW}Paso 7: Verificando artefactos generados...${NC}"
if [ -d "dist/solutions_front/browser" ]; then
    echo -e "${GREEN}Artefactos generados correctamente${NC}"
    ls -lh dist/solutions_front/browser/ | head -10
else
    echo -e "${RED}No se generaron los artefactos${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN} ¡TODOS LOS PASOS PASARON!${NC}"
echo "=========================================="
echo ""
echo "Tu código está listo para hacer push"

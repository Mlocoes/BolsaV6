#!/bin/bash

################################################################################
# BolsaV6 - Script de Inicio del Sistema
#
# Este script inicia todos los servicios de BolsaV6
# después de la instalación inicial.
################################################################################

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    BolsaV6 - Iniciando Sistema                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

cd "$SCRIPT_DIR"

# Verificar si .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}Por favor, ejecute primero el script de instalación:${NC}"
    echo -e "  ./install.sh"
    echo ""
    exit 1
fi

# Detectar comando de Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ Docker Compose no encontrado${NC}"
    exit 1
fi

# Iniciar servicios
echo -e "${BLUE}▶ Iniciando servicios...${NC}"
$DOCKER_COMPOSE_CMD up -d

# Esperar a que los servicios estén listos
echo -e "${BLUE}▶ Esperando a que los servicios estén listos...${NC}"
sleep 5

# Verificar estado
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}✓ Sistema iniciado correctamente${NC}"
    echo ""
    echo -e "${CYAN}Acceda al sistema en:${NC}"
    echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "  Backend API: ${BLUE}http://localhost:8000${NC}"
    echo -e "  API Docs: ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${CYAN}Ver logs en tiempo real:${NC}"
    echo -e "  ${DOCKER_COMPOSE_CMD} logs -f"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Algunos servicios no se iniciaron correctamente${NC}"
    echo ""
    echo "Estado de los contenedores:"
    $DOCKER_COMPOSE_CMD ps
    echo ""
    echo "Ver logs de errores:"
    echo "  ${DOCKER_COMPOSE_CMD} logs"
    exit 1
fi

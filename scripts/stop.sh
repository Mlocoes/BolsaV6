#!/bin/bash

################################################################################
# BolsaV6 - Script de Detención del Sistema
#
# Este script detiene todos los servicios de BolsaV6
################################################################################

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   BolsaV6 - Deteniendo Sistema                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

cd "$SCRIPT_DIR"

# Detectar comando de Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ Docker Compose no encontrado${NC}"
    exit 1
fi

# Detener servicios
echo -e "${BLUE}▶ Deteniendo servicios...${NC}"
$DOCKER_COMPOSE_CMD down

echo ""
echo -e "${GREEN}✓ Sistema detenido correctamente${NC}"
echo ""
echo -e "${CYAN}Para iniciar nuevamente:${NC}"
echo -e "  ./start.sh"
echo ""

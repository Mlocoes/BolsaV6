#!/bin/bash

################################################################################
# Script de Test para Instalación Automática de BolsaV6
# Este script ejecuta install.sh con respuestas predefinidas
################################################################################

set -e  # Exit on error

cd "$(dirname "$0")/.."

# Limpiar instalación anterior
echo "════════════════════════════════════════════════════════════════"
echo "  Limpiando instalación anterior..."
echo "════════════════════════════════════════════════════════════════"
docker compose down -v 2>/dev/null || true
rm -f .env
echo "✓ Limpieza completada"
echo ""

# Configuración de prueba
export AUTO_INSTALL="true"
export DB_NAME="bolsav6"
export DB_USER="bolsav6_user"
export DB_PASSWORD="TestPass123!"
export ADMIN_USER="admin"
export ADMIN_EMAIL="admin@bolsav6.local"
export ADMIN_PASSWORD="Admin123!"

echo "════════════════════════════════════════════════════════════════"
echo "  Test de Instalación Automática - BolsaV6"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Configuración de prueba:"
echo "  Base de datos: $DB_NAME"
echo "  Usuario DB: $DB_USER"
echo "  Admin: $ADMIN_USER"
echo "  Email: $ADMIN_EMAIL"
echo ""
echo "DEBUG: Verificando variables antes de ejecutar script..."
echo "  DB_NAME=$DB_NAME"
echo "  DB_USER=$DB_USER"
echo "  ADMIN_USER=$ADMIN_USER"
echo ""
echo "Iniciando instalación en 3 segundos..."
sleep 3

# Ejecutar instalación (las variables ya están exportadas)
./scripts/install.sh < /dev/null

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Instalación completada exitosamente"
    echo ""
    echo "Verificando servicios..."
    docker compose ps
    echo ""
    echo "Verificando logs del backend (últimas 10 líneas):"
    docker compose logs backend --tail=10
else
    echo ""
    echo "❌ La instalación falló"
    echo ""
    echo "Logs de error:"
    docker compose logs --tail=50
    exit 1
fi

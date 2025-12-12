#!/bin/bash

# Script para probar instalación en modo interactivo
# Limpia todas las variables de AUTO_INSTALL antes de ejecutar

# Limpiar variables de entorno que puedan activar modo automático
unset AUTO_INSTALL
unset DB_NAME
unset DB_USER
unset DB_PASSWORD
unset ADMIN_USER
unset ADMIN_EMAIL
unset ADMIN_PASSWORD
unset CORS_URLS

echo "🧪 Probando instalación en modo interactivo"
echo "Variables de AUTO_INSTALL limpiadas"
echo ""

# Ejecutar script de instalación
bash "$(dirname "$0")/install.sh"

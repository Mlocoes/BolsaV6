#!/bin/bash
# Script de reinstalación rápida

cd /home/mloco/Escritorio/BolsaV6

echo "🔄 Deteniendo y limpiando contenedores..."
docker compose down -v --remove-orphans

echo "🚀 Iniciando servicios..."
docker compose up -d

echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 15

echo "📊 Ejecutando migraciones..."
docker compose exec backend alembic upgrade head

echo "👤 Creando usuario administrador..."
docker compose exec backend python create_admin.py

echo "✅ Instalación completada!"
docker compose ps

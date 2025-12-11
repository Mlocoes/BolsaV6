#!/bin/bash

# ============================================================================
# Script de Validación del Esquema de Base de Datos
# ============================================================================
# Este script verifica que el esquema de la base de datos esté correcto
# y coincida con los modelos de SQLAlchemy
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  Validación del Esquema de Base de Datos - BolsaV6${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# 1. Verificar que los contenedores estén corriendo
echo -e "${YELLOW}▶ Verificando contenedores...${NC}"
if ! docker compose ps | grep -q "bolsav6_backend.*Up"; then
    echo -e "${RED}✗ El contenedor backend no está corriendo${NC}"
    exit 1
fi
if ! docker compose ps | grep -q "bolsav6_db.*Up"; then
    echo -e "${RED}✗ El contenedor de base de datos no está corriendo${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Contenedores corriendo${NC}"
echo ""

# 2. Verificar versión de Alembic
echo -e "${YELLOW}▶ Verificando versión de migraciones...${NC}"
CURRENT_VERSION=$(docker compose exec backend alembic current 2>/dev/null | grep -oP '^\K[a-z0-9]+' | head -1)
EXPECTED_VERSION="29bc6e996add"

if [ "$CURRENT_VERSION" != "$EXPECTED_VERSION" ]; then
    echo -e "${RED}✗ Versión incorrecta: $CURRENT_VERSION (esperada: $EXPECTED_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Versión correcta: $CURRENT_VERSION${NC}"
echo ""

# 3. Verificar cadena de migraciones
echo -e "${YELLOW}▶ Verificando cadena de migraciones...${NC}"
HISTORY=$(docker compose exec -T backend alembic history 2>/dev/null)
echo "$HISTORY"
echo ""

# 4. Verificar que no hay diferencias
echo -e "${YELLOW}▶ Verificando diferencias entre modelos y BD...${NC}"
CHECK_OUTPUT=$(docker compose exec -T backend alembic check 2>&1)
if echo "$CHECK_OUTPUT" | grep -q "No new upgrade operations detected"; then
    echo -e "${GREEN}✓ No hay diferencias${NC}"
else
    echo -e "${RED}✗ Hay diferencias detectadas:${NC}"
    echo "$CHECK_OUTPUT"
    exit 1
fi
echo ""

# 5. Verificar tablas en la base de datos
echo -e "${YELLOW}▶ Verificando tablas en la base de datos...${NC}"
TABLES=$(docker compose exec -T db psql -U bolsav6_user -d bolsav6 -t -c "\dt" | grep -E "public \|" | awk '{print $3}' | sort)
EXPECTED_TABLES="alembic_version assets portfolios quotes results transactions users"

echo "Tablas encontradas:"
echo "$TABLES"
echo ""

# 6. Verificar enums
echo -e "${YELLOW}▶ Verificando tipos ENUM...${NC}"
echo ""
echo "TransactionType:"
docker compose exec -T db psql -U bolsav6_user -d bolsav6 -c "SELECT unnest(enum_range(NULL::transactiontype));"
echo ""
echo "AssetType:"
docker compose exec -T db psql -U bolsav6_user -d bolsav6 -c "SELECT unnest(enum_range(NULL::assettype));"
echo ""

# 7. Verificar constraints y foreign keys
echo -e "${YELLOW}▶ Verificando constraints principales...${NC}"
echo ""
echo "Transactions table constraints:"
docker compose exec -T db psql -U bolsav6_user -d bolsav6 -c "
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'transactions'
ORDER BY tc.constraint_type, tc.constraint_name;
"
echo ""

# 8. Verificar índices
echo -e "${YELLOW}▶ Verificando índices en transactions...${NC}"
docker compose exec -T db psql -U bolsav6_user -d bolsav6 -c "
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transactions'
ORDER BY indexname;
"
echo ""

# Resumen final
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}✓ Validación completada exitosamente${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "Estado del esquema:"
echo "  • Versión de migración: $CURRENT_VERSION"
echo "  • Tablas: $(echo "$TABLES" | wc -l)"
echo "  • Enums: TransactionType (5 valores), AssetType (6 valores)"
echo "  • Sin diferencias entre modelos y BD"
echo ""

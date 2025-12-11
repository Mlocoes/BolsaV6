# Estado del Esquema de Base de Datos - BolsaV6

## ✅ Esquema Validado y Corregido

**Fecha de validación:** 11 de diciembre de 2025  
**Versión de migración:** `29bc6e996add`

---

## Resumen de Correcciones Aplicadas

### Problema Identificado
El esquema de la base de datos tenía una **migración duplicada vacía** que causaba inconsistencias en la cadena de migraciones de Alembic.

### Solución Implementada
1. ✅ Eliminada migración vacía duplicada (`52332bc90510`)
2. ✅ Corregida cadena de migraciones para ser lineal
3. ✅ Actualizado `down_revision` en la migración de tipos corporativos
4. ✅ Añadidos tipos ENUM faltantes: `DIVIDEND`, `SPLIT`, `CORPORATE`

---

## Cadena de Migraciones Correcta

```
<base> → d97d06f9ce3a (Initial schema)
           ↓
      29bc6e996add (add_corporate_transaction_types) ← HEAD
```

### Detalles de Migraciones

#### 1️⃣ `d97d06f9ce3a` - Initial Schema
**Descripción:** Schema inicial con todas las tablas base del sistema

**Tablas creadas:**
- `users` - Usuarios del sistema
- `assets` - Activos financieros (acciones, ETFs, fondos, etc.)
- `portfolios` - Carteras de inversión
- `transactions` - Operaciones de compra/venta
- `quotes` - Cotizaciones históricas
- `results` - Resultados calculados de carteras

**Enums creados:**
- `AssetType`: STOCK, ETF, FUND, CRYPTO, BOND, OTHER
- `TransactionType`: BUY, SELL *(solo estos dos inicialmente)*

#### 2️⃣ `29bc6e996add` - Add Corporate Transaction Types
**Descripción:** Añade tipos de transacciones corporativas al enum existente

**Cambios:**
- Añadido valor `DIVIDEND` al enum `TransactionType`
- Añadido valor `SPLIT` al enum `TransactionType`
- Añadido valor `CORPORATE` al enum `TransactionType`

**Motivo:** Soportar operaciones corporativas informativas como dividendos, splits y amortizaciones que no afectan directamente al balance de la cartera.

---

## Estructura de Tablas

### 📊 Tabla: `transactions`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY | Identificador único |
| `portfolio_id` | UUID | NOT NULL, FK → portfolios | Cartera asociada |
| `asset_id` | UUID | NOT NULL, FK → assets | Activo negociado |
| `transaction_type` | TransactionType | NOT NULL | Tipo de operación |
| `transaction_date` | TIMESTAMP WITH TIMEZONE | NOT NULL | Fecha de la operación |
| `quantity` | NUMERIC(18,6) | NOT NULL | Cantidad negociada |
| `price` | NUMERIC(18,6) | NOT NULL | Precio unitario |
| `fees` | NUMERIC(18,6) | NULL | Comisiones |
| `notes` | VARCHAR(500) | NULL | Notas adicionales |
| `created_at` | TIMESTAMP WITH TIMEZONE | NOT NULL, DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP WITH TIMEZONE | NULL | Fecha de actualización |

**Foreign Keys:**
- `portfolio_id` → `portfolios.id` (ON DELETE CASCADE)
- `asset_id` → `assets.id` (ON DELETE RESTRICT)

**Índices:**
- `transactions_pkey`: PRIMARY KEY en `id`
- `ix_transactions_portfolio_id`: índice en `portfolio_id`
- `ix_transactions_asset_id`: índice en `asset_id`
- `ix_transactions_transaction_date`: índice en `transaction_date`
- `idx_transaction_portfolio_date`: índice compuesto en `(portfolio_id, transaction_date)`

---

## Tipos ENUM

### TransactionType
```sql
CREATE TYPE transactiontype AS ENUM (
    'BUY',        -- Compra de activos
    'SELL',       -- Venta de activos
    'DIVIDEND',   -- Pago de dividendos (informativo)
    'SPLIT',      -- División de acciones (informativo)
    'CORPORATE'   -- Operaciones corporativas: fusión, amortización, cambio ISIN, etc. (informativo)
);
```

**Valores actuales:** 5  
**Uso:** Define el tipo de transacción u operación corporativa

### AssetType
```sql
CREATE TYPE assettype AS ENUM (
    'STOCK',   -- Acciones
    'ETF',     -- Fondos cotizados
    'FUND',    -- Fondos de inversión
    'CRYPTO',  -- Criptomonedas
    'BOND',    -- Bonos
    'OTHER'    -- Otros instrumentos
);
```

**Valores actuales:** 6  
**Uso:** Clasifica el tipo de activo financiero

---

## Validación del Esquema

### Comandos de Verificación

```bash
# Ver cadena de migraciones
docker compose exec backend alembic history

# Ver versión actual
docker compose exec backend alembic current

# Verificar diferencias entre modelos y BD
docker compose exec backend alembic check

# Ejecutar script de validación completo
./validate_schema.sh
```

### Estado Actual Verificado

✅ **Versión de migración:** `29bc6e996add (head)`  
✅ **Cadena lineal:** Sin ramificaciones  
✅ **Diferencias:** No hay diferencias entre modelos SQLAlchemy y base de datos  
✅ **Tablas:** 7 tablas creadas correctamente  
✅ **Enums:** 2 tipos ENUM con 11 valores totales  
✅ **Constraints:** Todas las foreign keys configuradas correctamente  
✅ **Índices:** Todos los índices necesarios creados

---

## Operaciones Prohibidas

⚠️ **NO hacer lo siguiente sin consultar:**

1. **NO eliminar valores de ENUMs** - PostgreSQL no permite eliminar valores de un enum sin recrearlo completamente
2. **NO modificar `down_revision` manualmente** sin entender las consecuencias
3. **NO crear migraciones con `pass`** vacías - siempre deben tener operaciones reales
4. **NO usar `docker compose restart`** después de cambiar ENUMs - usar `--force-recreate`

---

## Próximos Pasos Recomendados

### Si necesitas añadir nuevos tipos de transacción:
```bash
# 1. Crear nueva migración
docker compose exec backend alembic revision -m "add_new_transaction_type"

# 2. Editar el archivo generado y añadir:
def upgrade():
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'NUEVO_TIPO'")

# 3. Copiar al contenedor y ejecutar
docker compose cp backend/alembic/versions/xxxxx.py backend:/app/alembic/versions/
docker compose exec backend alembic upgrade head
```

### Si necesitas modificar una tabla:
```bash
# 1. Modificar el modelo en app/models/
# 2. Generar migración automática
docker compose exec backend alembic revision --autogenerate -m "descripcion_cambio"

# 3. Revisar el archivo generado (importante!)
# 4. Aplicar migración
docker compose exec backend alembic upgrade head
```

---

## Referencias

- **Documentación de Alembic:** https://alembic.sqlalchemy.org/
- **PostgreSQL ENUMs:** https://www.postgresql.org/docs/current/datatype-enum.html
- **SQLAlchemy Relationships:** https://docs.sqlalchemy.org/en/14/orm/relationships.html

---

## Changelog

| Fecha | Cambio | Commit |
|-------|--------|--------|
| 2025-12-11 | Schema inicial creado | d97d06f9ce3a |
| 2025-12-11 | Añadidos tipos corporativos | 29bc6e996add |
| 2025-12-11 | Limpieza de migraciones duplicadas | 0851e45 |

---

**Última actualización:** 11 de diciembre de 2025  
**Estado:** ✅ Esquema validado y estable

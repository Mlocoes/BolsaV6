# 📊 Documentación de Base de Datos - BolsaV6

## Índice
- [Visión General](#visión-general)
- [Diagrama de Relaciones](#diagrama-de-relaciones)
- [Tablas del Sistema](#tablas-del-sistema)
- [Relaciones entre Tablas](#relaciones-entre-tablas)
- [Índices y Constraints](#índices-y-constraints)
- [Estrategia de Datos](#estrategia-de-datos)

---

## Visión General

BolsaV6 utiliza **PostgreSQL 15** como sistema de gestión de base de datos. El esquema está diseñado para gestionar carteras de inversión, transacciones, cotizaciones históricas y cálculos de resultados.

### Características Principales
- **Motor**: PostgreSQL 15
- **ORM**: SQLAlchemy con Alembic para migraciones
- **Identificadores**: UUIDs para todas las claves primarias
- **Timestamps**: Timezone-aware (UTC)
- **Tipos de datos**: Numeric(18,6) para valores financieros de alta precisión

---

## Diagrama de Relaciones

```
┌─────────────┐
│   users     │
│ (usuarios)  │
└──────┬──────┘
       │ 1:N
       │
       ▼
┌──────────────┐      1:N      ┌──────────────┐
│  portfolios  │◄──────────────┤ transactions │
│  (carteras)  │               │ (operaciones)│
└──────┬───────┘               └──────┬───────┘
       │ 1:N                          │ N:1
       │                              │
       ▼                              ▼
┌──────────────┐               ┌──────────────┐
│   results    │               │    assets    │
│ (resultados) │               │  (activos)   │
└──────────────┘               └──────┬───────┘
                                      │ 1:N
                                      │
                                      ▼
                               ┌──────────────┐
                               │    quotes    │
                               │ (cotizaciones)│
                               └──────────────┘

┌──────────────┐
│   markets    │
│  (mercados)  │ (tabla independiente)
└──────────────┘
```

---

## Tablas del Sistema

### 1. **users** - Usuarios del Sistema

Almacena la información de autenticación y configuración de cada usuario.

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único del usuario |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX | Nombre de usuario para login |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Correo electrónico (único) |
| `hashed_password` | VARCHAR(255) | NOT NULL | Contraseña encriptada (bcrypt) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Usuario activo/desactivado |
| `is_admin` | BOOLEAN | NOT NULL, DEFAULT FALSE | Permisos de administrador |
| `base_currency` | VARCHAR(3) | NOT NULL, DEFAULT 'EUR' | Moneda base del usuario (EUR, USD, BRL, etc.) |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP TZ | NULL, ON UPDATE | Última actualización |

**Relaciones:**
- `users` 1:N `portfolios` - Un usuario puede tener múltiples carteras

**Índices:**
- `idx_users_username` (username)
- `idx_users_email` (email)

**Notas:**
- La contraseña nunca se almacena en texto plano, solo su hash
- `base_currency` define la moneda para mostrar totales y gráficos
- Los usuarios inactivos (`is_active=false`) no pueden hacer login

---

### 2. **assets** - Activos Financieros

Catálogo de todos los activos disponibles para invertir (acciones, ETFs, criptomonedas, etc.).

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único del activo |
| `symbol` | VARCHAR(20) | UNIQUE, NOT NULL, INDEX | Ticker/símbolo (ej: AAPL, GOOGL, BTC-USD) |
| `name` | VARCHAR(255) | NOT NULL | Nombre completo (ej: "Apple Inc.") |
| `asset_type` | ENUM | NOT NULL, DEFAULT 'stock' | Tipo de activo (ver tipos abajo) |
| `currency` | VARCHAR(10) | NOT NULL, DEFAULT 'USD' | Moneda de cotización |
| `market` | VARCHAR(50) | NULL | Mercado de cotización (NASDAQ, NYSE, XETRA, etc.) |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP TZ | NULL, ON UPDATE | Última actualización |

**Tipos de Activo (AssetType):**
- `stock` - Acciones
- `etf` - Fondos cotizados
- `fund` - Fondos de inversión
- `crypto` - Criptomonedas
- `bond` - Bonos
- `currency` - Pares de divisas (Forex)
- `other` - Otros instrumentos

**Relaciones:**
- `assets` 1:N `quotes` - Un activo tiene múltiples cotizaciones históricas
- `assets` 1:N `transactions` - Un activo puede estar en múltiples transacciones

**Índices:**
- `idx_assets_symbol` (symbol)

**Notas:**
- El `symbol` debe ser único en todo el sistema
- Para criptomonedas, usar formato con guion (ej: BTC-USD, ETH-EUR)
- El campo `market` es opcional pero útil para normalización de tickers

---

### 3. **portfolios** - Carteras de Inversión

Representa las carteras de cada usuario. Un usuario puede tener múltiples carteras para organizar sus inversiones.

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único de la cartera |
| `user_id` | UUID | FK → users.id, NOT NULL, INDEX | Propietario de la cartera |
| `name` | VARCHAR(100) | NOT NULL | Nombre de la cartera |
| `description` | TEXT | NULL | Descripción opcional |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP TZ | NULL, ON UPDATE | Última actualización |

**Relaciones:**
- `portfolios` N:1 `users` - Pertenece a un usuario
- `portfolios` 1:N `transactions` - Contiene múltiples transacciones
- `portfolios` 1:N `results` - Tiene snapshots de resultados diarios

**Índices:**
- `idx_portfolios_user_id` (user_id)

**Cascade:**
- ON DELETE CASCADE: Al eliminar un usuario, se eliminan sus carteras
- ON DELETE CASCADE: Al eliminar una cartera, se eliminan sus transacciones y resultados

**Notas:**
- Las carteras permiten separar inversiones por estrategia, mercado o propósito
- No hay límite de carteras por usuario

---

### 4. **transactions** - Transacciones/Operaciones

Registro de todas las operaciones realizadas en cada cartera (compras, ventas, dividendos, etc.).

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único de la transacción |
| `portfolio_id` | UUID | FK → portfolios.id, NOT NULL, INDEX | Cartera a la que pertenece |
| `asset_id` | UUID | FK → assets.id, NOT NULL, INDEX | Activo involucrado |
| `transaction_type` | ENUM | NOT NULL | Tipo de operación (ver tipos abajo) |
| `transaction_date` | TIMESTAMP TZ | NOT NULL, INDEX | Fecha/hora de la operación |
| `quantity` | NUMERIC(18,6) | NOT NULL | Cantidad de activos (puede ser negativo en ventas) |
| `price` | NUMERIC(18,6) | NOT NULL | Precio por unidad |
| `fees` | NUMERIC(18,6) | DEFAULT 0.0 | Comisiones pagadas |
| `notes` | VARCHAR(500) | NULL | Notas adicionales |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de registro |
| `updated_at` | TIMESTAMP TZ | NULL, ON UPDATE | Última modificación |

**Tipos de Transacción (TransactionType):**
- `BUY` - Compra de activos
- `SELL` - Venta de activos
- `DIVIDEND` - Pago de dividendo (no afecta cantidad)
- `SPLIT` - División de acciones (stock split)
- `CORPORATE` - Operaciones corporativas (fusión, cambio de ISIN, etc.)

**Relaciones:**
- `transactions` N:1 `portfolios` - Pertenece a una cartera
- `transactions` N:1 `assets` - Opera sobre un activo

**Índices:**
- `idx_transactions_portfolio_id` (portfolio_id)
- `idx_transactions_asset_id` (asset_id)
- `idx_transactions_transaction_date` (transaction_date)
- `idx_transaction_portfolio_date` (portfolio_id, transaction_date) - Compuesto

**Cascade:**
- ON DELETE CASCADE: Al eliminar una cartera, se eliminan sus transacciones
- ON DELETE RESTRICT: No se puede eliminar un activo si tiene transacciones

**Notas:**
- Las fechas se normalizan a medianoche UTC para consistencia
- `quantity` positivo = compra, negativo = venta (alternativa a usar solo transaction_type)
- `fees` incluye todas las comisiones (broker, mercado, custodia, etc.)
- El precio es por unidad, no el total de la operación

---

### 5. **quotes** - Cotizaciones Históricas (OHLCV)

Almacena el historial de precios de cada activo. Datos OHLCV (Open, High, Low, Close, Volume).

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único de la cotización |
| `asset_id` | UUID | FK → assets.id, NOT NULL, INDEX | Activo al que pertenece |
| `date` | TIMESTAMP TZ | NOT NULL, INDEX | Fecha de la cotización (normalizada a medianoche UTC) |
| `open` | NUMERIC(18,6) | NOT NULL | Precio de apertura |
| `high` | NUMERIC(18,6) | NOT NULL | Precio máximo del día |
| `low` | NUMERIC(18,6) | NOT NULL | Precio mínimo del día |
| `close` | NUMERIC(18,6) | NOT NULL | Precio de cierre |
| `volume` | BIGINT | NULL | Volumen de operaciones |
| `source` | VARCHAR(50) | DEFAULT 'alpha_vantage' | Fuente de datos (polygon, yfinance, finnhub) |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de importación |

**Relaciones:**
- `quotes` N:1 `assets` - Pertenece a un activo

**Índices:**
- `idx_quotes_asset_id` (asset_id)
- `idx_quotes_date` (date)
- `idx_quote_asset_date` (asset_id, date) - Compuesto

**Constraints:**
- `uq_quote_asset_date` UNIQUE(asset_id, date) - No se permiten cotizaciones duplicadas para la misma fecha

**Cascade:**
- ON DELETE CASCADE: Al eliminar un activo, se eliminan sus cotizaciones

**Notas:**
- Las fechas se normalizan a medianoche UTC (00:00:00)
- La restricción UNIQUE evita duplicados automáticamente
- El campo `source` permite identificar el origen de los datos:
  * `polygon` - Datos de Polygon.io (históricos de alta calidad)
  * `yfinance` - Datos de Yahoo Finance (sincronización diaria automática)
  * `yfinance_auto` - Importación automática programada
  * `finnhub` - Datos de Finnhub (tiempo real)
  * `alpha_vantage` - Deprecated, legacy data
- El volumen puede ser NULL para activos sin datos de volumen (ej: divisas)

---

### 6. **results** - Resultados Diarios (Snapshots)

Almacena snapshots diarios del estado de cada cartera. Permite generar gráficos históricos de rendimiento.

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único del resultado |
| `portfolio_id` | UUID | FK → portfolios.id, NOT NULL, INDEX | Cartera asociada |
| `date` | DATE | NOT NULL, INDEX | Fecha del snapshot |
| `total_value` | NUMERIC(18,2) | NOT NULL | Valor total actual (market value) |
| `invested_value` | NUMERIC(18,2) | NOT NULL | Valor invertido (costo base) |
| `profit_loss` | NUMERIC(18,2) | NOT NULL | Ganancia/Pérdida absoluta |
| `profit_loss_percent` | NUMERIC(10,4) | NOT NULL | Ganancia/Pérdida porcentual |
| `positions_snapshot` | JSON | NOT NULL | Detalle de posiciones (ver estructura abajo) |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de creación del snapshot |

**Estructura del JSON `positions_snapshot`:**
```json
[
  {
    "asset_id": "uuid",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "quantity": 100.0,
    "avg_price": 150.00,
    "current_price": 175.00,
    "market_value": 17500.00,
    "cost_basis": 15000.00,
    "unrealized_pl": 2500.00,
    "unrealized_pl_percent": 16.67
  },
  ...
]
```

**Relaciones:**
- `results` N:1 `portfolios` - Pertenece a una cartera

**Índices:**
- `idx_results_portfolio_id` (portfolio_id)
- `idx_results_date` (date)
- `idx_result_portfolio_date` (portfolio_id, date) - Compuesto

**Constraints:**
- `uq_result_portfolio_date` UNIQUE(portfolio_id, date) - Un solo snapshot por cartera por día

**Cascade:**
- ON DELETE CASCADE: Al eliminar una cartera, se eliminan sus resultados

**Notas:**
- Los snapshots se generan automáticamente cada día a las 20:00 UTC
- El JSON permite consultar el estado histórico de cada posición
- `total_value` = suma de market_value de todas las posiciones
- `invested_value` = suma de cost_basis de todas las posiciones
- `profit_loss` = total_value - invested_value
- `profit_loss_percent` = (profit_loss / invested_value) * 100

---

### 7. **markets** - Mercados Financieros

Catálogo de mercados bursátiles. Tabla de referencia independiente.

**Columnas:**
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único del mercado |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL, INDEX | Nombre del mercado |
| `currency` | VARCHAR(10) | NOT NULL | Moneda principal del mercado |
| `country` | VARCHAR(100) | NULL | País del mercado |
| `created_at` | TIMESTAMP TZ | NOT NULL, DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP TZ | NULL, ON UPDATE | Última actualización |

**Ejemplos de Mercados:**
| Name | Currency | Country |
|------|----------|---------|
| NASDAQ | USD | USA |
| NYSE | USD | USA |
| CONTINUO | EUR | ESPAÑA |
| XETRA | EUR | ALEMANIA |
| LSE | GBP | REINO UNIDO |
| B3 | BRL | BRASIL |

**Relaciones:**
- Tabla independiente, sin relaciones directas (referencia por nombre)

**Índices:**
- `idx_markets_name` (name)

**Notas:**
- Esta tabla es principalmente de referencia
- Se usa en la UI para ayudar al usuario a identificar el mercado correcto
- No hay FK directa desde assets.market para permitir flexibilidad

---

## Relaciones entre Tablas

### Relaciones Padre-Hijo

**1. users → portfolios (1:N)**
- Un usuario puede tener múltiples carteras
- Una cartera pertenece a un solo usuario
- Cascade: DELETE (eliminar usuario elimina sus carteras)

**2. portfolios → transactions (1:N)**
- Una cartera contiene múltiples transacciones
- Una transacción pertenece a una sola cartera
- Cascade: DELETE (eliminar cartera elimina sus transacciones)

**3. portfolios → results (1:N)**
- Una cartera tiene múltiples snapshots de resultados
- Un resultado pertenece a una sola cartera
- Cascade: DELETE (eliminar cartera elimina sus resultados)

**4. assets → quotes (1:N)**
- Un activo tiene múltiples cotizaciones históricas
- Una cotización pertenece a un solo activo
- Cascade: DELETE (eliminar activo elimina sus cotizaciones)

**5. assets → transactions (1:N)**
- Un activo puede estar en múltiples transacciones
- Una transacción opera sobre un solo activo
- Cascade: RESTRICT (no se puede eliminar un activo con transacciones)

---

## Índices y Constraints

### Índices Primarios (PK)
Todas las tablas usan UUID como clave primaria:
- `users.id`
- `assets.id`
- `portfolios.id`
- `transactions.id`
- `quotes.id`
- `results.id`
- `markets.id`

### Índices de Foreign Keys
```sql
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX idx_quotes_asset_id ON quotes(asset_id);
CREATE INDEX idx_results_portfolio_id ON results(portfolio_id);
```

### Índices de Búsqueda
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assets_symbol ON assets(symbol);
CREATE INDEX idx_markets_name ON markets(name);
```

### Índices Temporales
```sql
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_quotes_date ON quotes(date);
CREATE INDEX idx_results_date ON results(date);
```

### Índices Compuestos
```sql
CREATE INDEX idx_transaction_portfolio_date 
  ON transactions(portfolio_id, transaction_date);
  
CREATE INDEX idx_quote_asset_date 
  ON quotes(asset_id, date);
  
CREATE INDEX idx_result_portfolio_date 
  ON results(portfolio_id, date);
```

### Constraints de Unicidad
```sql
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE(username);
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE(email);
ALTER TABLE assets ADD CONSTRAINT uq_assets_symbol UNIQUE(symbol);
ALTER TABLE markets ADD CONSTRAINT uq_markets_name UNIQUE(name);
ALTER TABLE quotes ADD CONSTRAINT uq_quote_asset_date UNIQUE(asset_id, date);
ALTER TABLE results ADD CONSTRAINT uq_result_portfolio_date UNIQUE(portfolio_id, date);
```

---

## Estrategia de Datos

### 1. **Identificadores (UUIDs)**
- **Ventaja**: Generación distribuida, sin colisiones, seguridad
- **Desventaja**: Mayor tamaño (16 bytes vs 8 bytes de BIGINT)
- **Decisión**: La seguridad y escalabilidad justifican el overhead

### 2. **Precisión Financiera**
- **Tipo**: NUMERIC(18, 6) para precios y cantidades
- **Razón**: Evita errores de redondeo de punto flotante
- **Ejemplo**: 1234567890123.123456 (12 dígitos enteros, 6 decimales)

### 3. **Timestamps con Timezone**
- **Tipo**: TIMESTAMP WITH TIME ZONE
- **Estándar**: UTC para almacenamiento
- **Conversión**: En frontend según timezone del usuario
- **Normalización**: Cotizaciones y fechas a medianoche UTC

### 4. **Enums en Base de Datos**
- **Implementación**: SQLAlchemy Enum con native_enum=False
- **Ventaja**: Validación a nivel de aplicación
- **Flexibilidad**: Fácil agregar nuevos valores sin migración

### 5. **Datos JSON**
- **Uso**: Campo `positions_snapshot` en table `results`
- **Ventaja**: Flexibilidad para evolucionar estructura
- **Consultas**: PostgreSQL soporta consultas JSON nativas
- **Ejemplo**: `SELECT positions_snapshot->0->>'symbol' FROM results`

### 6. **Cascade Delete**
```
DELETE user 
  ↓ CASCADE
  DELETE portfolios
    ↓ CASCADE
    DELETE transactions
    DELETE results
```

### 7. **Prevent Orphan Quotes**
- `assets` → RESTRICT en transactions
- No se puede eliminar asset con transacciones
- Mantiene integridad referencial histórica

### 8. **Deduplicación Automática**
- UNIQUE constraints en (asset_id, date) para quotes
- UNIQUE constraints en (portfolio_id, date) para results
- INSERT ... ON CONFLICT DO UPDATE para upserts

---

## Consultas Comunes

### Obtener Posiciones Actuales de una Cartera
```sql
WITH position_calc AS (
  SELECT 
    t.asset_id,
    a.symbol,
    a.name,
    SUM(CASE WHEN t.transaction_type = 'BUY' THEN t.quantity 
             WHEN t.transaction_type = 'SELL' THEN -t.quantity 
             ELSE 0 END) as quantity,
    SUM(CASE WHEN t.transaction_type = 'BUY' THEN t.quantity * t.price + t.fees
             WHEN t.transaction_type = 'SELL' THEN -(t.quantity * t.price - t.fees)
             ELSE 0 END) / NULLIF(SUM(CASE 
               WHEN t.transaction_type = 'BUY' THEN t.quantity 
               ELSE 0 END), 0) as avg_price
  FROM transactions t
  JOIN assets a ON t.asset_id = a.id
  WHERE t.portfolio_id = :portfolio_id
  GROUP BY t.asset_id, a.symbol, a.name
  HAVING SUM(CASE WHEN t.transaction_type = 'BUY' THEN t.quantity 
                  WHEN t.transaction_type = 'SELL' THEN -t.quantity 
                  ELSE 0 END) > 0
)
SELECT 
  pc.*,
  q.close as current_price,
  pc.quantity * q.close as market_value,
  pc.quantity * pc.avg_price as cost_basis,
  (pc.quantity * q.close) - (pc.quantity * pc.avg_price) as unrealized_pl
FROM position_calc pc
LEFT JOIN LATERAL (
  SELECT close 
  FROM quotes 
  WHERE asset_id = pc.asset_id 
  ORDER BY date DESC 
  LIMIT 1
) q ON true;
```

### Historial de Rendimiento (30 días)
```sql
SELECT 
  date,
  total_value,
  invested_value,
  profit_loss,
  profit_loss_percent
FROM results
WHERE portfolio_id = :portfolio_id
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC;
```

### Activos sin Cotizaciones Recientes (más de 7 días)
```sql
SELECT 
  a.symbol,
  a.name,
  MAX(q.date) as last_quote_date,
  CURRENT_DATE - MAX(q.date)::date as days_old
FROM assets a
LEFT JOIN quotes q ON a.id = q.asset_id
GROUP BY a.id, a.symbol, a.name
HAVING MAX(q.date) < CURRENT_DATE - INTERVAL '7 days'
   OR MAX(q.date) IS NULL
ORDER BY days_old DESC NULLS FIRST;
```

---

## Migraciones (Alembic)

### Comandos Principales
```bash
# Crear nueva migración
alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver historial
alembic history

# Ver estado actual
alembic current
```

### Ubicación de Migraciones
```
backend/alembic/
├── versions/       # Archivos de migración
├── env.py          # Configuración de Alembic
└── alembic.ini     # Archivo de configuración
```

---

## Backup y Mantenimiento

### Backup Manual
```bash
# Backup completo
docker compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql

# Backup solo esquema
docker compose exec db pg_dump -U $POSTGRES_USER -s $POSTGRES_DB > schema.sql

# Backup solo datos
docker compose exec db pg_dump -U $POSTGRES_USER -a $POSTGRES_DB > data.sql
```

### Restauración
```bash
# Restaurar backup
docker compose exec -T db psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql
```

### Vacuuming
```bash
# Analizar y optimizar
docker compose exec db psql -U $POSTGRES_USER $POSTGRES_DB -c "VACUUM ANALYZE;"
```

---

## Consideraciones de Rendimiento

### 1. **Paginación**
- Usar LIMIT y OFFSET para grandes conjuntos de datos
- Implementar cursor-based pagination para tablas muy grandes

### 2. **Agregaciones**
- Usar materialized views para cálculos pesados recurrentes
- Los índices compuestos optimizan las consultas frecuentes

### 3. **Particionado** (Futuro)
- Considerar particionar `quotes` por año si crece mucho
- Particionar `transactions` por portfolio_id si hay millones de registros

### 4. **Connection Pool**
- SQLAlchemy usa pool de conexiones (default: 5 conexiones)
- Ajustable en `backend/app/core/database.py`

---

## Changelog

### Versión Actual (Diciembre 2024)
- ✅ Esquema base con 7 tablas
- ✅ Soporte para múltiples tipos de activos
- ✅ Sistema de snapshots diarios (results)
- ✅ Integración con Polygon.io, Finnhub, yfinance
- ✅ Campo `source` en quotes para trazabilidad

### Próximas Mejoras
- [ ] Tabla para watchlists (seguimiento de activos sin comprar)
- [ ] Tabla para alertas de precio
- [ ] Tabla para notas/análisis de operaciones
- [ ] Soporte para operaciones de opciones y futuros

---

**Última actualización**: Diciembre 2024  
**Mantenedor**: Sistema BolsaV6

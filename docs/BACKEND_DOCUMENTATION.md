# 🔧 Documentación del Backend - BolsaV6

## Índice
- [Visión General](#visión-general)
- [Arquitectura](#arquitectura)
- [Estructura de Directorios](#estructura-de-directorios)
- [Módulos Core](#módulos-core)
- [Modelos de Datos](#modelos-de-datos)
- [Servicios](#servicios)
- [APIs REST](#apis-rest)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Tareas Programadas](#tareas-programadas)
- [Configuración](#configuración)

---

## Visión General

El backend de BolsaV6 está construido con **FastAPI** (Python 3.11+), un framework moderno, rápido y con tipado fuerte. Proporciona una API REST para gestión de carteras de inversión, cotizaciones de activos financieros y cálculos fiscales.

### Tecnologías Principales
- **Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+ con Alembic
- **Base de Datos**: PostgreSQL 15
- **Cache/Sesiones**: Redis 7
- **Validación**: Pydantic V2
- **Testing**: Pytest
- **ASGI Server**: Uvicorn

### Características Clave
- ✅ API REST totalmente tipada con OpenAPI/Swagger
- ✅ Autenticación basada en sesiones (Redis)
- ✅ Integración con múltiples proveedores de datos financieros
- ✅ Scheduler para sincronización automática de cotizaciones
- ✅ Cálculos fiscales avanzados (wash sale rule, FIFO)
- ✅ Importación masiva desde Excel
- ✅ CORS configurado para desarrollo y producción

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
│                   (React + Vite)                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│                   (FastAPI Main)                        │
└──────────┬──────────┬──────────┬────────────┬──────────┘
           │          │          │            │
           ▼          ▼          ▼            ▼
    ┌──────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
    │   Auth   │ │ Assets │ │  Quote  │ │ Fiscal   │
    │  Router  │ │ Router │ │ Router  │ │  Router  │
    └────┬─────┘ └───┬────┘ └────┬────┘ └────┬─────┘
         │           │           │            │
         ▼           ▼           ▼            ▼
    ┌──────────────────────────────────────────────┐
    │              Services Layer                  │
    │  • Auth • Dashboard • Fiscal • Quotes •      │
    │  • Polygon • Finnhub • yfinance • Forex      │
    └──────────────┬───────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────────┐
    │            Data Layer (SQLAlchemy)           │
    │  • User • Asset • Portfolio • Transaction    │
    │  • Quote • Result • Market                   │
    └──────────────┬───────────────────────────────┘
                   │
    ┌──────────────┴───────────────┐
    ▼                              ▼
┌─────────┐                  ┌─────────┐
│PostgreSQL│                  │  Redis  │
│   15    │                  │    7    │
└─────────┘                  └─────────┘
```

---

## Estructura de Directorios

```
backend/
├── alembic/                  # Migraciones de base de datos
│   ├── versions/            # Archivos de migración
│   └── env.py              # Configuración Alembic
│
├── app/
│   ├── __init__.py
│   │
│   ├── main.py             # 🚀 Punto de entrada de la aplicación
│   │
│   ├── core/               # 🔐 Núcleo del sistema
│   │   ├── config.py       # Configuración (variables de entorno)
│   │   ├── database.py     # Conexión a PostgreSQL
│   │   ├── security.py     # Hash de contraseñas, JWT utils
│   │   └── session.py      # Gestión de sesiones (Redis)
│   │
│   ├── models/             # 📊 Modelos SQLAlchemy (ORM)
│   │   ├── __init__.py     # Exporta todos los modelos
│   │   ├── user.py         # Modelo de usuarios
│   │   ├── asset.py        # Modelo de activos
│   │   ├── portfolio.py    # Modelo de carteras
│   │   ├── transaction.py  # Modelo de transacciones
│   │   ├── quote.py        # Modelo de cotizaciones
│   │   ├── result.py       # Modelo de resultados (snapshots)
│   │   └── market.py       # Modelo de mercados
│   │
│   ├── schemas/            # 📋 Esquemas Pydantic (validación)
│   │   ├── __init__.py
│   │   ├── user.py         # Schemas de usuario
│   │   ├── asset.py        # Schemas de activos
│   │   ├── portfolio.py    # Schemas de carteras
│   │   ├── transaction.py  # Schemas de transacciones
│   │   ├── quote.py        # Schemas de cotizaciones
│   │   ├── dashboard.py    # Schemas de dashboard
│   │   ├── fiscal.py       # Schemas de informes fiscales
│   │   └── market.py       # Schemas de mercados
│   │
│   ├── api/                # 🌐 Endpoints REST (Routers)
│   │   ├── __init__.py
│   │   ├── auth.py         # Login, logout, validación sesión
│   │   ├── users.py        # CRUD usuarios
│   │   ├── assets.py       # CRUD activos
│   │   ├── portfolios.py   # CRUD carteras
│   │   ├── transactions.py # CRUD transacciones
│   │   ├── quotes.py       # Importación y consulta de cotizaciones
│   │   ├── dashboard.py    # Estadísticas de cartera
│   │   ├── fiscal.py       # Cálculo de impacto fiscal
│   │   ├── markets.py      # CRUD mercados
│   │   └── import_transactions.py  # Importación desde Excel
│   │
│   ├── services/           # 🛠️ Lógica de negocio
│   │   ├── __init__.py
│   │   ├── polygon_service.py      # Cotizaciones históricas (Polygon.io)
│   │   ├── finnhub_service.py      # Cotizaciones en tiempo real (Finnhub)
│   │   ├── yfinance_service.py     # Cotizaciones de Yahoo Finance
│   │   ├── alpha_vantage_service.py # Legacy - Alpha Vantage
│   │   ├── forex_service.py        # Conversión de divisas
│   │   ├── fiscal_service.py       # Cálculos fiscales (FIFO, wash sale)
│   │   ├── dashboard_service.py    # Estadísticas y gráficos
│   │   └── scheduler_service.py    # Tareas programadas (Daily Close & Backfill)
│   │
│   └── scripts/            # 📜 Scripts de utilidad
│       ├── init_markets_db.py      # Inicializar mercados
│       └── seed_currency_pairs.py  # Sembrar pares de divisas
│
├── alembic.ini             # Configuración Alembic
├── Dockerfile              # Imagen Docker del backend
├── requirements.txt        # Dependencias Python
└── create_admin.py         # Script para crear usuario admin

```

---

## Módulos Core

### 1. **config.py** - Configuración del Sistema

Gestiona todas las variables de entorno usando Pydantic Settings.

**Clase Principal**: `Settings(BaseSettings)`

**Variables de Configuración:**

```python
# Base de datos
DATABASE_URL: str               # postgresql://user:pass@host:port/db
POSTGRES_USER: str
POSTGRES_PASSWORD: str
POSTGRES_DB: str

# Redis (sesiones)
REDIS_URL: str                  # redis://host:port/db

# Seguridad
SECRET_KEY: str                 # Clave secreta para JWT/sessions
ENVIRONMENT: str                # "development" | "production"
CORS_ORIGINS: str               # Orígenes permitidos (CSV)
SESSION_EXPIRE_MINUTES: int    # Duración de sesión (default: 480)
SECURE_COOKIES: bool            # Solo HTTPS en producción

# APIs externas
POLYGON_API_KEY: str            # Polygon.io (históricos)
FINNHUB_API_KEY: str            # Finnhub (tiempo real)
ALPHA_VANTAGE_API_KEY: str      # Deprecated

# Scheduler
QUOTE_UPDATE_INTERVAL_MINUTES: int  # Intervalo de sync (default: 60)

# Usuario admin inicial
ADMIN_USERNAME: str
ADMIN_EMAIL: str
ADMIN_PASSWORD: str
```

**Propiedades Computadas:**

```python
@property
def cors_origins_list(self) -> List[str]:
    """Convierte CORS_ORIGINS string a lista"""
    # En desarrollo, permite automáticamente:
    # - http://localhost:3000, :5173
    # - http://127.0.0.1:3000, :5173

@property
def is_cors_permissive(self) -> bool:
    """En desarrollo, permite cualquier origen de red local"""
    return self.ENVIRONMENT == "development"
```

**Uso:**
```python
from app.core.config import settings

database_url = settings.DATABASE_URL
api_key = settings.POLYGON_API_KEY
```

---

### 2. **database.py** - Conexión a PostgreSQL

Configura SQLAlchemy y proporciona el engine, session maker y Base para modelos.

**Componentes:**

```python
# Engine de SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base declarativa para modelos
Base = declarative_base()

# Dependencia para FastAPI
def get_db():
    """Proporciona sesión de BD a endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Uso en Endpoints:**
```python
from app.core.database import get_db
from sqlalchemy.orm import Session

@router.get("/assets/")
def get_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    return assets
```

---

### 3. **security.py** - Seguridad y Hashing

Gestiona el hash de contraseñas usando bcrypt.

**Funciones:**

```python
def get_password_hash(password: str) -> str:
    """Hash de contraseña con bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica contraseña contra hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

**Configuración:**
```python
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)
```

**Uso:**
```python
from app.core.security import get_password_hash, verify_password

# Al crear usuario
hashed = get_password_hash("password123")
user.hashed_password = hashed

# Al hacer login
if verify_password(form_password, user.hashed_password):
    # Login exitoso
```

---

### 4. **session.py** - Gestión de Sesiones (Redis)

Maneja sesiones de usuario usando Redis como backend.

**Funciones Principales:**

```python
async def create_session(user_id: str) -> str:
    """Crea nueva sesión, retorna session_id"""
    session_id = str(uuid.uuid4())
    session_data = {
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat()
    }
    await redis.setex(
        f"session:{session_id}",
        settings.SESSION_EXPIRE_MINUTES * 60,
        json.dumps(session_data)
    )
    return session_id

async def get_session(session_id: str) -> Optional[Dict]:
    """Obtiene datos de sesión"""
    data = await redis.get(f"session:{session_id}")
    return json.loads(data) if data else None

async def delete_session(session_id: str):
    """Elimina sesión (logout)"""
    await redis.delete(f"session:{session_id}")

async def extend_session(session_id: str):
    """Extiende TTL de sesión"""
    await redis.expire(
        f"session:{session_id}",
        settings.SESSION_EXPIRE_MINUTES * 60
    )
```

**Dependencia de Autenticación:**

```python
async def get_current_user(
    session_id: str = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """Valida sesión y retorna usuario actual"""
    if not session_id:
        raise HTTPException(401, "Not authenticated")
    
    session_data = await get_session(session_id)
    if not session_data:
        raise HTTPException(401, "Invalid session")
    
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    if not user or not user.is_active:
        raise HTTPException(401, "User not found or inactive")
    
    await extend_session(session_id)
    return user
```

---

## Modelos de Datos

Ver [DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md) para detalles completos de cada modelo.

**Modelos disponibles:**
- `User` - Usuarios del sistema
- `Asset` - Activos financieros
- `Portfolio` - Carteras de inversión
- `Transaction` - Transacciones/operaciones
- `Quote` - Cotizaciones históricas (OHLCV)
- `Result` - Snapshots diarios de resultados
- `Market` - Mercados bursátiles
- `SystemSetting` - Configuración global
- `SystemSetting` - Configuración dinámica global

**Importación:**
```python
from app.models import User, Asset, Portfolio, Transaction, Quote, Result, Market
```

---

## Servicios

### 1. **polygon_service.py** - Cotizaciones Históricas (Polygon.io)

🎯 **Propósito**: Obtener datos históricos de alta calidad (500-730 días).

**Características:**
- Prioridad sobre otros proveedores para históricos
- Rate limiting: 5 peticiones/minuto (12s entre llamadas)
- Conversión automática de tickers (BTC → X:BTCUSD)
- Normalización a formato OHLCV estándar

**Clase Principal**: `PolygonService`

**Métodos:**

```python
async def get_historical_quotes(
    self,
    symbol: str,
    days: int = 730
) -> Optional[List[Dict]]:
    """
    Obtiene cotizaciones históricas de Polygon.io
    
    Args:
        symbol: Ticker del activo (ej: AAPL, BTC-USD)
        days: Número de días hacia atrás (default: 730)
    
    Returns:
        Lista de dicts con formato OHLCV:
        [{
            'date': '2024-01-01T00:00:00Z',
            'open': 150.00,
            'high': 155.00,
            'low': 149.00,
            'close': 154.00,
            'volume': 1000000
        }, ...]
    
    Rate Limit: 12s entre llamadas (5 req/min)
    """

async def get_latest_quote(self, symbol: str) -> Optional[Dict]:
    """Obtiene última cotización disponible"""

async def search_symbols(self, query: str) -> Optional[List[Dict]]:
    """Busca símbolos por nombre"""
```

**Conversiones de Ticker:**
```python
BTC → X:BTCUSD
ETH → X:ETHUSD
EUR/USD → C:EURUSD
```

**Uso:**
```python
from app.services.polygon_service import PolygonService

service = PolygonService()
quotes = await service.get_historical_quotes("AAPL", days=500)
# Retorna ~500 días de cotizaciones
```

---

### 2. **finnhub_service.py** - Cotizaciones en Tiempo Real

🎯 **Propósito**: Obtener precios actuales de activos en tiempo real.

**Características:**
- Acciones, ETFs y criptomonedas
- Latencia muy baja (<1s)
- Incluye metadatos (variación diaria, % cambio)

**Clase Principal**: `FinnhubService`

**Métodos:**

```python
async def get_daily_quotes(
    self,
    symbol: str,
    full_history: bool = False
) -> Optional[List[Dict]]:
    """
    Obtiene cotizaciones. Si full_history=False, solo retorna actual.
    Si full_history=True, retorna últimos 30 días.
    """

async def get_quote(self, symbol: str) -> Optional[Dict]:
    """
    Obtiene cotización actual
    
    Returns:
        {
            'symbol': 'AAPL',
            'current_price': 175.50,
            'high': 176.00,
            'low': 174.00,
            'open': 175.00,
            'previous_close': 173.50,
            'change': 2.00,
            'percent_change': 1.15,
            'timestamp': 1234567890
        }
    """

async def search_symbols(self, query: str) -> List[Dict]:
    """Busca activos por nombre o ticker"""

async def get_company_profile(self, symbol: str) -> Optional[Dict]:
    """Obtiene información de la empresa"""
```

**Uso:**
```python
from app.services.finnhub_service import FinnhubService

service = FinnhubService()
quote = await service.get_quote("AAPL")
print(f"Precio actual: ${quote['current_price']}")
```

---

### 3. **yfinance_service.py** - Yahoo Finance (Sincronización Diaria)

🎯 **Propósito**: Sincronización automática diaria de cotizaciones.

**Características:**
- Datos gratuitos y confiables
- Usado por el scheduler para actualizaciones automáticas
- Fallback si Polygon.io falla
- Soporte para normalización de tickers internacionales

**Clase Principal**: `YFinanceService`

**Métodos:**

```python
async def get_historical_quotes(
    self,
    symbol: str,
    days: int = 365
) -> Optional[List[Dict]]:
    """Obtiene cotizaciones históricas"""

async def get_current_quote(self, symbol: str) -> Optional[Dict]:
    """Obtiene cotización actual"""

async def get_multiple_current_quotes(
    self,
    symbols: List[str]
) -> Dict[str, Optional[Dict]]:
    """Obtiene cotizaciones de múltiples activos en paralelo"""

async def get_asset_metadata(
    self,
    symbol: str,
    name_hint: Optional[str] = None,
    market_hint: Optional[str] = None
) -> Dict[str, str]:
    """
    Obtiene metadatos del activo
    
    Returns:
        {
            'name': 'Apple Inc.',
            'currency': 'USD',
            'market': 'NASDAQ',
            'asset_type': 'stock'
        }
    """

async def normalize_symbol_for_market(
    self,
    symbol: str,
    market_hint: Optional[str] = None
) -> str:
    """Normaliza ticker según mercado"""
```

**Normalización de Tickers:**
```python
# España (Continuo)
SAN → SAN.MC
TEF → TEF.MC

# Alemania (XETRA)
BMW → BMW.DE
SAP → SAP.DE

# Reino Unido (LSE)
BP → BP.L
HSBA → HSBA.L
```

**Uso:**
```python
from app.services.yfinance_service import YFinanceService

service = YFinanceService()
quotes = await service.get_historical_quotes("AAPL", days=30)
```

---

### 4. **forex_service.py** - Conversión de Divisas

🎯 **Propósito**: Convertir valores entre diferentes monedas.

**Características:**
- Cache en memoria (5 minutos)
- Múltiples fuentes (quotes table, yfinance)
- Soporte para pares exóticos

**Clase Principal**: `ForexService`

**Métodos:**

```python
async def get_exchange_rate(
    self,
    from_currency: str,
    to_currency: str,
    date: Optional[datetime] = None,
    db: Optional[Session] = None
) -> Optional[float]:
    """
    Obtiene tasa de cambio
    
    Args:
        from_currency: Moneda origen (EUR)
        to_currency: Moneda destino (USD)
        date: Fecha específica (opcional, default: hoy)
        db: Sesión de BD (opcional)
    
    Returns:
        Tasa de cambio (ej: 1.08 para EUR/USD)
    
    Cache: 5 minutos
    """

async def convert_value(
    self,
    value: float,
    from_currency: str,
    to_currency: str,
    date: Optional[datetime] = None,
    db: Optional[Session] = None
) -> Optional[float]:
    """Convierte valor de una moneda a otra"""

def clear_cache(self):
    """Limpia el cache de tasas"""
```

**Uso:**
```python
from app.services.forex_service import ForexService

service = ForexService()

# Obtener tasa
rate = await service.get_exchange_rate("EUR", "USD", db=db)
# Retorna: 1.08

# Convertir valor
usd_value = await service.convert_value(1000, "EUR", "USD", db=db)
# Retorna: 1080.0
```

---

### 5. **fiscal_service.py** - Cálculos Fiscales

🎯 **Propósito**: Calcular impacto fiscal de operaciones (plusvalías, minusvalías).

**Características:**
- Método FIFO (First In, First Out)
- Wash Sale Rule (30 días antes/después)
- Soporte para múltiples activos
- Generación de informe detallado

**Clase Principal**: `FiscalService`

**Métodos:**

```python
def calculate_fiscal_impact(
    self,
    portfolio_id: str,
    operations: List[FiscalOperation]
) -> FiscalReport:
    """
    Calcula impacto fiscal de operaciones de venta
    
    Args:
        portfolio_id: ID de la cartera
        operations: Lista de operaciones ordenadas por fecha
    
    Returns:
        FiscalReport con:
        - total_gain: Ganancias totales
        - total_loss: Pérdidas totales
        - net_result: Resultado neto
        - items: Detalle de cada venta
        - wash_sale_adjustments: Ajustes por wash sale
    
    Reglas:
    1. FIFO: Se venden primero las acciones compradas más antiguas
    2. Wash Sale: Minusvalías dentro de 30 días se difieren
    3. Comisiones: Se incluyen en el costo base
    """
```

**Estructura FiscalOperation:**
```python
@dataclass
class FiscalOperation:
    asset_id: str
    asset_symbol: str
    transaction_type: str  # BUY, SELL
    date: datetime
    quantity: Decimal
    price: Decimal
    fees: Decimal
```

**Estructura FiscalReport:**
```python
@dataclass
class FiscalReport:
    portfolio_id: str
    total_gain: Decimal          # Ganancias
    total_loss: Decimal          # Pérdidas
    net_result: Decimal          # Neto
    items: List[FiscalResultItem]  # Detalle
    wash_sale_adjustments: List[Dict]  # Ajustes
```

**Uso:**
```python
from app.services.fiscal_service import FiscalService, FiscalOperation

service = FiscalService()
operations = [
    FiscalOperation(asset_id="...", symbol="AAPL", type="BUY", ...),
    FiscalOperation(asset_id="...", symbol="AAPL", type="SELL", ...)
]

report = service.calculate_fiscal_impact(portfolio_id, operations)
print(f"Resultado neto: {report.net_result}")
```

---

### 6. **dashboard_service.py** - Estadísticas de Cartera

🎯 **Propósito**: Calcular métricas y estadísticas de una cartera.

**Características:**
- Posiciones actuales con precios de mercado
- Distribución por activo
- Histórico de rendimiento (30/90/365 días)
- Performance charts

**Clase Principal**: `DashboardService`

**Métodos:**

```python
async def get_stats(
    self,
    portfolio_id: str,
    db: Session,
    user_currency: str = "EUR"
) -> DashboardStats:
    """
    Calcula estadísticas completas de cartera
    
    Returns:
        DashboardStats con:
        - total_value: Valor total actual
        - invested_value: Valor invertido
        - profit_loss: Ganancia/pérdida absoluta
        - profit_loss_percent: % de rendimiento
        - positions: Lista de posiciones actuales
        - distribution: Distribución por activo
        - history: Histórico de rendimiento
        - top_gainers: Mejores activos
        - top_losers: Peores activos
    """
```

**Estructura Position:**
```python
{
    'asset_id': 'uuid',
    'symbol': 'AAPL',
    'name': 'Apple Inc.',
    'quantity': 100.0,
    'avg_price': 150.00,
    'current_price': 175.00,
    'market_value': 17500.00,
    'cost_basis': 15000.00,
    'unrealized_pl': 2500.00,
    'unrealized_pl_percent': 16.67,
    'weight': 25.5  # % del portfolio
}
```

**Uso:**
```python
from app.services.dashboard_service import DashboardService

service = DashboardService()
stats = await service.get_stats(portfolio_id, db, user_currency="EUR")
print(f"Valor total: {stats.total_value} {user_currency}")
```

---

### 7. **scheduler_service.py** - Tareas Programadas

🎯 **Propósito**: Sincronización automática de cotizaciones.

**Características:**
- Ejecuta cada hora (configurable)
- Actualiza cotizaciones de todos los activos
- Usa yfinance como fuente principal
- Logging detallado

**Clase Principal**: `SchedulerService`

**Métodos:**

```python
def start(self):
    """Inicia el scheduler"""

def shutdown(self):
    """Detiene el scheduler"""

async def sync_all_quotes(self):
    """Sincroniza cotizaciones de todos los activos"""
```

**Configuración:**
```python
# Intervalo de actualización (minutos)
QUOTE_UPDATE_INTERVAL_MINUTES = 60

# El scheduler se inicia automáticamente al arrancar la app
# Ver app/main.py @app.on_event("startup")
```

**Logs:**
```
[INFO] 🚀 Iniciando sincronización de cotizaciones...
[INFO] 📊 Sincronizando 15 activos
[INFO] ✅ AAPL: 175.50 USD (actualizado)
[INFO] ✅ GOOGL: 142.30 USD (actualizado)
[INFO] ❌ INVALID: Error - Symbol not found
[INFO] 🎉 Sincronización completada: 14/15 exitosos
```

---

## APIs REST

### Autenticación: `/api/auth`

**POST /api/auth/login**
```python
Request:
{
    "username": "admin",
    "password": "admin123"
}

Response:
{
    "user": {
        "id": "uuid",
        "username": "admin",
        "email": "admin@example.com",
        "is_admin": true,
        "base_currency": "EUR"
    }
}

Cookie: session_id=<uuid>
```

**POST /api/auth/logout**
```python
Request: (vacío)
Response: { "message": "Logged out" }
Cookie: session_id=deleted
```

**GET /api/auth/me**
```python
Response:
{
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "is_admin": true,
    "base_currency": "EUR"
}
```

---

### Usuarios: `/api/users`

**GET /api/users/** (Admin only)
```python
Response: [
    {
        "id": "uuid",
        "username": "user1",
        "email": "user1@example.com",
        "is_active": true,
        "is_admin": false,
        "base_currency": "EUR"
    }
]
```

**POST /api/users/** (Admin only)
```python
Request:
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securepass123",
    "is_admin": false,
    "base_currency": "USD"
}

Response: (User object)
```

**PATCH /api/users/{user_id}** (Admin only)
**DELETE /api/users/{user_id}** (Admin only)

---

### Activos: `/api/assets`

**GET /api/assets/**
```python
Query params:
- symbol: Filtrar por símbolo (opcional)
- asset_type: Filtrar por tipo (opcional)

Response: [
    {
        "id": "uuid",
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "asset_type": "stock",
        "currency": "USD",
        "market": "NASDAQ"
    }
]
```

**POST /api/assets/**
```python
Request:
{
    "symbol": "MSFT",
    "name": "Microsoft Corporation",
    "asset_type": "stock",
    "currency": "USD",
    "market": "NASDAQ"
}
```

**PATCH /api/assets/{asset_id}**
**DELETE /api/assets/{asset_id}**

---

### Carteras: `/api/portfolios`

**GET /api/portfolios/**
```python
Response: [
    {
        "id": "uuid",
        "name": "Mi Cartera Principal",
        "description": "Inversiones a largo plazo",
        "created_at": "2024-01-01T00:00:00Z"
    }
]
```

**POST /api/portfolios/**
```python
Request:
{
    "name": "Nueva Cartera",
    "description": "Descripción opcional"
}
```

**GET /api/portfolios/{portfolio_id}/positions**
```python
Response: {
    "positions": [
        {
            "asset_id": "uuid",
            "symbol": "AAPL",
            "quantity": 100,
            "avg_price": 150.00,
            "current_price": 175.00,
            "market_value": 17500.00,
            "unrealized_pl": 2500.00
        }
    ]
}
```

---

### Transacciones: `/api/transactions`

**GET /api/transactions/portfolio/{portfolio_id}**
```python
Query params:
- asset_id: Filtrar por activo (opcional)
- start_date: Fecha inicio (opcional)
- end_date: Fecha fin (opcional)

Response: [
    {
        "id": "uuid",
        "portfolio_id": "uuid",
        "asset_id": "uuid",
        "transaction_type": "BUY",
        "transaction_date": "2024-01-01T00:00:00Z",
        "quantity": 100,
        "price": 150.00,
        "fees": 10.00,
        "notes": "Compra inicial"
    }
]
```

**POST /api/transactions/portfolio/{portfolio_id}**
```python
Request:
{
    "asset_id": "uuid",
    "transaction_type": "BUY",
    "transaction_date": "2024-01-01T12:00:00Z",
    "quantity": 100,
    "price": 150.00,
    "fees": 10.00,
    "notes": "Opcional"
}
```

**PATCH /api/transactions/{transaction_id}**
**DELETE /api/transactions/{transaction_id}**

---

### Cotizaciones: `/api/quotes`

**GET /api/quotes/asset/{asset_id}**
```python
Query params:
- start_date: Fecha inicio (opcional)
- end_date: Fecha fin (opcional)
- limit: Límite de resultados (default: 100)

Response: [
    {
        "id": "uuid",
        "asset_id": "uuid",
        "date": "2024-01-01T00:00:00Z",
        "open": 150.00,
        "high": 155.00,
        "low": 149.00,
        "close": 154.00,
        "volume": 1000000,
        "source": "polygon"
    }
]
```

**POST /api/quotes/asset/{asset_id}/fetch-history**
```python
Request:
{
    "days": 365,
    "source": "polygon"  # opcional: "polygon", "yfinance", "alpha_vantage"
}

Response:
{
    "message": "Import started",
    "task_id": "uuid"
}
```

**POST /api/quotes/asset/{asset_id}/fetch-latest**
```python
Response:
{
    "message": "Latest quote fetched",
    "quote": { ... }
}
```

**POST /api/quotes/sync-all**
```python
Response:
{
    "message": "Sync started for all assets",
    "assets_count": 15
}
```

**GET /api/quotes/assets/coverage**
```python
Response:
{
    "assets": [
        {
            "asset_id": "uuid",
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "needs_import": true,
            "reason": "incomplete_data",
            "message": "Solo 150 cotizaciones (necesita >= 400)",
            "coverage": {
                "has_quotes": true,
                "total_quotes": 150,
                "first_date": "2024-01-01",
                "last_date": "2024-06-30",
                "days_since_last_update": 180,
                "is_complete": false,
                "needs_update": true
            }
        }
    ],
    "stats": {
        "total_assets": 15,
        "no_data": 2,
        "incomplete_data": 5,
        "outdated": 3,
        "complete": 5
    }
}
```

**POST /api/quotes/import/bulk-historical**
```python
Request:
{
    "asset_ids": ["uuid1", "uuid2"],  # opcional, si vacío importa todos
    "force_refresh": false
}

Response:
{
    "message": "Bulk import started",
    "assets_to_import": 10
}
```

---

### Dashboard: `/api/dashboard`

**GET /api/dashboard/{portfolio_id}/stats**
```python
Response:
{
    "total_value": 50000.00,
    "invested_value": 45000.00,
    "profit_loss": 5000.00,
    "profit_loss_percent": 11.11,
    "positions": [ ... ],
    "distribution": [
        { "symbol": "AAPL", "value": 17500, "weight": 35.0 },
        { "symbol": "GOOGL", "value": 15000, "weight": 30.0 }
    ],
    "history": [
        { "date": "2024-01-01", "value": 45000 },
        { "date": "2024-01-02", "value": 46000 }
    ],
    "top_gainers": [ ... ],
    "top_losers": [ ... ]
}
```

---

### Fiscal: `/api/fiscal`

**GET /api/fiscal/calculate**
```python
Query params:
- portfolio_id: ID de cartera (requerido)
- year: Año fiscal (opcional, default: año actual)

Response:
{
    "portfolio_id": "uuid",
    "total_gain": 10000.00,
    "total_loss": 2000.00,
    "net_result": 8000.00,
    "items": [
        {
            "asset_symbol": "AAPL",
            "sell_date": "2024-06-01",
            "sell_quantity": 50,
            "sell_price": 180.00,
            "cost_basis": 150.00,
            "gain_loss": 1500.00,
            "is_wash_sale": false
        }
    ],
    "wash_sale_adjustments": [ ... ]
}
```

---

### Mercados: `/api/markets`

**GET /api/markets/**
**POST /api/markets/**
**PATCH /api/markets/{market_id}**
**DELETE /api/markets/{market_id}**

---

### Importación: `/api/import`

**POST /api/import/transactions/excel/{portfolio_id}**
```python
Request: (multipart/form-data)
- file: Archivo Excel (.xlsx)

Response:
{
    "message": "Imported successfully",
    "imported_count": 50,
    "errors": []
}

Formato Excel esperado:
| Fecha      | Tipo  | Símbolo | Cantidad | Precio | Comisión | Notas |
|------------|-------|---------|----------|--------|----------|-------|
| 2024-01-01 | BUY   | AAPL    | 100      | 150.00 | 10.00    | ...   |
```

---

## Autenticación y Seguridad

### Sistema de Sesiones

**Flujo de Login:**
```
1. Usuario envía username + password
2. Backend valida credenciales
3. Backend crea sesión en Redis (TTL: 8 horas)
4. Backend retorna cookie con session_id
5. Frontend incluye cookie en todas las peticiones
6. Backend valida sesión en cada request
7. Backend extiende TTL en cada request válido
```

**Middleware de Autenticación:**
```python
@router.get("/protected-endpoint")
async def protected(
    current_user: User = Depends(get_current_user)
):
    # current_user está autenticado
    return {"user_id": current_user.id}
```

**Permisos de Administrador:**
```python
def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_admin:
        raise HTTPException(403, "Admin required")
    return current_user

@router.get("/admin-only")
async def admin_only(
    admin: User = Depends(get_admin_user)
):
    # Solo admins pueden acceder
```

---

### CORS (Cross-Origin Resource Sharing)

**Desarrollo:**
```python
ENVIRONMENT=development

# CORS permisivo:
- localhost:3000, localhost:5173
- 127.0.0.1:3000, 127.0.0.1:5173
- Cualquier IP de red local (192.168.x.x, 10.x.x.x)

# Regex en main.py:
allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$"
```

**Producción:**
```python
ENVIRONMENT=production
CORS_ORIGINS=https://bolsav6.com,https://www.bolsav6.com

# CORS restrictivo:
- Solo orígenes listados en CORS_ORIGINS
- HTTPS obligatorio (SECURE_COOKIES=true)
```

---

### Hashing de Contraseñas

**Algoritmo**: bcrypt con cost factor 12

```python
from app.core.security import get_password_hash, verify_password

# Al crear usuario
hashed = get_password_hash("password123")
# $2b$12$KIXl5QjH8N9kZq...

# Al validar login
is_valid = verify_password("password123", hashed)
# True
```

---

## Tareas Programadas

### Scheduler de Cotizaciones

**Configuración:**
```python
# .env
QUOTE_UPDATE_INTERVAL_MINUTES=60
```

**Funcionamiento:**
1. Se inicia automáticamente al arrancar la app
2. Ejecuta `sync_all_quotes()` cada 60 minutos
3. Actualiza cotizaciones de todos los activos con yfinance
4. Guarda en base de datos (upsert)
5. Logging detallado de resultados

**Ejecución Manual:**
```python
POST /api/quotes/sync-all
```

**Logs:**
```
[2024-12-24 10:00:00] INFO: 🚀 Iniciando sincronización de cotizaciones...
[2024-12-24 10:00:01] INFO: 📊 Sincronizando 15 activos
[2024-12-24 10:00:02] INFO: ✅ AAPL: 175.50 USD
[2024-12-24 10:00:03] INFO: ✅ GOOGL: 142.30 USD
...
[2024-12-24 10:00:15] INFO: 🎉 Sincronización completada: 14/15 exitosos
```

---

## Configuración

### Variables de Entorno (.env)

```bash
# Base de datos PostgreSQL
DATABASE_URL=postgresql://bolsav6:securepassword@db:5432/bolsav6
POSTGRES_USER=bolsav6
POSTGRES_PASSWORD=securepassword
POSTGRES_DB=bolsav6

# Redis
REDIS_URL=redis://redis:6379/0

# Seguridad
SECRET_KEY=your-super-secret-key-change-in-production
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
SESSION_EXPIRE_MINUTES=480
SECURE_COOKIES=false

# APIs externas
POLYGON_API_KEY=your-polygon-api-key
FINNHUB_API_KEY=your-finnhub-api-key
ALPHA_VANTAGE_API_KEY=deprecated

# Scheduler
QUOTE_UPDATE_INTERVAL_MINUTES=60

# Usuario admin inicial
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@bolsav6.local
ADMIN_PASSWORD=admin123
```

---

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código de la aplicación
COPY . .

# Puerto
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

### requirements.txt

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
httpx==0.25.2
aiohttp==3.9.1
yfinance==0.2.33
pandas==2.1.4
openpyxl==3.1.2
python-dateutil==2.8.2
```

---

### Ejecución

**Desarrollo:**
```bash
# Con Docker Compose
docker compose up backend

# Sin Docker
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Producción:**
```bash
# Docker Compose (recomendado)
docker compose up -d backend

# Directo
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Migraciones:**
```bash
# Aplicar migraciones
docker compose exec backend alembic upgrade head

# Crear migración
docker compose exec backend alembic revision --autogenerate -m "descripción"
```

**Crear Admin:**
```bash
docker compose exec backend python create_admin.py
```

---

## Testing

```bash
# Ejecutar tests
docker compose exec backend pytest

# Con coverage
docker compose exec backend pytest --cov=app --cov-report=html

# Test específico
docker compose exec backend pytest tests/test_auth.py
```

---

## Logging

**Configuración:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

**Uso:**
```python
logger.info("✅ Operación exitosa")
logger.warning("⚠️ Advertencia")
logger.error("❌ Error")
```

---

## API Documentation

**Swagger UI**: http://localhost:8000/docs  
**ReDoc**: http://localhost:8000/redoc

---

**Última actualización**: Diciembre 2024  
**Mantenedor**: Sistema BolsaV6

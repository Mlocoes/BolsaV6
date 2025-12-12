"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Importar routers
from app.api import auth, users, assets, portfolios, transactions, quotes, import_transactions

# Crear aplicación
app = FastAPI(
    title="BolsaV6 API",
    description="Sistema de gestión de carteras de inversión",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
# En desarrollo: permite cualquier origen de red local automáticamente
# En producción: solo los orígenes configurados en CORS_ORIGINS
if settings.ENVIRONMENT == "development":
    # Modo desarrollo: CORS permisivo para facilitar desarrollo en red local
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    print("🌐 CORS: Modo desarrollo - Aceptando orígenes de red local")
else:
    # Modo producción: CORS restrictivo
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    print(f"🌐 CORS: Modo producción - Orígenes permitidos: {settings.cors_origins_list}")

# Registrar routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios"])
app.include_router(assets.router, prefix="/api/assets", tags=["Activos"])
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["Carteras"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transacciones"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["Cotizaciones"])
app.include_router(import_transactions.router, prefix="/api/import", tags=["Importación"])

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

# Root
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BolsaV6 API",
        "docs": "/docs",
        "health": "/health"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Evento de inicio"""
    from app.core.session import session_manager
    await session_manager.connect()


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre"""
    from app.core.session import session_manager
    await session_manager.disconnect()

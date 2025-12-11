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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

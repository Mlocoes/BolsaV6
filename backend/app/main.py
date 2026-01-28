"""
FastAPI Main Application
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_exceeded_handler

# Importar routers
from app.api import assets, transactions, portfolios, quotes, import_transactions, auth, users, fiscal, dashboard, markets, backup, system_settings, monitor
from app.services.scheduler_service import scheduler_service


class HTTPSRedirectFixMiddleware:
    """
    Middleware ASGI para corregir URLs de redirección cuando la app está detrás de un proxy HTTPS.
    
    Problema: FastAPI genera redirects (ej: trailing slash) usando http:// porque no sabe
    que está detrás de Traefik con HTTPS. Aunque ProxyHeadersMiddleware procesa X-Forwarded-Proto,
    los redirects ya se generan antes.
    
    Solución: Este middleware intercepta las respuestas y reescribe el header Location
    de http:// a https:// cuando el cliente llegó por HTTPS (X-Forwarded-Proto: https).
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Obtener X-Forwarded-Proto de los headers
        headers = dict(scope.get("headers", []))
        forwarded_proto = headers.get(b"x-forwarded-proto", b"http").decode()
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start" and forwarded_proto == "https":
                # Buscar y modificar el header Location si existe
                headers = list(message.get("headers", []))
                new_headers = []
                
                for name, value in headers:
                    if name == b"location" and value.startswith(b"http://"):
                        # Reemplazar http:// por https://
                        new_value = b"https://" + value[7:]
                        new_headers.append((name, new_value))
                    else:
                        new_headers.append((name, value))
                
                message = {**message, "headers": new_headers}
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


# Crear aplicación
app = FastAPI(
    title="BolsaV6 API",
    description="Sistema de gestión de carteras de inversión",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# IMPORTANTE: Middleware para corregir redirects HTTP->HTTPS cuando estamos detrás de proxy
# Debe añadirse ANTES de otros middlewares para interceptar las respuestas correctamente
app.add_middleware(HTTPSRedirectFixMiddleware)

# IMPORTANTE: Confiar en headers de proxy (Traefik)
# En producción: solo confiar en hosts específicos para evitar IP spoofing
trusted_hosts = ["127.0.0.1", "localhost", "traefik", "nginx"] if settings.ENVIRONMENT == "production" else "*"
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=trusted_hosts)

# Configurar CORS
# En desarrollo: permite cualquier origen de red local automáticamente
# En producción: solo los orígenes configurados en CORS_ORIGINS
# ADVERTENCIA: is_cors_permissive debe ser False en producción para evitar vulnerabilidades CSRF/CORS.
if settings.is_cors_permissive:
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
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transacciones"])
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["Carteras"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["Cotizaciones"])
app.include_router(import_transactions.router, prefix="/api/import", tags=["Importación"])
app.include_router(fiscal.router, prefix="/api/fiscal", tags=["Fiscalidad"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(markets.router, prefix="/api/markets", tags=["Mercados"])
app.include_router(backup.router, prefix="/api/backup", tags=["Backup"])
app.include_router(system_settings.router, prefix="/api/settings/system", tags=["Configuración Sistema"])
app.include_router(monitor.router, prefix="/api/monitor", tags=["Monitor"])

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
    from app.core.redis_client import redis_client
    from app.services.market_data_service import market_data_service
    
    await session_manager.connect()
    await redis_client.connect()
    
    # Iniciar programador de tareas
    scheduler_service.start()
    
    # Iniciar servicio de datos de mercado (Background)
    import asyncio
    asyncio.create_task(market_data_service.start_background_service())


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre"""
    from app.core.session import session_manager
    from app.core.redis_client import redis_client
    from app.services.market_data_service import market_data_service
    
    await market_data_service.stop_background_service()
    await session_manager.disconnect()
    await redis_client.close()
    
    # Detener programador de tareas
    scheduler_service.shutdown()

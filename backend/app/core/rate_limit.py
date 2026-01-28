"""
Rate Limiting con SlowAPI
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def get_client_ip(request: Request) -> str:
    """
    Obtener IP del cliente considerando proxy headers.
    
    Prioridad:
    1. X-Forwarded-For (primer IP)
    2. X-Real-IP
    3. client.host
    """
    # X-Forwarded-For puede tener múltiples IPs: "client, proxy1, proxy2"
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    return get_remote_address(request)


# Crear limiter con función personalizada para obtener IP
limiter = Limiter(key_func=get_client_ip)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Handler personalizado para errores de rate limit.
    Devuelve JSON en lugar de texto plano.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Demasiadas solicitudes. Por favor, espere antes de intentar de nuevo.",
            "retry_after": exc.detail
        }
    )


# Límites predefinidos
RATE_LIMITS = {
    # Autenticación - más restrictivo
    "login": "5/minute",
    "register": "3/minute",
    
    # Operaciones de escritura
    "create": "30/minute",
    "update": "60/minute",
    "delete": "20/minute",
    
    # Operaciones de lectura
    "read": "120/minute",
    
    # APIs externas (para no exceder límites de terceros)
    "external_api": "10/minute",
    
    # Backup/Restore (operaciones pesadas)
    "backup": "5/minute",
    
    # Default
    "default": "60/minute"
}

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import json
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.redis_client import redis_client
from app.services.dashboard_service import dashboard_service
from app.schemas.dashboard import DashboardStats

router = APIRouter()
logger = logging.getLogger(__name__)

# Cache TTL en segundos (5 minutos para datos offline, no cachear online)
CACHE_TTL = 300


@router.get("/{portfolio_id}/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    portfolio_id: str,
    year: Optional[int] = Query(None, description="Year to analyze"),
    online: bool = Query(False, description="Whether to include real-time quotes"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics for a specific portfolio.
    Including performance history, monthly values, and asset allocation.
    
    Los resultados se cachean en Redis por 5 minutos (solo modo offline).
    """
    if year is None:
        year = datetime.now().year
    
    user_id = current_user["user_id"]
    
    # Generar clave de cache
    cache_key = f"dashboard:{user_id}:{portfolio_id}:{year}"
    
    # Intentar obtener de cache (solo si no es online/tiempo real)
    if not online:
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                logger.debug(f"Cache hit for dashboard: {cache_key}")
                return DashboardStats.model_validate_json(cached)
        except Exception as e:
            logger.warning(f"Error reading dashboard cache: {e}")
        
    try:
        stats = await dashboard_service.get_stats(portfolio_id, year, user_id, db, online=online)
        
        # Guardar en cache solo si es modo offline
        if not online:
            try:
                await redis_client.set(cache_key, stats.model_dump_json(), expire=CACHE_TTL)
                logger.debug(f"Cached dashboard stats: {cache_key}")
            except Exception as e:
                logger.warning(f"Error caching dashboard stats: {e}")
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Error interno al calcular estadísticas del dashboard")

"""
API de Monitoreo del Sistema
"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services.market_data_service import market_data_service
from app.services.scheduler_service import scheduler_service

router = APIRouter()

@router.get("/market-data", tags=["Monitor"])
async def get_market_data_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estado del servicio de datos de mercado (Real-time)
    """
    return market_data_service.get_status()

@router.get("/scheduler", tags=["Monitor"])
async def get_scheduler_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estado del programador de tareas
    """
    return {
        "running": scheduler_service.scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None
            }
            for job in scheduler_service.scheduler.get_jobs()
        ]
    }

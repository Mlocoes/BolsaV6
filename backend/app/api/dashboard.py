from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.services.dashboard_service import dashboard_service
from app.schemas.dashboard import DashboardStats

router = APIRouter()

@router.get("/{portfolio_id}/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    portfolio_id: str,
    year: Optional[int] = Query(None, description="Year to analyze"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics for a specific portfolio.
    Including performance history, monthly values, and asset allocation.
    """
    if year is None:
        year = datetime.now().year
        
    try:
        stats = await dashboard_service.get_stats(portfolio_id, year, db)
        return stats
    except Exception as e:
        print(f"Error calculating dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

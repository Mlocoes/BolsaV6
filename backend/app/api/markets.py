from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.market import Market
from app.schemas.market import MarketCreate, MarketUpdate, MarketResponse

router = APIRouter()


@router.get("/", response_model=List[MarketResponse])
async def get_markets(db: AsyncSession = Depends(get_db)):
    """Obtener todos los mercados registrados"""
    result = await db.execute(select(Market).order_by(Market.name))
    return result.scalars().all()


@router.post("/", response_model=MarketResponse, status_code=status.HTTP_201_CREATED)
async def create_market(market_in: MarketCreate, db: AsyncSession = Depends(get_db)):
    """Añadir un nuevo mercado"""
    # Verificar si ya existe
    existing = await db.execute(select(Market).where(Market.name == market_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"El mercado '{market_in.name}' ya existe"
        )
    
    db_market = Market(**market_in.model_dump())
    db.add(db_market)
    await db.commit()
    await db.refresh(db_market)
    return db_market


@router.patch("/{market_id}", response_model=MarketResponse)
async def update_market(
    market_id: UUID, 
    market_in: MarketUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Actualizar datos de un mercado"""
    result = await db.execute(select(Market).where(Market.id == market_id))
    db_market = result.scalar_one_or_none()
    
    if not db_market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    
    update_data = market_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_market, key, value)
    
    await db.commit()
    await db.refresh(db_market)
    return db_market


@router.delete("/{market_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_market(market_id: UUID, db: AsyncSession = Depends(get_db)):
    """Eliminar un mercado"""
    result = await db.execute(select(Market).where(Market.id == market_id))
    db_market = result.scalar_one_or_none()
    
    if not db_market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    
    await db.delete(db_market)
    await db.commit()
    return None

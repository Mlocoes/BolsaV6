"""
Dependencias reutilizables de FastAPI
"""
from typing import Type, TypeVar, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import DeclarativeBase

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio

T = TypeVar('T', bound=DeclarativeBase)


async def get_or_404(
    db: AsyncSession,
    model: Type[T],
    entity_id: str,
    detail: str = "Recurso no encontrado"
) -> T:
    """
    Obtener una entidad por ID o lanzar 404.
    
    Args:
        db: Sesión de base de datos
        model: Clase del modelo SQLAlchemy
        entity_id: ID de la entidad (string UUID)
        detail: Mensaje de error personalizado
        
    Returns:
        La entidad encontrada
        
    Raises:
        HTTPException 400: Si el ID no es un UUID válido
        HTTPException 404: Si la entidad no existe
    """
    # Validar UUID
    try:
        uuid_id = UUID(entity_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    result = await db.execute(select(model).where(model.id == uuid_id))
    entity = result.scalar_one_or_none()
    
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )
    
    return entity


async def get_user_portfolio(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Portfolio:
    """
    Obtener una cartera verificando que pertenece al usuario actual.
    
    Args:
        portfolio_id: ID de la cartera
        current_user: Usuario actual (inyectado)
        db: Sesión de base de datos (inyectada)
        
    Returns:
        La cartera si pertenece al usuario
        
    Raises:
        HTTPException 400: Si el ID no es un UUID válido
        HTTPException 404: Si la cartera no existe o no pertenece al usuario
    """
    # Validar UUID
    try:
        uuid_id = UUID(portfolio_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de cartera inválido"
        )
    
    user_id = current_user["user_id"]
    
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == uuid_id,
            Portfolio.user_id == user_id
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    return portfolio


class PortfolioDependency:
    """
    Factory para crear dependencia de cartera con parámetro personalizado.
    
    Uso:
        @router.get("/{portfolio_id}/transactions")
        async def get_transactions(
            portfolio: Portfolio = Depends(PortfolioDependency("portfolio_id"))
        ):
    """
    def __init__(self, param_name: str = "portfolio_id"):
        self.param_name = param_name
    
    async def __call__(
        self,
        portfolio_id: str,
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> Portfolio:
        return await get_user_portfolio(portfolio_id, current_user, db)

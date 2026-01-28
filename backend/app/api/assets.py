"""
API de Activos
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter()


@router.get("/", response_model=List[AssetResponse])
async def list_assets(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Máximo de registros a devolver"),
    search: Optional[str] = Query(None, description="Buscar por símbolo o nombre"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Listar todos los activos con paginación.
    
    - **skip**: Número de registros a saltar (para paginación)
    - **limit**: Máximo de registros a devolver (1-1000)
    - **search**: Filtrar por símbolo o nombre (opcional)
    """
    query = select(Asset)
    
    # Filtro de búsqueda
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Asset.symbol.ilike(search_pattern)) | 
            (Asset.name.ilike(search_pattern))
        )
    
    query = query.order_by(Asset.symbol).offset(skip).limit(limit)
    result = await db.execute(query)
    assets = result.scalars().all()
    return [AssetResponse.model_validate(asset) for asset in assets]


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear nuevo activo"""
    # Verificar si symbol ya existe
    result = await db.execute(
        select(Asset).where(Asset.symbol == asset_data.symbol.upper())
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symbol ya existe"
        )
    
    # Crear activo
    new_asset = Asset(
        symbol=asset_data.symbol.upper(),
        name=asset_data.name,
        asset_type=asset_data.asset_type,
        currency=asset_data.currency,
        market=asset_data.market
    )
    
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    
    return AssetResponse.model_validate(new_asset)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener activo por ID"""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    return AssetResponse.model_validate(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    asset_data: AssetUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar activo"""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    # Actualizar campos
    if asset_data.symbol is not None:
        new_symbol = asset_data.symbol.upper()
        if new_symbol != asset.symbol:
            # Verificar duplicados
            existing = await db.execute(
                select(Asset).where(Asset.symbol == new_symbol)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Symbol ya existe"
                )
            asset.symbol = new_symbol

    if asset_data.name is not None:
        asset.name = asset_data.name
    if asset_data.asset_type is not None:
        asset.asset_type = asset_data.asset_type
    if asset_data.currency is not None:
        asset.currency = asset_data.currency
    if asset_data.market is not None:
        asset.market = asset_data.market
    if asset_data.sync_enabled is not None:
        asset.sync_enabled = asset_data.sync_enabled
    
    await db.commit()
    await db.refresh(asset)
    
    return AssetResponse.model_validate(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar activo"""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    await db.delete(asset)
    await db.commit()

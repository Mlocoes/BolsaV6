"""
API de Activos
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter()


# Schemas específicos para gestión de activos
class SyncUpdateRequest(BaseModel):
    sync_enabled: bool

class BulkSyncRequest(BaseModel):
    asset_ids: List[str]
    sync_enabled: bool


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


# ==================== NUEVOS ENDPOINTS PARA GESTIÓN DE ACTIVOS ====================

@router.patch("/{asset_id}/sync")
async def update_asset_sync(
    asset_id: str,
    request: SyncUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar estado de sincronización de un activo específico.
    
    Permite activar o desactivar la sincronización automática de cotizaciones
    para un activo individual.
    """
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    asset.sync_enabled = request.sync_enabled
    await db.commit()
    await db.refresh(asset)
    
    return {
        "success": True,
        "asset": AssetResponse.model_validate(asset)
    }


@router.post("/bulk-sync")
async def bulk_update_sync(
    request: BulkSyncRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar estado de sincronización para múltiples activos.
    
    Permite activar o desactivar la sincronización de varios activos
    simultáneamente. Útil para operaciones masivas de gestión.
    """
    if not request.asset_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lista de asset_ids no puede estar vacía"
        )
    
    # Obtener todos los activos
    result = await db.execute(
        select(Asset).where(Asset.id.in_(request.asset_ids))
    )
    assets = result.scalars().all()
    
    if not assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron activos con los IDs proporcionados"
        )
    
    # Actualizar sync_enabled
    updated_assets = []
    for asset in assets:
        asset.sync_enabled = request.sync_enabled
        updated_assets.append(asset)
    
    await db.commit()
    
    # Refrescar todos los activos
    for asset in updated_assets:
        await db.refresh(asset)
    
    return {
        "success": True,
        "updated_count": len(updated_assets),
        "assets": [AssetResponse.model_validate(a) for a in updated_assets]
    }


@router.get("/management/list")
async def get_assets_for_management(
    status_filter: Optional[str] = Query(None, description="Filtrar por estado: no_data, incomplete_data, outdated, complete, inactive"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener lista completa de activos con información de cobertura para gestión.
    
    Incluye estadísticas de sincronización y estado de cotizaciones para cada activo.
    Permite filtrar por estado específico.
    """
    # Importar la función de coverage
    from app.api.quotes import _check_asset_needs_import
    
    # Obtener todos los activos
    query = select(Asset).order_by(Asset.symbol)
    result = await db.execute(query)
    assets = result.scalars().all()
    
    # Preparar estadísticas
    stats = {
        "no_data": 0,
        "incomplete_data": 0,
        "outdated": 0,
        "complete": 0,
        "inactive": 0
    }
    
    assets_data = []
    
    for asset in assets:
        # Obtener información de cobertura
        check = await _check_asset_needs_import(str(asset.id), db)
        
        asset_info = {
            "id": str(asset.id),
            "symbol": asset.symbol,
            "name": asset.name,
            "asset_type": asset.asset_type.value if asset.asset_type else None,
            "currency": asset.currency,
            "market": asset.market,
            "sync_enabled": asset.sync_enabled,
            "created_at": asset.created_at.isoformat() if asset.created_at else None,
            "updated_at": asset.updated_at.isoformat() if asset.updated_at else None,
            "coverage": check["coverage"]
        }
        
        # Actualizar estadísticas
        stats[check["reason"]] += 1
        if not asset.sync_enabled:
            stats["inactive"] += 1
        
        # Aplicar filtro si existe
        if status_filter:
            if status_filter == "inactive" and not asset.sync_enabled:
                assets_data.append(asset_info)
            elif status_filter == check["reason"]:
                assets_data.append(asset_info)
        else:
            assets_data.append(asset_info)
    
    return {
        "assets": assets_data,
        "stats": stats,
        "total": len(assets)
    }

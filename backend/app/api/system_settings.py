from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.system_setting import SystemSetting
from app.schemas.system_setting import SystemSetting as SystemSettingSchema, SystemSettingUpdate
from app.models.user import User
from app.services.scheduler_service import scheduler_service

# Importación perezosa para evitar importación circular
def get_admin_dependency():
    from app.core.security import get_current_admin_user
    return get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[SystemSettingSchema])
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_dependency())
):
    """Obtener todas las configuraciones del sistema (Solo Admin)"""
    result = await db.execute(select(SystemSetting))
    return result.scalars().all()

@router.get("/{key}", response_model=SystemSettingSchema)
async def get_system_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_dependency())
):
    """Obtener una configuración específica por su clave"""
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return setting

@router.put("/{key}", response_model=SystemSettingSchema)
async def update_system_setting(
    key: str,
    setting_update: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_dependency())
):
    """Actualizar una configuración del sistema (Solo Admin)"""
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    setting.value = setting_update.value
    await db.commit()
    await db.refresh(setting)
    
    # Si se actualiza algo relacionado con el scheduler, podriamos notificar al scheduler_service
    if key.startswith("scheduler_"):
        await scheduler_service.reload_jobs()
        
    return setting

@router.post("/sync-quotes", status_code=status.HTTP_202_ACCEPTED)
async def trigger_manual_sync(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin_dependency())
):
    """
    Dispara manualmente el proceso de sincronización diaria de cotizaciones (Cierre).
    Se ejecuta en segundo plano.
    """
    background_tasks.add_task(scheduler_service.sync_all_quotes)
    return {"message": "Sincronización iniciada en segundo plano"}

# Comentario explicativo: Endpoints para gestionar las configuraciones globales del sistema, protegidos para administradores.

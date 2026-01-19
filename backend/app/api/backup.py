"""
API de Backup y Restore
"""
import os
import json
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.services.backup_service import backup_service
from typing import List

router = APIRouter()

# ==========================================
# FULL BACKUP
# ==========================================

@router.get("/full", response_class=FileResponse)
async def get_full_backup(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_admin_user)
):
    """Descargar backup completo de la base de datos (Solo Admin)"""
    
    try:
        # Crear archivo temporal
        fd, path = tempfile.mkstemp(suffix=".dump")
        os.close(fd)
        
        await backup_service.backup_full(path)
        
        # Programar borrado del archivo después de enviar
        background_tasks.add_task(os.unlink, path)
        
        return FileResponse(
            path, 
            filename="bolsav6_full_backup.dump",
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/full/restore")
async def restore_full_backup(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin_user)
):
    """Restaurar backup completo de la base de datos (Solo Admin)"""
    try:
        # Guardar archivo subido
        fd, path = tempfile.mkstemp(suffix=".dump")
        os.close(fd)
        
        with open(path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        await backup_service.restore_full(path)
        
        os.unlink(path)
        return {"message": "Base de datos restaurada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# QUOTES BACKUP
# ==========================================

@router.get("/quotes", response_class=FileResponse)
async def get_quotes_backup(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_admin_user)
):
    """Descargar backup de cotizaciones (Solo Admin)"""
    try:
        fd, path = tempfile.mkstemp(suffix=".dump")
        os.close(fd)
        
        await backup_service.backup_quotes(path)
        
        background_tasks.add_task(os.unlink, path)
        
        return FileResponse(
            path, 
            filename="bolsav6_quotes_backup.dump",
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quotes/restore")
async def restore_quotes_backup(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin_user)
):
    """Restaurar backup de cotizaciones (Solo Admin)"""
    try:
        fd, path = tempfile.mkstemp(suffix=".dump")
        os.close(fd)
        
        with open(path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        await backup_service.restore_quotes(path)
        
        os.unlink(path)
        return {"message": "Cotizaciones restauradas exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# TRANSACTIONS BACKUP
# ==========================================

@router.get("/transactions/{portfolio_id}")
async def get_transactions_backup(
    portfolio_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Descargar backup de transacciones de una cartera (JSON)"""
    try:
        json_str = await backup_service.backup_transactions(db, portfolio_id)
        
        # Crear archivo temporal para enviar
        fd, path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        
        with open(path, "w") as f:
            f.write(json_str)
            
        background_tasks.add_task(os.unlink, path)

        return FileResponse(
            path,
            filename=f"transactions_{portfolio_id}.json",
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions/{portfolio_id}/restore")
async def restore_transactions_backup(
    portfolio_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Restaurar transacciones de una cartera desde JSON"""
    try:
        content = await file.read()
        data = json.loads(content)
        
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="El archivo debe contener una lista de transacciones")
            
        await backup_service.restore_transactions(db, portfolio_id, data)
        
        return {"message": "Transacciones restauradas exitosamente"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Archivo JSON inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

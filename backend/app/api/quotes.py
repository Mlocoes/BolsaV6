"""
API de Cotizaciones
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import datetime, date, timezone, timedelta
from app.models.transaction import Transaction
from decimal import Decimal
from pydantic import BaseModel
import pandas as pd
import io
import traceback
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.quote import Quote
from app.schemas.quote import QuoteResponse, QuoteResponseWithAsset
# from app.services.finnhub_service import finnhub_service
from app.services.yfinance_service import yfinance_service
from app.services.alpha_vantage_service import alpha_vantage_service
from app.core.utils import clean_decimal
from sqlalchemy import func
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# Modelo para el body de bulk import
class BulkImportRequest(BaseModel):
    asset_ids: Optional[List[str]] = None
    force_refresh: bool = False


@router.get("/", response_model=List[QuoteResponseWithAsset])
async def get_all_quotes(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 2000,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener cotizaciones de todos los activos, ordenadas por fecha descendente.
    Incluye información del activo asociado.
    """
    query = select(Quote).options(joinedload(Quote.asset)).order_by(Quote.date.desc())
    
    if start_date:
        query = query.where(Quote.date >= start_date)
    if end_date:
        query = query.where(Quote.date <= end_date)
    
    query = query.limit(limit)
    
    # Log query execution for debugging performance
    import time
    start_time = time.time()
    result = await db.execute(query)
    quotes = result.scalars().all()
    duration = time.time() - start_time
    print(f"⚡ get_all_quotes query took {duration:.4f}s for {len(quotes)} rows")
    
    return [QuoteResponseWithAsset.model_validate(q) for q in quotes]


@router.get("/asset/{asset_id}", response_model=List[QuoteResponseWithAsset])
async def get_asset_quotes(
    asset_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 2000,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener cotizaciones de un activo"""
    # Verificar que el activo existe
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    if not asset_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    # Construir query con joinedload para info del activo
    query = select(Quote).options(joinedload(Quote.asset)).where(Quote.asset_id == asset_id)
    
    if start_date:
        query = query.where(Quote.date >= start_date)
    if end_date:
        query = query.where(Quote.date <= end_date)
    
    query = query.order_by(Quote.date.desc()).limit(limit)
    
    result = await db.execute(query)
    quotes = result.scalars().all()
    
    return [QuoteResponseWithAsset.model_validate(q) for q in quotes]


@router.post("/asset/{asset_id}/fetch-history", status_code=status.HTTP_202_ACCEPTED)
async def fetch_historical_quotes(
    asset_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener historial completo de cotizaciones desde Alpha Vantage
    
    Proceso en background para no bloquear
    """
    # Verificar que el activo existe
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    # Agregar tarea en background
    background_tasks.add_task(
        _fetch_and_save_quotes,
        asset_id=asset_id,
        symbol=asset.symbol,
        full_history=True
    )
    
    return {
        "message": f"Importación de historial iniciada para {asset.symbol}",
        "asset_id": asset_id
    }


@router.post("/asset/{asset_id}/fetch-latest", status_code=status.HTTP_202_ACCEPTED)
async def fetch_latest_quote(
    asset_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener última cotización desde Alpha Vantage
    """
    # Verificar que el activo existe
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    # Agregar tarea en background
    background_tasks.add_task(
        _fetch_and_save_quotes,
        asset_id=asset_id,
        symbol=asset.symbol,
        full_history=False
    )
    
    return {
        "message": f"Actualización iniciada para {asset.symbol}",
        "asset_id": asset_id
    }


@router.post("/sync-all", status_code=status.HTTP_202_ACCEPTED)
async def sync_all_quotes_manual(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """
    Sincronizar cotizaciones de todos los activos manualmente
    """
    from app.services.scheduler_service import scheduler_service
    
    # Ejecutar como tarea en background
    background_tasks.add_task(scheduler_service.sync_all_quotes)
    
    return {
        "message": "Sincronización de todos los activos iniciada en segundo plano"
    }


@router.post("/import/excel/{asset_id}", status_code=status.HTTP_200_OK)
async def import_quotes_from_excel(
    asset_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Importar cotizaciones históricas desde archivo Excel/CSV.
    
    Formato esperado:
    Fecha	Último	Apertura	Máximo	Mínimo	Vol.	% var.
    """
    # Verificar que el activo existe
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    # Validar extensión del archivo
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un Excel (.xlsx, .xls) o CSV (.csv)"
        )
    
    try:
        # Leer el contenido del archivo
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            # Detectar separador si es CSV (comúnmente ; o , en español)
            # Intentamos con punto y coma primero que es común en Excel español
            try:
                df = pd.read_csv(io.BytesIO(contents), sep=';')
                if len(df.columns) <= 1:
                    df = pd.read_csv(io.BytesIO(contents), sep=',')
            except:
                df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Mapeo de columnas (normalización)
        column_mapping = {
            'Fecha': 'date',
            'Último': 'close',
            'Apertura': 'open',
            'Máximo': 'high',
            'Mínimo': 'low',
            'Vol.': 'volume',
            '% var.': 'percent_change'
        }
        
        # Verificar columnas mínimas requeridas
        required = ['Fecha', 'Último']
        missing = [col for col in required if col not in df.columns]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Faltan columnas requeridas: {', '.join(missing)}"
            )
        
        # Renombrar columnas existentes
        df = df.rename(columns={c: column_mapping[c] for c in df.columns if c in column_mapping})
        
        quotes_created = 0
        quotes_skipped = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # 1. Procesar Fecha
                raw_date = row['date']
                if pd.isna(raw_date):
                    continue
                
                if isinstance(raw_date, str):
                    try:
                        # Formato común DD/MM/YYYY
                        quote_date = datetime.strptime(raw_date, '%d/%m/%Y')
                    except ValueError:
                        quote_date = pd.to_datetime(raw_date)
                else:
                    quote_date = pd.to_datetime(raw_date)
                
                # Normalizar a medianoche UTC
                quote_date = datetime.combine(quote_date.date(), datetime.min.time(), tzinfo=timezone.utc)
                

                close_val = clean_decimal(row.get('close', 0))
                open_val = clean_decimal(row.get('open', close_val))
                high_val = clean_decimal(row.get('high', close_val))
                low_val = clean_decimal(row.get('low', close_val))
                
                # 3. Procesar Volumen (manejar M, K)
                def parse_volume(val):
                    if pd.isna(val) or val == '': return 0
                    if isinstance(val, (int, float)): return int(val)
                    s = str(val).upper().replace(',', '.').strip()
                    multiplier = 1
                    if 'M' in s:
                        multiplier = 1000000
                        s = s.replace('M', '')
                    elif 'K' in s:
                        multiplier = 1000
                        s = s.replace('K', '')
                    
                    try:
                        return int(float(s) * multiplier)
                    except:
                        return 0

                volume_val = parse_volume(row.get('volume', 0))
                
                # 4. Verificar duplicados
                existing = await db.execute(
                    select(Quote).where(
                        and_(
                            Quote.asset_id == asset_id,
                            Quote.date == quote_date
                        )
                    )
                )
                
                if existing.scalar_one_or_none():
                    quotes_skipped += 1
                    continue
                
                # 5. Crear cotización
                new_quote = Quote(
                    asset_id=asset_id,
                    date=quote_date,
                    open=open_val,
                    high=high_val,
                    low=low_val,
                    close=close_val,
                    volume=volume_val,
                    source="manual_import"
                )
                db.add(new_quote)
                quotes_created += 1
                
            except Exception as e:
                errors.append(f"Fila {index + 2}: {str(e)}")
                quotes_skipped += 1
        
        await db.commit()
        
        return {
            "success": True,
            "quotes_created": quotes_created,
            "quotes_skipped": quotes_skipped,
            "errors": errors if errors else None,
            "message": f"✅ Importación completada: {quotes_created} nuevas cotizaciones para {asset.symbol}. {quotes_skipped} omitidas."
        }
        
    except Exception as e:
        await db.rollback()
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el archivo: {str(e)}"
        )


async def _fetch_and_save_quotes(asset_id: str, symbol: str, full_history: bool = False):
    """
    Función helper para obtener y guardar cotizaciones
    
    - Si full_history=True: Usa Polygon.io para obtener hasta 500 días de histórico
    - Si full_history=False: Usa Yahoo Finance para obtener cotización actual
    
    Ejecutada en background
    """
    import logging
    from app.core.database import AsyncSessionLocal
    
    logger = logging.getLogger(__name__)
    logger.info(f"🔄 Iniciando fetch de cotizaciones para {symbol} (full_history={full_history})")
    
    # Decidir qué servicio usar
    if full_history:
        # Usar Polygon.io para histórico (hasta 500 días sin límite diario)
        logger.info(f"📊 Usando Polygon.io para histórico de {symbol} (hasta 500 días)")
        from app.services.polygon_service import polygon_service
        quotes_data = await polygon_service.get_historical_quotes(symbol)
    else:
        # Usar Yahoo Finance para cotización actual (últimos 5 días para asegurar datos recientes)
        logger.info(f"📊 Usando Yahoo Finance para cotización actual de {symbol}")
        # Usamos el servicio importado globalmente o lo importamos aquí si es necesario
        from app.services.yfinance_service import yfinance_service
        quotes_data = await yfinance_service.get_historical_quotes(symbol, period="5d")
    
    if not quotes_data:
        logger.warning(f"⚠️ No se obtuvieron datos de Yahoo Finance para {symbol}")
        return
    
    logger.info(f"📊 Se obtuvieron {len(quotes_data)} cotizaciones para {symbol}")
    
    async with AsyncSessionLocal() as db:
        try:
            for quote_data in quotes_data:
                # Verificar si ya existe (comparar solo fecha, no timestamp completo)
                from datetime import date as date_type
                quote_date = quote_data["date"]
                if isinstance(quote_date, datetime):
                    # Normalizar a medianoche para comparación
                    quote_date = datetime.combine(quote_date.date(), datetime.min.time())
                
                existing = await db.execute(
                    select(Quote).where(
                        and_(
                            Quote.asset_id == asset_id,
                            Quote.date == quote_date
                        )
                    )
                )
                
                if existing.scalar_one_or_none():
                    logger.debug(f"⏭️ Cotización ya existe para {symbol} en {quote_date.date()}, saltando...")
                    continue  # Ya existe, skip
                
                # Crear nueva cotización con fecha normalizada
                # Determinar source según el servicio usado
                source = "polygon" if full_history else "yahoo"
                
                new_quote = Quote(
                    asset_id=asset_id,
                    date=quote_date,
                    open=quote_data["open"],
                    high=quote_data["high"],
                    low=quote_data["low"],
                    close=quote_data["close"],
                    volume=quote_data["volume"],
                    source=source
                )
                
                db.add(new_quote)
            
            await db.commit()
            logger.info(f"✅ Cotizaciones guardadas exitosamente para {symbol}")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Error guardando cotizaciones para {symbol}: {str(e)}")
            raise e


async def _get_asset_quote_coverage(asset_id: str, db: AsyncSession) -> dict:
    """
    Obtener información detallada sobre la cobertura de cotizaciones de un activo
    identificando huecos reales basados en las transacciones del usuario.
    """
    from app.models.asset import Asset, AssetType
    from app.models.transaction import Transaction
    from datetime import date, timedelta, timezone, datetime
    
    # 1. Obtener detalles del activo
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    if not asset:
        return {"has_quotes": False, "is_complete": False}

    # 2. Determinar la fecha de inicio necesaria (primera TRX - 7 días, o 1 año)
    tx_result = await db.execute(
        select(func.min(Transaction.transaction_date)).where(Transaction.asset_id == asset_id)
    )
    first_tx_date = tx_result.scalar()
    
    today = date.today()
    if first_tx_date:
        required_start = first_tx_date.date() - timedelta(days=7)
    else:
        required_start = today - timedelta(days=365)
    
    # 3. Obtener todas las cotizaciones existentes en ese rango
    quotes_result = await db.execute(
        select(Quote.date).where(
            and_(
                Quote.asset_id == asset_id,
                Quote.date >= datetime.combine(required_start, datetime.min.time()).replace(tzinfo=timezone.utc)
            )
        ).order_by(Quote.date.asc())
    )
    existing_dates = {row[0].date() for row in quotes_result.all()}
    
    # 4. Detectar huecos
    missing_days = []
    curr = required_start
    is_crypto = (asset.asset_type == AssetType.CRYPTO)
    
    while curr < today:
        # Si es Crypto, 24/7. Si no, solo L-V.
        if is_crypto or curr.weekday() < 5:
            if curr not in existing_dates:
                missing_days.append(curr)
        curr += timedelta(days=1)
    
    # 5. Calcular métricas finales
    total_quotes = len(existing_dates)
    first_date = min(existing_dates) if existing_dates else None
    last_date = max(existing_dates) if existing_dates else None
    days_since_last_update = (today - last_date).days if last_date else None
    
    # Calcular porcentaje de cobertura sobre días esperados
    expected_count = total_quotes + len(missing_days)
    coverage_ratio = total_quotes / expected_count if expected_count > 0 else 0
    
    # Un activo está completo si:
    # 1. Tiene más del 95% de los días esperados (permite festivos aislados)
    # 2. No tiene huecos grandes (bloques de >5 días seguidos faltantes)
    # 3. El último dato es reciente (< 5 días para permitir fines de semana largos)
    
    max_consecutive_missing = 0
    if missing_days:
        consecutive = 1
        for i in range(1, len(missing_days)):
            if (missing_days[i] - missing_days[i-1]).days <= 3: # Permitir fin de semana en medio
                consecutive += 1
            else:
                max_consecutive_missing = max(max_consecutive_missing, consecutive)
                consecutive = 1
        max_consecutive_missing = max(max_consecutive_missing, consecutive)

    has_large_gaps = max_consecutive_missing > 5
    is_up_to_date = days_since_last_update < 5 if days_since_last_update is not None else False
    
    # Si es Crypto, somos más estrictos con el ratio porque cotiza 24/7
    min_ratio = 0.99 if is_crypto else 0.94
    is_complete = coverage_ratio >= min_ratio and not has_large_gaps and is_up_to_date
    
    return {
        "has_quotes": total_quotes > 0,
        "total_quotes": total_quotes,
        "first_date": first_date,
        "last_date": last_date,
        "days_since_last_update": days_since_last_update,
        "required_start_date": required_start,
        "missing_days_count": len(missing_days),
        "coverage_ratio": round(coverage_ratio, 4),
        "has_gaps": has_large_gaps or coverage_ratio < min_ratio,
        "is_complete": is_complete,
        "needs_update": days_since_last_update > 7 if days_since_last_update is not None else True
    }


async def _check_asset_needs_import(asset_id: str, db: AsyncSession) -> dict:
    """
    Verificar si un activo necesita importación de histórico
    
    Retorna:
        - needs_import: bool
        - reason: str ("no_data", "incomplete_data", "outdated", "complete")
        - coverage: dict (información de cobertura)
    """
    coverage = await _get_asset_quote_coverage(asset_id, db)
    
    if not coverage["has_quotes"]:
        return {
            "needs_import": True,
            "reason": "no_data",
            "message": "Sin cotizaciones",
            "coverage": coverage
        }
    
    if not coverage["is_complete"]:
        return {
            "needs_import": True,
            "reason": "incomplete_data",
            "message": f"Datos parciales ({coverage['total_quotes']} cotizaciones)",
            "coverage": coverage
        }
    
    if coverage["needs_update"]:
        return {
            "needs_import": True,
            "reason": "outdated",
            "message": f"Desactualizado ({coverage['days_since_last_update']} días)",
            "coverage": coverage
        }
    
    return {
        "needs_import": False,
        "reason": "complete",
        "message": f"Completo ({coverage['total_quotes']} cotizaciones)",
        "coverage": coverage
    }


@router.get("/asset/{asset_id}/coverage")
async def get_asset_coverage(
    asset_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener información de cobertura de cotizaciones para un activo específico
    """
    # Verificar que el activo existe
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado"
        )
    
    check = await _check_asset_needs_import(asset_id, db)
    
    return {
        "asset_id": asset_id,
        "symbol": asset.symbol,
        "name": asset.name,
        **check
    }


@router.get("/assets/coverage")
async def get_all_assets_coverage(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener información de cobertura de cotizaciones para todos los activos
    """
    # Obtener todos los activos
    result = await db.execute(select(Asset).order_by(Asset.symbol))
    assets = result.scalars().all()
    
    coverage_list = []
    stats = {
        "total_assets": len(assets),
        "no_data": 0,
        "incomplete_data": 0,
        "outdated": 0,
        "complete": 0
    }
    
    for asset in assets:
        check = await _check_asset_needs_import(str(asset.id), db)
        
        coverage_list.append({
            "asset_id": str(asset.id),
            "symbol": asset.symbol,
            "name": asset.name,
            "needs_import": check["needs_import"],
            "reason": check["reason"],
            "message": check["message"],
            "coverage": check["coverage"]
        })
        
        # Actualizar estadísticas
        stats[check["reason"]] += 1
    
    return {
        "assets": coverage_list,
        "stats": stats
    }


@router.post("/import/bulk-historical", status_code=status.HTTP_202_ACCEPTED)
async def import_bulk_historical(
    request: BulkImportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Importar histórico de cotizaciones de forma masiva
    
    Parámetros:
        - asset_ids: Lista opcional de IDs de activos (si no se especifica, procesa todos)
        - force_refresh: Si es True, reimporta incluso si ya tiene datos completos
    
    El proceso verifica la cobertura de cada activo y solo importa los que necesitan datos.
    Solo procesa activos con sync_enabled=True.
    Usa Polygon.io (hasta 500 días) como prioridad, con fallback a yfinance.
    """
    # Obtener activos a procesar (solo los que tienen sync_enabled=True)
    if request.asset_ids:
        result = await db.execute(
            select(Asset).where(Asset.id.in_(request.asset_ids))
        )
    else:
        # Requerimiento: Mirar TODOS los activos catastrados en la BD
        result = await db.execute(
            select(Asset).order_by(Asset.symbol)
        )
    
    assets = result.scalars().all()
    
    if not assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron activos para procesar"
        )
    
    # Agregar tarea en background
    background_tasks.add_task(
        _bulk_import_historical,
        assets=[{"id": str(a.id), "symbol": a.symbol, "asset_type": a.asset_type} for a in assets],
        force_refresh=request.force_refresh
    )
    
    return {
        "message": f"Importación masiva iniciada para {len(assets)} activos",
        "total_assets": len(assets),
        "force_refresh": request.force_refresh
    }


async def _bulk_import_historical(assets: List[dict], force_refresh: bool = False):
    """
    Función helper para importación masiva en background con REPARACIÓN DE LAGUNAS.
    
    Para cada activo:
    1. Determina el rango de fechas necesario (desde la primera transacción o hace 2 años).
    2. Identifica días hábiles faltantes (lagunas).
    3. Descarga y rellena solo lo necesario.
    """
    import asyncio
    from datetime import datetime, date, timezone, timedelta
    from app.core.database import AsyncSessionLocal
    from app.services.polygon_service import polygon_service
    from app.services.yfinance_service import yfinance_service
    from app.models.transaction import Transaction
    from sqlalchemy import func
    
    logger.info(f"🚀 Iniciando importación y REPARACIÓN de {len(assets)} activos")
    
    async with AsyncSessionLocal() as db:
        processed = 0
        repaired_assets = 0
        total_quotes_saved = 0
        errors = []
        
        for asset_data in assets:
            asset_id = asset_data["id"]
            symbol = asset_data["symbol"]
            
            try:
                # 1. Determinar rango de reparación
                # Usar la lógica de cobertura centralizada para ser consistentes
                coverage = await _get_asset_quote_coverage(asset_id, db)
                start_date = coverage["required_start_date"]
                
                logger.info(f"🔎 Analizando {symbol} desde {start_date} hasta hoy (Reparación)")
                
                # 2. Obtener cotizaciones existentes para detectar lagunas
                existing_result = await db.execute(
                    select(Quote.date).where(
                        and_(Quote.asset_id == asset_id, Quote.date >= datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc))
                    )
                )
                existing_dates = {r[0].date() for r in existing_result.all()}
                
                # 3. Identificar días faltantes
                missing_days = []
                curr = start_date
                today = date.today()
                asset_type = asset_data.get("asset_type")
                
                # Importar AssetType para comparación si no está
                from app.models.asset import AssetType
                
                while curr < today:
                    # Si es Crypto, incluimos fines de semana. Si no, solo L-V.
                    is_crypto = (asset_type == AssetType.CRYPTO)
                    if is_crypto or curr.weekday() < 5:
                        if curr not in existing_dates:
                            missing_days.append(curr)
                    curr += timedelta(days=1)
                
                if not missing_days and not force_refresh:
                    logger.info(f"✅ {symbol} no tiene lagunas detectadas. Saltando.")
                    processed += 1
                    continue
                
                logger.info(f"📥 {symbol} tiene {len(missing_days)} lagunas. Intentando descarga...")
                
                # 4. Descarga de datos MULTI-FUENTE
                # Intento 1: Polygon.io (Más fiable para históricos específicos)
                quotes_data = await polygon_service.get_historical_quotes(
                    symbol, 
                    start_date=start_date,
                    end_date=today
                )
                
                # Intento 2: Fallback a Yahoo Finance
                if not quotes_data:
                    logger.info(f"⚠️ Polygon falló para {symbol}, intentando Yahoo Finance...")
                    quotes_data = await yfinance_service.get_historical_quotes(
                        symbol, 
                        start_date=start_date,
                        end_date=today
                    )
                
                if not quotes_data:
                    logger.warning(f"❌ Sin datos disponibles en ningún feed para {symbol}")
                    errors.append(f"{symbol}: Sin datos en Feeds")
                    processed += 1
                    continue
                
                # 5. Guardar lo que falte
                saved_count = 0
                for quote_data in quotes_data:
                    q_date = quote_data["date"]
                    # Normalizar a fecha pura para comparación
                    q_date_only = q_date.date() if isinstance(q_date, datetime) else q_date
                    
                    if q_date_only not in existing_dates or force_refresh:
                        # Asegurar datetime completo para la base de datos en UTC
                        db_date = datetime.combine(q_date_only, datetime.min.time()).replace(tzinfo=timezone.utc)
                        
                        new_quote = Quote(
                            asset_id=asset_id,
                            date=db_date,
                            open=quote_data["open"],
                            high=quote_data["high"],
                            low=quote_data["low"],
                            close=quote_data["close"],
                            volume=quote_data.get("volume", 0),
                            source="historical_repair"
                        )
                        db.add(new_quote)
                        saved_count += 1
                        # Evitar duplicar en el mismo lote si el feed trae repetidos
                        existing_dates.add(q_date_only) 
                
                await db.commit()
                logger.info(f"✅ {symbol}: Reparado con {saved_count} nuevas cotizaciones")
                if saved_count > 0:
                    repaired_assets += 1
                    total_quotes_saved += saved_count
                processed += 1
                
                # Rate limiting suave para no bloquear el API
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ Error reparando {symbol}: {str(e)}")
                errors.append(f"{symbol}: {str(e)}")
                await db.rollback()
                processed += 1
        
        logger.info(f"""
        ═══════════════════════════════════════
        📊 REPARACIÓN HISTÓRICA COMPLETADA
        ═══════════════════════════════════════
        Activos procesados: {processed}
        Activos con lagunas reparadas: {repaired_assets}
        Total cotizaciones añadidas: {total_quotes_saved}
        Errores: {len(errors)}
        ═══════════════════════════════════════
        """)

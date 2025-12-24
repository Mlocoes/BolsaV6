"""
API de Cotizaciones
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import datetime, date, timezone
from decimal import Decimal
import pandas as pd
import io
import traceback
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.quote import Quote
from app.schemas.quote import QuoteResponse, QuoteResponseWithAsset
from app.services.finnhub_service import finnhub_service
from app.services.alpha_vantage_service import alpha_vantage_service
from sqlalchemy import func
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[QuoteResponseWithAsset])
async def get_all_quotes(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 500,
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
    
    result = await db.execute(query)
    quotes = result.scalars().all()
    
    return [QuoteResponseWithAsset.model_validate(q) for q in quotes]


@router.get("/asset/{asset_id}", response_model=List[QuoteResponseWithAsset])
async def get_asset_quotes(
    asset_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
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
    
    query = query.order_by(Quote.date.desc())
    
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
                
                # 2. Procesar Números (manejar formato español con coma)
                def clean_decimal(val):
                    if pd.isna(val) or val == '': return Decimal('0')
                    if isinstance(val, (int, float, Decimal)): return Decimal(str(val))
                    # Quitar símbolos y cambiar coma por punto
                    s = str(val).replace('.', '').replace(',', '.').replace('%', '').strip()
                    return Decimal(s) if s else Decimal('0')

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
    - Si full_history=False: Usa Finnhub para obtener solo cotización actual
    
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
        # Usar Finnhub para cotización actual
        logger.info(f"📊 Usando Finnhub para cotización actual de {symbol}")
        quotes_data = await finnhub_service.get_daily_quotes(symbol, full_history=False)
    
    if not quotes_data:
        logger.warning(f"⚠️ No se obtuvieron datos de Finnhub para {symbol}")
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
                source = "alpha_vantage" if full_history else "finnhub"
                
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
    Obtener información sobre la cobertura de cotizaciones de un activo
    
    Retorna:
        - has_quotes: bool - Si tiene al menos una cotización
        - total_quotes: int - Cantidad total de cotizaciones
        - first_date: date - Fecha de la primera cotización
        - last_date: date - Fecha de la última cotización
        - days_since_last_update: int - Días desde la última actualización
        - is_complete: bool - Si tiene ≥400 cotizaciones (considerado completo)
        - needs_update: bool - Si han pasado >7 días sin actualizar
    """
    result = await db.execute(
        select(
            func.count(Quote.id).label("total_quotes"),
            func.min(Quote.date).label("first_date"),
            func.max(Quote.date).label("last_date")
        ).where(Quote.asset_id == asset_id)
    )
    
    row = result.one()
    
    if row.total_quotes == 0:
        return {
            "has_quotes": False,
            "total_quotes": 0,
            "first_date": None,
            "last_date": None,
            "days_since_last_update": None,
            "is_complete": False,
            "needs_update": True
        }
    
    first_date = row.first_date.date() if row.first_date else None
    last_date = row.last_date.date() if row.last_date else None
    
    # Calcular días desde última actualización
    from datetime import date as date_type
    today = date_type.today()
    days_since_last_update = (today - last_date).days if last_date else None
    
    # Considerar completo si tiene ≥400 cotizaciones (aprox 1.5 años de días hábiles)
    is_complete = row.total_quotes >= 400
    
    # Necesita actualización si han pasado más de 7 días
    needs_update = days_since_last_update > 7 if days_since_last_update else False
    
    return {
        "has_quotes": True,
        "total_quotes": row.total_quotes,
        "first_date": first_date,
        "last_date": last_date,
        "days_since_last_update": days_since_last_update,
        "is_complete": is_complete,
        "needs_update": needs_update
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
        "incomplete": 0,
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
    asset_ids: Optional[List[str]] = None,
    force_refresh: bool = False,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Importar histórico de cotizaciones de forma masiva
    
    Parámetros:
        - asset_ids: Lista opcional de IDs de activos (si no se especifica, procesa todos)
        - force_refresh: Si es True, reimporta incluso si ya tiene datos completos
    
    El proceso verifica la cobertura de cada activo y solo importa los que necesitan datos.
    Usa Polygon.io (hasta 500 días) como prioridad, con fallback a yfinance.
    """
    # Obtener activos a procesar
    if asset_ids:
        result = await db.execute(
            select(Asset).where(Asset.id.in_(asset_ids))
        )
    else:
        result = await db.execute(select(Asset).order_by(Asset.symbol))
    
    assets = result.scalars().all()
    
    if not assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron activos para procesar"
        )
    
    # Agregar tarea en background
    background_tasks.add_task(
        _bulk_import_historical,
        assets=[{"id": str(a.id), "symbol": a.symbol} for a in assets],
        force_refresh=force_refresh
    )
    
    return {
        "message": f"Importación masiva iniciada para {len(assets)} activos",
        "total_assets": len(assets),
        "force_refresh": force_refresh
    }


async def _bulk_import_historical(assets: List[dict], force_refresh: bool = False):
    """
    Función helper para importación masiva en background
    
    Itera sobre cada activo, verifica si necesita importación y ejecuta el fetch.
    Implementa rate limiting para no sobrecargar las APIs externas.
    """
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.services.polygon_service import polygon_service
    from app.services.yfinance_service import yfinance_service
    
    logger.info(f"🚀 Iniciando importación masiva de {len(assets)} activos")
    
    async with AsyncSessionLocal() as db:
        processed = 0
        skipped = 0
        imported = 0
        errors = []
        
        for asset_data in assets:
            asset_id = asset_data["id"]
            symbol = asset_data["symbol"]
            
            try:
                # Verificar si necesita importación
                if not force_refresh:
                    check = await _check_asset_needs_import(asset_id, db)
                    
                    if not check["needs_import"]:
                        logger.info(f"⏩ Saltando {symbol}: {check['message']}")
                        skipped += 1
                        processed += 1
                        continue
                    
                    logger.info(f"📥 Importando {symbol}: {check['message']}")
                else:
                    logger.info(f"🔄 Forzando reimportación de {symbol}")
                
                # Intentar con Polygon.io primero (hasta 500 días)
                logger.info(f"📊 Usando Polygon.io para {symbol}")
                quotes_data = await polygon_service.get_historical_quotes(symbol)
                
                # Si Polygon falla, usar yfinance como fallback
                if not quotes_data:
                    logger.warning(f"⚠️ Polygon.io falló para {symbol}, intentando yfinance...")
                    quotes_data = await yfinance_service.get_historical_quotes(symbol, period="2y")
                
                if not quotes_data:
                    logger.warning(f"❌ No se pudieron obtener datos para {symbol}")
                    errors.append(f"{symbol}: Sin datos disponibles")
                    processed += 1
                    continue
                
                # Guardar cotizaciones
                saved_count = 0
                for quote_data in quotes_data:
                    quote_date = quote_data["date"]
                    if isinstance(quote_date, datetime):
                        quote_date = datetime.combine(quote_date.date(), datetime.min.time())
                    
                    # Verificar duplicados
                    existing = await db.execute(
                        select(Quote).where(
                            and_(
                                Quote.asset_id == asset_id,
                                Quote.date == quote_date
                            )
                        )
                    )
                    
                    if existing.scalar_one_or_none():
                        continue
                    
                    new_quote = Quote(
                        asset_id=asset_id,
                        date=quote_date,
                        open=quote_data["open"],
                        high=quote_data["high"],
                        low=quote_data["low"],
                        close=quote_data["close"],
                        volume=quote_data.get("volume", 0),
                        source="polygon"
                    )
                    db.add(new_quote)
                    saved_count += 1
                
                await db.commit()
                logger.info(f"✅ {symbol}: {saved_count} cotizaciones nuevas guardadas")
                imported += 1
                processed += 1
                
                # Rate limiting: esperar 12 segundos entre requests (5 req/min de Polygon)
                if processed < len(assets):
                    logger.debug(f"⏱️ Esperando 12s (rate limit)...")
                    await asyncio.sleep(12)
                
            except Exception as e:
                logger.error(f"❌ Error procesando {symbol}: {str(e)}")
                errors.append(f"{symbol}: {str(e)}")
                await db.rollback()
                processed += 1
        
        logger.info(f"""
        ═══════════════════════════════════════
        📊 IMPORTACIÓN MASIVA COMPLETADA
        ═══════════════════════════════════════
        Total procesados: {processed}
        Importados: {imported}
        Saltados: {skipped}
        Errores: {len(errors)}
        ═══════════════════════════════════════
        """)

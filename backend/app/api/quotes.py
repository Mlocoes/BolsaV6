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

router = APIRouter()


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

"""
API de Cotizaciones
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.quote import Quote
from app.schemas.quote import QuoteResponse
from app.services.finnhub_service import finnhub_service
from app.services.alpha_vantage_service import alpha_vantage_service

router = APIRouter()


@router.get("/asset/{asset_id}", response_model=List[QuoteResponse])
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
    
    # Construir query
    query = select(Quote).where(Quote.asset_id == asset_id)
    
    if start_date:
        query = query.where(Quote.date >= start_date)
    if end_date:
        query = query.where(Quote.date <= end_date)
    
    query = query.order_by(Quote.date.desc())
    
    result = await db.execute(query)
    quotes = result.scalars().all()
    
    return [QuoteResponse.model_validate(q) for q in quotes]


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


async def _fetch_and_save_quotes(asset_id: str, symbol: str, full_history: bool = False):
    """
    Función helper para obtener y guardar cotizaciones
    
    - Si full_history=True: Usa Alpha Vantage para obtener hasta 100 días de histórico
    - Si full_history=False: Usa Finnhub para obtener solo cotización actual
    
    Ejecutada en background
    """
    import logging
    from app.core.database import AsyncSessionLocal
    
    logger = logging.getLogger(__name__)
    logger.info(f"🔄 Iniciando fetch de cotizaciones para {symbol} (full_history={full_history})")
    
    # Decidir qué servicio usar
    if full_history:
        # Usar Alpha Vantage para histórico (últimos 100 días gratis)
        logger.info(f"📊 Usando Alpha Vantage para histórico de {symbol} (últimos 100 días)")
        quotes_data = await alpha_vantage_service.get_historical_quotes(symbol)
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

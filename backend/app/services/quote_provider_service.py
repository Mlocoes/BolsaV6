"""
Servicio unificado de Proveedor de Cotizaciones.
Centraliza la lógica de selección de fuente (Polygon, Yahoo Finance, etc.) y fallbacks.
"""
import logging
from typing import List, Dict, Optional
from datetime import date, datetime
import asyncio

from app.services.polygon_service import polygon_service
from app.services.yfinance_service import yfinance_service

logger = logging.getLogger(__name__)

class QuoteProviderService:
    """
    Servicio fachada para obtener cotizaciones.
    Decide qué proveedor usar basándose en disponibilidad y tipo de solicitud.
    """
    
    async def get_historical_quotes(
        self, 
        symbol: str, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        use_polygon: bool = True
    ) -> List[Dict]:
        """
        Obtiene cotizaciones históricas usando una estrategia de fallback:
        1. Polygon.io (Si use_polygon=True y disponible)
        2. Yahoo Finance (Standard/Fallback)
        """
        quotes_data = None
        
        # Intento 1: Polygon.io
        if use_polygon:
            try:
                logger.info(f"📊 Intentando Polygon.io para {symbol}...")
                quotes_data = await polygon_service.get_historical_quotes(
                    symbol, 
                    start_date=start_date,
                    end_date=end_date
                )
            except Exception as e:
                logger.warning(f"⚠️ Error en Polygon para {symbol}: {e}")
        
        # Intento 2: Yahoo Finance (Fallback)
        if not quotes_data:
            logger.info(f"📊 Intentando Yahoo Finance para {symbol} (Fallback)...")
            try:
                quotes_data = await yfinance_service.get_historical_quotes(
                    symbol, 
                    start_date=start_date,
                    end_date=end_date
                )
            except Exception as e:
                logger.error(f"❌ Error en Yahoo Finance para {symbol}: {e}")
                
        return quotes_data

    async def get_current_quote(self, symbol: str) -> Optional[Dict]:
        """
        Obtiene la cotización actual (tiempo real/delay)
        """
        # Para real-time, Yahoo Finance suele ser suficiente y gratuito
        return await yfinance_service.get_current_quote(symbol)

quote_provider_service = QuoteProviderService()

"""
Servicio para Finnhub API
"""
import finnhub
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import time
from app.core.config import settings

logger = logging.getLogger(__name__)


class FinnhubService:
    """Servicio para obtener cotizaciones de Finnhub"""
    
    def __init__(self):
        self.api_key = settings.FINNHUB_API_KEY
        self.client = finnhub.Client(api_key=self.api_key)
    
    async def get_daily_quotes(self, symbol: str, full_history: bool = False) -> Optional[List[Dict]]:
        """
        Obtener cotizaciones diarias
        
        Si full_history=True, intenta obtener hasta 100 días de histórico
        Si full_history=False, solo obtiene la cotización actual
        
        Args:
            symbol: Símbolo del activo
            full_history: Si True, obtiene histórico (hasta 100 días en plan free)
        
        Returns:
            Lista de cotizaciones
        """
        try:
            if full_history:
                # Intentar obtener histórico (hasta 100 días)
                logger.info(f"🔄 Obteniendo histórico de Finnhub para {symbol} (últimos 100 días)")
                
                from datetime import timedelta
                end_date = datetime.now()
                start_date = end_date - timedelta(days=100)
                
                # Convertir a timestamps UNIX
                start_ts = int(start_date.timestamp())
                end_ts = int(end_date.timestamp())
                
                try:
                    # Llamar a stock_candles para datos históricos
                    response = self.client.stock_candles(symbol, 'D', start_ts, end_ts)
                    
                    if not response or response.get('s') != 'ok':
                        logger.warning(f"⚠️ No hay datos históricos disponibles para {symbol} en Finnhub")
                        # Fallback a cotización actual
                        return await self._get_current_quote_only(symbol)
                    
                    # Procesar datos históricos
                    timestamps = response.get('t', [])
                    opens = response.get('o', [])
                    highs = response.get('h', [])
                    lows = response.get('l', [])
                    closes = response.get('c', [])
                    volumes = response.get('v', [])
                    
                    if not timestamps:
                        logger.warning(f"⚠️ No se recibieron datos históricos para {symbol}")
                        return await self._get_current_quote_only(symbol)
                    
                    # Convertir a lista de diccionarios
                    quotes = []
                    for i in range(len(timestamps)):
                        quote_date = datetime.fromtimestamp(timestamps[i])
                        # Normalizar a medianoche
                        quote_date = datetime.combine(quote_date.date(), datetime.min.time())
                        
                        quote = {
                            "date": quote_date,
                            "open": float(opens[i]),
                            "high": float(highs[i]),
                            "low": float(lows[i]),
                            "close": float(closes[i]),
                            "volume": int(volumes[i]) if volumes[i] > 0 else 0
                        }
                        quotes.append(quote)
                    
                    logger.info(f"✅ {len(quotes)} cotizaciones históricas obtenidas para {symbol}")
                    return quotes
                    
                except Exception as e:
                    logger.error(f"❌ Error en stock_candles para {symbol}: {str(e)}")
                    logger.info(f"⚙️ Fallback a cotización actual para {symbol}")
                    return await self._get_current_quote_only(symbol)
            else:
                # Solo cotización actual
                return await self._get_current_quote_only(symbol)
                
        except Exception as e:
            logger.error(f"❌ Error en get_daily_quotes para {symbol}: {str(e)}")
            return None
    
    async def _get_current_quote_only(self, symbol: str) -> Optional[List[Dict]]:
        """
        Obtener solo la cotización actual (usado como fallback)
        """
        try:
            logger.info(f"🔄 Obteniendo cotización actual de Finnhub para {symbol}")
            
            response = self.client.quote(symbol)
            
            if not response or response.get('c') is None:
                logger.warning(f"⚠️ No hay datos de cotización para {symbol}")
                return None
            
            # Crear una única entrada con la cotización actual
            # Usar solo la fecha (sin hora) para evitar duplicados
            from datetime import date
            current_date = datetime.combine(date.today(), datetime.min.time())
            quote = {
                "date": current_date,
                "open": float(response.get('o', response['c'])),
                "high": float(response.get('h', response['c'])),
                "low": float(response.get('l', response['c'])),
                "close": float(response['c']),
                "volume": 0
            }
            
            logger.info(f"✅ Cotización actual obtenida para {symbol}: ${quote['close']}")
            return [quote]
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo cotización actual para {symbol}: {str(e)}")
            return None
    
    async def get_quote(self, symbol: str) -> Optional[Dict]:
        """
        Obtener cotización en tiempo real
        
        Args:
            symbol: Símbolo del activo
        
        Returns:
            Diccionario con datos de cotización actual
        """
        try:
            response = self.client.quote(symbol)
            
            if not response or response.get('c') is None:
                logger.warning(f"⚠️ No hay datos de cotización actual para {symbol}")
                return None
            
            return {
                "current": float(response['c']),
                "high": float(response['h']),
                "low": float(response['l']),
                "open": float(response['o']),
                "previous_close": float(response['pc']),
                "timestamp": datetime.fromtimestamp(response['t'])
            }
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo cotización actual de {symbol}: {str(e)}")
            return None


# Instancia global del servicio
finnhub_service = FinnhubService()

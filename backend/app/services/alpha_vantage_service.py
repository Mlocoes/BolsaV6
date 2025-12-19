"""
Servicio para obtener datos históricos usando Alpha Vantage
Plan gratuito: 100 días de histórico con outputsize='compact'
"""
import logging
from datetime import datetime, date
from typing import List, Dict, Optional
from alpha_vantage.timeseries import TimeSeries
import pandas as pd
from decimal import Decimal
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitException(Exception):
    """Excepción para cuando se alcanza el límite de la API"""
    pass


class AlphaVantageService:
    """Servicio para obtener cotizaciones históricas de Alpha Vantage"""
    
    def __init__(self):
        try:
            self.ts = TimeSeries(
                key=settings.ALPHA_VANTAGE_API_KEY,
                output_format='pandas'
            )
            logger.info("✅ Alpha Vantage service initialized")
        except Exception as e:
            logger.error(f"❌ Error inicializando Alpha Vantage: {str(e)}")
            self.ts = None
    
    async def get_historical_quotes(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Optional[List[Dict]]:
        """
        Obtener cotizaciones históricas de Alpha Vantage
        
        Plan gratuito: Últimos 100 días con outputsize='compact'
        
        Args:
            symbol: Símbolo del activo (ej: TSLA, AAPL)
            start_date: Fecha de inicio (opcional, para filtrar)
            end_date: Fecha de fin (opcional, para filtrar)
        
        Returns:
            Lista de diccionarios con datos OHLCV
        """
        if not self.ts:
            logger.error("❌ Alpha Vantage no está inicializado")
            return None
        
        try:
            logger.info(f"🔄 Obteniendo histórico de Alpha Vantage para {symbol}")
            logger.info(f"📅 Plan FREE: Últimos 100 días disponibles")
            
            # Obtener datos históricos (últimos 100 días con plan gratuito)
            try:
                df, meta_data = self.ts.get_daily(
                    symbol=symbol.upper(),
                    outputsize='compact'  # 'compact' = últimos 100 días (gratis)
                )
            except Exception as api_error:
                error_msg = str(api_error).lower()
                if 'api call frequency' in error_msg or 'limit' in error_msg:
                    logger.warning(f"⚠️ Límite de API alcanzado para {symbol}")
                    raise RateLimitException("Límite de API alcanzado")
                elif 'invalid api call' in error_msg or 'not found' in error_msg:
                    logger.warning(f"⚠️ Símbolo {symbol} no encontrado en Alpha Vantage")
                    return None
                else:
                    raise api_error
            
            if df is None or df.empty:
                logger.warning(f"⚠️ No se recibieron datos de Alpha Vantage para {symbol}")
                return None
            
            logger.info(f"📊 Datos recibidos: {len(df)} registros de Alpha Vantage")
            
            # Filtrar por rango de fechas si se especifica
            if start_date or end_date:
                df.index = pd.to_datetime(df.index)
                
                if start_date and end_date:
                    mask = (df.index.date >= start_date) & (df.index.date <= end_date)
                elif start_date:
                    mask = df.index.date >= start_date
                else:
                    mask = df.index.date <= end_date
                
                df = df.loc[mask]
                logger.info(f"📊 Después de filtrar fechas: {len(df)} registros")
            
            if df.empty:
                logger.warning(f"⚠️ No hay datos en el rango de fechas para {symbol}")
                return None
            
            # Convertir DataFrame a lista de diccionarios
            quotes = []
            for idx, row in df.iterrows():
                quote_date = idx.date() if hasattr(idx, 'date') else idx
                # Normalizar a medianoche
                quote_datetime = datetime.combine(quote_date, datetime.min.time())
                
                # Verificar que tenemos precio de cierre
                close_price = row.get('4. close')
                if pd.isna(close_price):
                    continue
                
                quote = {
                    "date": quote_datetime,
                    "open": float(row.get('1. open', close_price)),
                    "high": float(row.get('2. high', close_price)),
                    "low": float(row.get('3. low', close_price)),
                    "close": float(close_price),
                    "volume": int(row.get('5. volume', 0)) if not pd.isna(row.get('5. volume')) else 0
                }
                quotes.append(quote)
            
            logger.info(f"✅ {len(quotes)} cotizaciones procesadas para {symbol} desde Alpha Vantage")
            return quotes
            
        except RateLimitException:
            # Propagar la excepción de límite para que ser manejada por el llamador
            raise

        except Exception as e:
            logger.error(f"❌ Error obteniendo cotización actual de {symbol}: {str(e)}")
            return None
    
    async def search_symbols(self, keywords: str) -> List[Dict]:
        """
        Buscar símbolos usando Alpha Vantage Symbol Search
        """
        if not self.ts: return []
        try:
            # La librería alpha_vantage no siempre expone search directamente en TimeSeries, 
            # pero podemos usar una llamada custom si es necesario o ver si está disponible.
            # Nota: la librería 'alpha_vantage' tiene un módulo 'Custom' para esto.
            from alpha_vantage.custom_api import CustomAPI
            custom = CustomAPI(key=settings.ALPHA_VANTAGE_API_KEY)
            data, _ = custom.get_custom_api(function="SYMBOL_SEARCH", keywords=keywords)
            
            # Alpha Vantage devuelve 'bestMatches'
            matches = data.get('bestMatches', [])
            results = []
            for m in matches:
                results.append({
                    "symbol": m.get('1. symbol'),
                    "name": m.get('2. name'),
                    "type": m.get('3. type'),
                    "region": m.get('4. region'),
                    "marketOpen": m.get('5. marketOpen'),
                    "marketClose": m.get('6. marketClose'),
                    "timezone": m.get('7. timezone'),
                    "currency": m.get('8. currency'),
                    "matchScore": float(m.get('9. matchScore', 0))
                })
            return results
        except Exception as e:
            logger.error(f"❌ Error en búsqueda Alpha Vantage: {str(e)}")
            return []

    async def get_company_profile(self, symbol: str) -> Optional[Dict]:
        """
        Obtener perfil detallado de la compañía desde Alpha Vantage (OVERVIEW)
        """
        if not self.ts: return None
        try:
            from alpha_vantage.custom_api import CustomAPI
            custom = CustomAPI(key=settings.ALPHA_VANTAGE_API_KEY)
            data, _ = custom.get_custom_api(function="OVERVIEW", symbol=symbol.upper())
            
            if not data or "Symbol" not in data:
                return None
            
            return {
                "name": data.get('Name'),
                "currency": data.get('Currency'),
                "market": f"{data.get('Exchange')} ({data.get('Country')})",
                "asset_type": data.get('AssetType')
            }
        except Exception as e:
            logger.error(f"❌ Error en OVERVIEW Alpha Vantage para {symbol}: {str(e)}")
            return None


# Instancia global
alpha_vantage_service = AlphaVantageService()

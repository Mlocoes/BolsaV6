"""
Servicio para obtener datos históricos usando Polygon.io
Plan gratuito: Hasta 500-730 días de histórico, sin límite diario de requests
Rate limit: 5 requests/minuto
"""
import logging
import requests
import time
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
from decimal import Decimal
from app.core.config import settings

logger = logging.getLogger(__name__)


class PolygonService:
    """Servicio para obtener cotizaciones históricas de Polygon.io"""
    
    def __init__(self):
        self.api_key = settings.POLYGON_API_KEY
        self.base_url = "https://api.polygon.io"
        self.last_request_time = 0
        self.min_request_interval = 12  # 12 segundos entre requests (5/min rate limit)
        logger.info("✅ Polygon.io service initialized")
    
    def _rate_limit(self):
        """Implementar rate limiting de 5 requests/minuto"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            logger.debug(f"⏳ Rate limit: esperando {sleep_time:.1f}s")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _convert_ticker_for_polygon(self, symbol: str) -> str:
        """
        Convertir ticker de Yahoo Finance a formato Polygon.io
        
        Ejemplos:
        - ^GSPC → SPY (S&P 500 via ETF)
        - BTC-USD → X:BTCUSD (crypto)
        - EURUSD=X → C:EURUSD (forex)
        """
        symbol_upper = symbol.upper()
        
        # Índices → ETFs equivalentes
        index_to_etf = {
            "^GSPC": "SPY",      # S&P 500
            "^DJI": "DIA",       # Dow Jones
            "^IXIC": "QQQ",      # Nasdaq
            "^RUT": "IWM",       # Russell 2000
        }
        
        if symbol_upper in index_to_etf:
            converted = index_to_etf[symbol_upper]
            logger.info(f"🔄 Conversión índice: {symbol} → {converted}")
            return converted
        
        # Crypto: BTC-USD → X:BTCUSD
        if "-USD" in symbol_upper:
            base = symbol_upper.replace("-USD", "")
            converted = f"X:{base}USD"
            logger.info(f"🔄 Conversión crypto: {symbol} → {converted}")
            return converted
        
        # Forex: EURUSD=X → C:EURUSD
        if "=" in symbol_upper:
            base = symbol_upper.replace("=X", "").replace("=", "")
            converted = f"C:{base}"
            logger.info(f"🔄 Conversión forex: {symbol} → {converted}")
            return converted
        
        # Acciones con sufijo: AAPL.MC → AAPL
        if "." in symbol_upper:
            base = symbol_upper.split(".")[0]
            logger.info(f"🔄 Limpiando sufijo: {symbol} → {base}")
            return base
        
        return symbol_upper
    
    async def get_historical_quotes(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Optional[List[Dict]]:
        """
        Obtener cotizaciones históricas de Polygon.io
        
        Plan gratuito: Hasta 2 años de histórico (500-730 días)
        
        Args:
            symbol: Símbolo del activo (ej: TSLA, AAPL, BTC-USD)
            start_date: Fecha de inicio (opcional)
            end_date: Fecha de fin (opcional)
        
        Returns:
            Lista de diccionarios con datos OHLCV
        """
        try:
            # Convertir símbolo al formato Polygon
            polygon_symbol = self._convert_ticker_for_polygon(symbol)
            
            # Configurar fechas por defecto (últimos 500 días)
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=500)
            
            logger.info(f"🔄 Obteniendo histórico de Polygon.io para {symbol}")
            logger.info(f"📅 Rango: {start_date} → {end_date}")
            
            # Aplicar rate limiting
            self._rate_limit()
            
            # Construir URL de la API
            url = f"{self.base_url}/v2/aggs/ticker/{polygon_symbol}/range/1/day/{start_date}/{end_date}"
            params = {
                "apiKey": self.api_key,
                "adjusted": "true",
                "sort": "asc"
            }
            
            # Hacer request
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 429:
                logger.warning(f"⚠️ Rate limit alcanzado para {symbol}")
                return None
            
            if response.status_code != 200:
                logger.warning(f"⚠️ Error HTTP {response.status_code} para {symbol}")
                return None
            
            data = response.json()
            
            # Debug: mostrar el status
            status = data.get("status")
            logger.info(f"📋 Response status: {status}")
            logger.info(f"📋 Response keys: {list(data.keys())}")
            
            if status != "OK" and status != "DELAYED":
                logger.warning(f"⚠️ Status no OK: {status} para {symbol}")
                logger.warning(f"📋 Response completo: {data}")
                return None
            
            # Aceptar tanto OK como DELAYED (delayed data is still valid)
            results = data.get("results", [])
            
            if not results:
                logger.warning(f"⚠️ No hay datos disponibles para {symbol}")
                return None
            
            # Convertir resultados al formato esperado
            quotes = []
            for item in results:
                try:
                    # Convertir timestamp de milisegundos a datetime
                    timestamp_ms = item.get("t", 0)
                    quote_date = datetime.fromtimestamp(timestamp_ms / 1000)
                    quote_date = datetime.combine(quote_date.date(), datetime.min.time())
                    
                    quote = {
                        "date": quote_date,
                        "open": float(item.get("o", 0)),
                        "high": float(item.get("h", 0)),
                        "low": float(item.get("l", 0)),
                        "close": float(item.get("c", 0)),
                        "volume": int(item.get("v", 0))
                    }
                    quotes.append(quote)
                except Exception as e:
                    logger.warning(f"⚠️ Error procesando registro: {e}")
                    continue
            
            logger.info(f"✅ {len(quotes)} cotizaciones obtenidas para {symbol} desde Polygon.io")
            logger.info(f"📊 Rango obtenido: {quotes[0]['date'].date()} → {quotes[-1]['date'].date()}")
            
            return quotes
            
        except requests.RequestException as e:
            logger.error(f"❌ Error de red con Polygon.io para {symbol}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Error obteniendo histórico de {symbol}: {str(e)}")
            return None
    
    async def get_latest_quote(self, symbol: str) -> Optional[Dict]:
        """
        Obtener la última cotización disponible de un activo
        """
        quotes = await self.get_historical_quotes(
            symbol=symbol,
            start_date=date.today() - timedelta(days=7),
            end_date=date.today()
        )
        
        if not quotes:
            return None
        
        # Retornar la más reciente
        return quotes[-1]
    
    async def search_symbols(self, query: str) -> Optional[List[Dict]]:
        """
        Buscar símbolos en Polygon.io
        """
        try:
            self._rate_limit()
            
            url = f"{self.base_url}/v3/reference/tickers"
            params = {
                "apiKey": self.api_key,
                "search": query,
                "active": "true",
                "limit": 10
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                logger.warning(f"⚠️ Error buscando símbolos: {response.status_code}")
                return None
            
            data = response.json()
            results = data.get("results", [])
            
            # Formatear resultados
            symbols = []
            for item in results:
                symbols.append({
                    "symbol": item.get("ticker", ""),
                    "name": item.get("name", ""),
                    "market": item.get("primary_exchange", ""),
                    "currency": item.get("currency_name", "USD"),
                    "type": item.get("type", "")
                })
            
            return symbols
            
        except Exception as e:
            logger.error(f"❌ Error buscando símbolos: {str(e)}")
            return None


# Instancia global
polygon_service = PolygonService()

"""
Servicio para obtener datos históricos usando yfinance (Yahoo Finance)
yfinance es completamente gratuito y sin límites de llamadas
"""
import yfinance as yf
import pandas as pd
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

# Executor para operaciones síncronas de yfinance
executor = ThreadPoolExecutor(max_workers=4)


class YFinanceService:
    """Servicio para obtener cotizaciones históricas de Yahoo Finance"""
    
    def __init__(self):
        self.cache = {}  # Cache para precios actuales: {symbol: (price_dict, timestamp)}
        self.cache_ttl = 60  # 1 minuto de caché para evitar saturar la API
        logger.info("✅ YFinance service initialized")
    
    def _download_historical_sync(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        period: str = "3mo"
    ) -> Optional[List[Dict]]:
        """
        Descarga síncrona de datos históricos (ejecutada en thread pool)
        """
        try:
            logger.info(f"🔄 Obteniendo histórico de yfinance para {symbol}")
            
            # Crear ticker con timeout
            ticker = yf.Ticker(symbol)
            
            # Descargar datos históricos
            if start_date and end_date:
                logger.info(f"📅 Descargando desde {start_date} hasta {end_date}")
                df = ticker.history(
                    start=start_date,
                    end=end_date,
                    interval="1d",
                    timeout=10
                )
            else:
                logger.info(f"📅 Descargando período: {period}")
                df = ticker.history(
                    period=period,
                    interval="1d",
                    timeout=10
                )
            
            logger.info(f"📊 DataFrame shape: {df.shape}, empty: {df.empty}")
            
            if df.empty:
                logger.warning(f"⚠️ No hay datos históricos para {symbol}")
                return None
            
            # Convertir DataFrame a lista de diccionarios
            quotes = []
            for index, row in df.iterrows():
                # index es un Timestamp de pandas, convertir a datetime
                quote_date = index.to_pydatetime()
                # Normalizar a medianoche
                quote_date = datetime.combine(quote_date.date(), datetime.min.time())
                
                quote = {
                    "date": quote_date,
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']) if row['Volume'] > 0 else 0
                }
                quotes.append(quote)
            
            logger.info(f"✅ {len(quotes)} cotizaciones obtenidas para {symbol} desde yfinance")
            return quotes
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo datos de yfinance para {symbol}: {str(e)}", exc_info=True)
            return None
    
    async def get_historical_quotes(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        period: str = "3mo"
    ) -> Optional[List[Dict]]:
        """
        Obtener cotizaciones históricas de Yahoo Finance (async wrapper)
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._download_historical_sync,
            symbol,
            start_date,
            end_date,
            period
        )
    
    async def get_current_quote(self, symbol: str) -> Optional[Dict]:
        """
        Obtener cotización actual usando yfinance con soporte de caché y fallback a Finnhub
        """
        # Verificar caché
        now = datetime.now()
        if symbol in self.cache:
            cached_data, timestamp = self.cache[symbol]
            if (now - timestamp).total_seconds() < self.cache_ttl:
                logger.debug(f"💎 Usando caché para {symbol}")
                return cached_data

        try:
            ticker = yf.Ticker(symbol)
            current_price = None
            
            # 1. Intentar obtener de fast_info (muy rápido)
            try:
                f_info = getattr(ticker, 'fast_info', None)
                if f_info is not None:
                    current_price = f_info.get('last_price')
            except:
                pass

            # 2. Intentar obtener de info (más lento, requiere scrap/api)
            if current_price is None:
                try:
                    info = ticker.info
                    if info:
                        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('price')
                except:
                    pass

            # 3. Fallback a Finnhub si Yahoo falla (Yahoo suele dar errores de tipos en este entorno)
            if current_price is None:
                try:
                    from app.services.finnhub_service import finnhub_service
                    logger.info(f"⚙️ Usando fallback a Finnhub para {symbol}")
                    f_quote = await finnhub_service.get_quote(symbol)
                    if f_quote:
                        quote = {
                            "date": now,
                            "open": f_quote.get('open', 0),
                            "high": f_quote.get('high', 0),
                            "low": f_quote.get('low', 0),
                            "close": f_quote.get('current', 0),
                            "volume": 0,
                            "source": "finnhub"
                        }
                        self.cache[symbol] = (quote, now)
                        return quote
                except Exception as fh_err:
                    logger.error(f"❌ Fallback Finnhub falló para {symbol}: {str(fh_err)}")

            # 4. Scrum/Scrape manual como último recurso (si yfinance falla por errores de tipos)
            if current_price is None:
                try:
                    import requests
                    import re
                    logger.info(f"🕵️ Intentando scraping manual para {symbol}")
                    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"
                    headers = {'User-Agent': 'Mozilla/5.0'}
                    # Usar loop.run_in_executor para no bloquear el loop de asyncio si usamos requests
                    loop = asyncio.get_event_loop()
                    def fetch_url():
                        return requests.get(url, headers=headers, timeout=5)
                    
                    response = await loop.run_in_executor(executor, fetch_url)
                    if response.status_code == 200:
                        data = response.json()
                        meta = data.get('chart', {}).get('result', [{}])[0].get('meta', {})
                        current_price = meta.get('regularMarketPrice')
                        if current_price:
                             quote = {
                                "date": now,
                                "open": float(meta.get('chartPreviousClose', current_price)),
                                "high": float(meta.get('regularMarketDayHigh', current_price)),
                                "low": float(meta.get('regularMarketDayLow', current_price)),
                                "close": float(current_price),
                                "volume": 0,
                                "source": "yahoo_scrape"
                            }
                             self.cache[symbol] = (quote, now)
                             return quote
                except Exception as scrape_err:
                    logger.error(f"❌ Scraping manual falló para {symbol}: {str(scrape_err)}")

            # 5. Último intento con yfinance history
            
            # Si llegamos aquí con un precio de los pasos 1 o 2
            if current_price is not None:
                try:
                    info = ticker.info or {}
                except:
                    info = {}
                quote = {
                    "date": now,
                    "open": float(current_price),
                    "high": float(info.get('dayHigh', current_price)),
                    "low": float(info.get('dayLow', current_price)),
                    "close": float(current_price),
                    "volume": int(info.get('volume', 0))
                }
                self.cache[symbol] = (quote, now)
                return quote
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error crítico obteniendo precio de {symbol}: {str(e)}")
            return None

    async def get_multiple_current_quotes(self, symbols: List[str]) -> Dict[str, Optional[Dict]]:
        """
        Obtener múltiples cotizaciones actuales de forma eficiente
        """
        now = datetime.now()
        results = {}
        to_fetch = []
        
        for symbol in symbols:
            if symbol in self.cache:
                cached_data, timestamp = self.cache[symbol]
                if (now - timestamp).total_seconds() < self.cache_ttl:
                    results[symbol] = cached_data
                    continue
            to_fetch.append(symbol)
        
        if not to_fetch:
            return results
            
        logger.info(f"🔄 Obteniendo precios en tiempo real para {len(to_fetch)} activos")
        
        # Yahoo Finance download es inestable en este entorno, usamos obtención concurrente con fallback
        # Esto es más robusto que un download() masivo que falla por completo si hay un error de tipos
        tasks = [self.get_current_quote(symbol) for symbol in to_fetch]
        batch_results = await asyncio.gather(*tasks)
        
        for i, symbol in enumerate(to_fetch):
            results[symbol] = batch_results[i]
                
        return results


# Instancia global
yfinance_service = YFinanceService()

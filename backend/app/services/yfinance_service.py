"""
Servicio para obtener datos históricos usando yfinance (Yahoo Finance)
yfinance es completamente gratuito y sin límites de llamadas
"""
import yfinance as yf
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
        
        Args:
            symbol: Símbolo del activo (ej: TSLA, AAPL, BTC-USD)
            start_date: Fecha de inicio (opcional)
            end_date: Fecha de fin (opcional)
            period: Período si no se especifican fechas (1mo, 3mo, 6mo, 1y, 3y, etc)
        
        Returns:
            Lista de diccionarios con datos OHLCV
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
        Obtener cotización actual usando yfinance
        
        Args:
            symbol: Símbolo del activo
        
        Returns:
            Diccionario con precio actual
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info or 'currentPrice' not in info:
                # Intentar obtener del histórico reciente
                df = ticker.history(period="1d", interval="1m")
                if df.empty:
                    return None
                
                last_row = df.iloc[-1]
                return {
                    "date": datetime.now(),
                    "open": float(last_row['Open']),
                    "high": float(last_row['High']),
                    "low": float(last_row['Low']),
                    "close": float(last_row['Close']),
                    "volume": int(last_row['Volume']) if last_row['Volume'] > 0 else 0
                }
            
            current_price = info['currentPrice']
            return {
                "date": datetime.now(),
                "open": current_price,
                "high": info.get('dayHigh', current_price),
                "low": info.get('dayLow', current_price),
                "close": current_price,
                "volume": info.get('volume', 0)
            }
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo precio actual de {symbol}: {str(e)}")
            return None


# Instancia global
yfinance_service = YFinanceService()

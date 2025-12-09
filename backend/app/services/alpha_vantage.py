"""
Servicio para Alpha Vantage API
"""
import httpx
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)


class AlphaVantageService:
    """Servicio para obtener cotizaciones de Alpha Vantage"""
    
    def __init__(self):
        self.api_key = settings.ALPHA_VANTAGE_API_KEY
        self.base_url = "https://www.alphavantage.co/query"
        self.timeout = 30.0
    
    async def get_daily_quotes(self, symbol: str, full_history: bool = False) -> Optional[List[Dict]]:
        """
        Obtener cotizaciones diarias
        
        Args:
            symbol: Símbolo del activo
            full_history: Si True, obtiene historial completo (20+ años)
                         Si False, obtiene últimos 100 días
        
        Returns:
            Lista de cotizaciones [{date, open, high, low, close, volume}]
        """
        try:
            output_size = "full" if full_history else "compact"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "TIME_SERIES_DAILY",
                        "symbol": symbol,
                        "outputsize": output_size,
                        "apikey": self.api_key
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Alpha Vantage API error: {response.status_code}")
                    return None
                
                data = response.json()
                
                # Verificar si hay error en la respuesta
                if "Error Message" in data:
                    logger.error(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                    return None
                
                if "Note" in data:
                    logger.warning(f"Alpha Vantage rate limit: {data['Note']}")
                    return None
                
                # Parsear datos
                time_series = data.get("Time Series (Daily)", {})
                
                quotes = []
                for date_str, values in time_series.items():
                    try:
                        quotes.append({
                            "date": datetime.strptime(date_str, "%Y-%m-%d"),
                            "open": float(values["1. open"]),
                            "high": float(values["2. high"]),
                            "low": float(values["3. low"]),
                            "close": float(values["4. close"]),
                            "volume": int(values["5. volume"])
                        })
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Error parsing quote for {symbol} on {date_str}: {e}")
                        continue
                
                return quotes
                
        except Exception as e:
            logger.error(f"Error fetching quotes for {symbol}: {e}")
            return None
    
    async def get_latest_quote(self, symbol: str) -> Optional[Dict]:
        """
        Obtener última cotización
        
        Args:
            symbol: Símbolo del activo
        
        Returns:
            Cotización más reciente
        """
        quotes = await self.get_daily_quotes(symbol, full_history=False)
        
        if not quotes:
            return None
        
        # Ordenar por fecha descendente y retornar la más reciente
        quotes.sort(key=lambda x: x["date"], reverse=True)
        return quotes[0] if quotes else None


# Instancia global del servicio
alpha_vantage_service = AlphaVantageService()

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

    async def get_asset_metadata(self, symbol: str, name_hint: Optional[str] = None, market_hint: Optional[str] = None) -> Dict[str, str]:
        """
        Obtener metadatos usando investigación multi-fuente inteligente.
        Cruza resultados de Yahoo, Alpha Vantage y Finnhub para encontrar el activo real.
        """
        from app.services.alpha_vantage_service import alpha_vantage_service
        from app.services.finnhub_service import finnhub_service

        search_query = f"{name_hint or ''} {symbol} {market_hint or ''}".strip()
        logger.info(f"🔎 Iniciando investigación para: '{search_query}'")

        best_ticker = symbol.upper()
        detected_name = name_hint or symbol
        detected_currency = "USD"
        detected_market = market_hint or "Unknown"

        try:
            loop = asyncio.get_event_loop()
            
            # 1. Búsqueda paralela inicial para encontrar tickers candidatos
            # Manejamos excepciones individualmente para que una API bloqueada no mate el proceso
            async def safe_yf_search():
                try: return await loop.run_in_executor(executor, lambda: yf.Search(search_query, max_results=8).quotes)
                except: return []

            async def safe_av_search():
                try: return await alpha_vantage_service.search_symbols(search_query)
                except: return []

            async def safe_fh_search():
                try: return await finnhub_service.search_symbols(search_query)
                except: return []

            results = await asyncio.gather(safe_yf_search(), safe_av_search(), safe_fh_search())
            yf_results, av_results, fh_results = results

            # 2. SISTEMA DE PUNTUACIÓN DE CANDIDATOS
            candidates = [] # List of {ticker, score, name, currency, market, source}

            # Procesar Yahoo
            for q in (yf_results or []):
                q_sym = str(q.get('symbol', '')).upper()
                q_exch = str(q.get('exchDisp', '')).upper()
                score = 0
                if symbol.upper() in q_sym: score += 10
                if market_hint:
                    mh = market_hint.upper()
                    if any(k in q_exch for k in ["MC", "MCE", "MADRID", "SPAIN", "CONTINUO"]): score += 30
                candidates.append({
                    "symbol": q_sym, "score": score, "name": q.get('longname') or q.get('shortname'),
                    "currency": None, "market": q_exch, "source": "Yahoo"
                })

            # Procesar Alpha Vantage
            for q in (av_results or []):
                q_sym = str(q.get('symbol', '')).upper()
                q_region = str(q.get('region', '')).upper()
                score = 0
                if symbol.upper() in q_sym: score += 10
                if market_hint:
                    mh = market_hint.upper()
                    if any(k in q_region for k in ["SPAIN", "MADRID", "XETRA", "GERMANY"]): score += 30
                candidates.append({
                    "symbol": q_sym, "score": score, "name": q.get('name'),
                    "currency": q.get('currency'), "market": q_region, "source": "AlphaVantage"
                })

            # Procesar Finnhub
            for q in (fh_results or []):
                q_sym = str(q.get('symbol', '')).upper()
                q_desc = str(q.get('description', '')).upper()
                score = 0
                if symbol.upper() in q_sym: score += 10
                if market_hint and (market_hint.upper() in q_desc or market_hint.upper() in q_sym): score += 20
                candidates.append({
                    "symbol": q_sym, "score": score, "name": q_desc,
                    "currency": None, "market": None, "source": "Finnhub"
                })

            # 3. SELECCIÓN Y REFINAMIENTO
            if candidates:
                # Ordenar por puntuación (desc) y longitud de símbolo (preferimos símbolos más específicos como DIA.MC sobre DIA si el score es alto)
                candidates.sort(key=lambda x: (x['score'], len(x['symbol'])), reverse=True)
                top = candidates[0]
                best_ticker = top["symbol"]
                detected_name = top["name"] or detected_name
                detected_currency = top["currency"] or detected_currency
                detected_market = top["market"] or detected_market

            # 4. EXTRACCIÓN DETALLADA (Agnóstica pero jerárquica)
            # Consultamos por el ticker ganador en las tres fuentes para asegurar la moneda
            async def get_details():
                dt_tasks = [
                    loop.run_in_executor(executor, lambda: yf.Ticker(best_ticker).info),
                    alpha_vantage_service.get_company_profile(best_ticker),
                    finnhub_service.get_company_profile(best_ticker)
                ]
                dt_res = await asyncio.gather(*dt_tasks, return_exceptions=True)
                return [r if not isinstance(r, Exception) else None for r in dt_res]

            details = await get_details()
            yf_info, av_info, fh_info = details

            # Consolidación final de metadatos (evitando el fallo general a USD)
            # Priorizamos datos explícitos de AV y Finnhub sobre Yahoo si este último devuelve datos genéricos
            info_sources = [av_info, fh_info, yf_info]
            for info in info_sources:
                if info and info.get('currency'):
                    # Si la moneda encontrada NO es USD, o si es USD pero la fuente es muy fiable para ese activo
                    curr = info.get('currency')
                    if curr != 'USD' or detected_currency == 'USD':
                        detected_currency = curr
                        detected_name = info.get('name') or info.get('longName') or detected_name
                        detected_market = info.get('market') or info.get('exchange') or detected_market
                        if curr != 'USD': break # Paramos si encontramos una moneda real no-USD

            # Normalización de símbolo para Yahoo (nuestra base para cotizaciones futuras)
            # Si detectamos que es España por el nombre o mercado pero el símbolo no tiene .MC, lo corregimos
            if not '.' in best_ticker:
                if any(k in str(detected_market).upper() for k in ["SPAIN", "MADRID", "MCE", "CONTINUO"]):
                    best_ticker = f"{best_ticker}.MC"

            logger.info(f"✅ Descubrimiento final: {best_ticker} ({detected_name}) - {detected_currency} @ {detected_market}")
            return {
                "name": detected_name,
                "currency": detected_currency,
                "market": detected_market,
                "symbol": best_ticker
            }

        except Exception as e:
            logger.error(f"❌ Error crítico en motor de descubrimiento: {str(e)}")
            return {"name": symbol.upper(), "currency": "USD", "market": "Unknown", "symbol": symbol.upper()}

        except Exception as e:
            logger.error(f"❌ Error en investigación multi-fuente: {str(e)}")
            return {"name": symbol.upper(), "currency": "USD", "market": "Unknown", "symbol": symbol.upper()}


    async def normalize_symbol_for_market(self, symbol: str, market_hint: Optional[str] = None) -> str:
        """
        Normaliza el símbolo para Yahoo Finance según el mercado.
        Ejemplo: DIA + CONTINUO → DIA.MC
        """
        # Si ya tiene sufijo, no modificar
        if '.' in symbol:
            return symbol.upper()
        
        symbol_upper = symbol.upper()
        
        if not market_hint:
            return symbol_upper
        
        market_upper = market_hint.upper()
        
        # Mapeo de mercados a sufijos de Yahoo Finance
        market_suffixes = {
            "CONTINUO": ".MC",      # España - Mercado Continuo
            "MCE": ".MC",           # España - Madrid
            "MADRID": ".MC",        # España
            "XETRA": ".DE",         # Alemania
            "FRANKFURT": ".F",      # Alemania - Frankfurt
            "PARIS": ".PA",         # Francia
            "MILAN": ".MI",         # Italia
            "AMSTERDAM": ".AS",     # Holanda
            "LSE": ".L",            # Reino Unido
            "LONDON": ".L",         # Reino Unido
            "SWX": ".SW",           # Suiza
            "TORONTO": ".TO",       # Canadá
        }
        
        for market_key, suffix in market_suffixes.items():
            if market_key in market_upper:
                normalized = f"{symbol_upper}{suffix}"
                logger.info(f"🔄 Símbolo normalizado: {symbol} → {normalized} (mercado: {market_hint})")
                return normalized
        
        # Si no coincide con ningún mercado conocido, asumir USA (sin sufijo)
        logger.info(f"ℹ️ Símbolo sin normalizar (mercado USA o desconocido): {symbol_upper}")
        return symbol_upper
    
    async def get_asset_info(self, symbol: str) -> Dict:
        """
        Obtiene información básica del activo de Yahoo Finance.
        Simplificado - solo Yahoo, sin otras fuentes.
        """
        try:
            logger.info(f"🔍 Obteniendo info de {symbol} desde Yahoo Finance")
            
            def _get_info():
                ticker = yf.Ticker(symbol)
                return ticker.info
            
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(executor, _get_info)
            
            if info:
                logger.info(f"✅ Info obtenida para {symbol}")
                return info
            
            logger.warning(f"⚠️ No se pudo obtener info para {symbol}")
            return {}
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo info de {symbol}: {str(e)}")
            return {}


# Instancia global
yfinance_service = YFinanceService()

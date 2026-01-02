"""
Servicio para conversión de monedas usando tasas de cambio de Yahoo Finance
"""
from datetime import date, timedelta
from collections import defaultdict
from typing import Dict, Optional, List, Tuple
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.asset import Asset, AssetType
from app.models.quote import Quote

logger = logging.getLogger(__name__)


class ForexService:
    """Servicio para obtener tasas de cambio y convertir valores entre monedas"""
    
    def __init__(self):
        # Caché para tasas de cambio (para evitar consultas repetidas)
        self._rate_cache: Dict[tuple, float] = {}
        
    async def get_exchange_rate(
        self, 
        from_currency: str, 
        to_currency: str, 
        target_date: date,
        db: AsyncSession
    ) -> float:
        """
        Obtiene la tasa de cambio entre dos monedas para una fecha específica.
        
        Args:
            from_currency: Moneda de origen (ej: "USD")
            to_currency: Moneda de destino (ej: "EUR")
            target_date: Fecha para la cual obtener la tasa
            db: Sesión de base de datos
            
        Returns:
            float: Tasa de cambio (1 from_currency = X to_currency)
        """
        # Si las monedas son iguales, retornar 1
        if from_currency == to_currency:
            return 1.0
            
        # Verificar caché
        cache_key = (from_currency, to_currency, target_date)
        if cache_key in self._rate_cache:
            return self._rate_cache[cache_key]
            
        # Construir símbolo del par forex (formato Yahoo Finance)
        forex_symbol = f"{from_currency}{to_currency}=X"
        
        # Buscar el activo de tipo CURRENCY
        asset_result = await db.execute(
            select(Asset).where(
                and_(
                    Asset.symbol == forex_symbol,
                    Asset.asset_type == AssetType.CURRENCY
                )
            )
        )
        forex_asset = asset_result.scalar_one_or_none()
        
        if not forex_asset:
            # Si no existe el par directo, intentar con el inverso
            inverse_symbol = f"{to_currency}{from_currency}=X"
            inverse_result = await db.execute(
                select(Asset).where(
                    and_(
                        Asset.symbol == inverse_symbol,
                        Asset.asset_type == AssetType.CURRENCY
                    )
                )
            )
            inverse_asset = inverse_result.scalar_one_or_none()
            
            if inverse_asset:
                # Usar tasa inversa
                rate = await self._get_rate_from_quotes(
                    inverse_asset.id, 
                    target_date, 
                    db
                )
                if rate and rate > 0:
                    rate = 1.0 / rate
                    self._rate_cache[cache_key] = rate
                    return rate
            
            logger.warning(f"No forex pair found for {from_currency} → {to_currency}")
            return 1.0  # Fallback: sin conversión
            
        # Obtener cotización del par forex
        rate = await self._get_rate_from_quotes(forex_asset.id, target_date, db)
        if rate:
            self._rate_cache[cache_key] = rate
            return rate
            
        return 1.0  # Fallback: sin conversión
        
    async def _get_rate_from_quotes(
        self, 
        asset_id: str, 
        target_date: date, 
        db: AsyncSession
    ) -> Optional[float]:
        """
        Obtiene la tasa de cambio desde las cotizaciones del activo.
        Si no hay cotización exacta, busca la más cercana hacia atrás (máximo 7 días).
        """
        # Intentar obtener cotización exacta
        quote_result = await db.execute(
            select(Quote).where(
                and_(
                    Quote.asset_id == asset_id,
                    Quote.date == target_date
                )
            )
        )
        quote = quote_result.scalar_one_or_none()
        
        if quote:
            return float(quote.close)
            
        # Si no hay cotización exacta, buscar la más reciente (hasta 7 días atrás)
        lookback_date = target_date - timedelta(days=7)
        
        fallback_result = await db.execute(
            select(Quote).where(
                and_(
                    Quote.asset_id == asset_id,
                    Quote.date >= lookback_date,
                    Quote.date <= target_date
                )
            ).order_by(Quote.date.desc()).limit(1)
        )
        fallback_quote = fallback_result.scalar_one_or_none()
        
        if fallback_quote:
            logger.info(
                f"Using fallback rate from {fallback_quote.date} for {target_date}"
            )
            return float(fallback_quote.close)
            
        logger.warning(f"No rate found for asset {asset_id} near {target_date}")
        return None

    def inject_live_rate(self, from_currency: str, to_currency: str, target_date: date, rate: float):
        """Inyecta una tasa de cambio en la caché manual"""
        self._rate_cache[(from_currency, to_currency, target_date)] = rate
        # Inyectar también la inversa
        if rate > 0:
            self._rate_cache[(to_currency, from_currency, target_date)] = 1.0 / rate
        
    async def convert_value(
        self,
        value: float,
        from_currency: str,
        to_currency: str,
        target_date: date,
        db: AsyncSession
    ) -> float:
        """
        Convierte un valor de una moneda a otra.
        
        Args:
            value: Valor a convertir
            from_currency: Moneda de origen
            to_currency: Moneda de destino
            target_date: Fecha para la tasa de cambio
            db: Sesión de base de datos
            
        Returns:
            float: Valor convertido
        """
        if value == 0:
            return 0.0
            
        rate = await self.get_exchange_rate(
            from_currency, 
            to_currency, 
            target_date, 
            db
        )
        
        return value * rate
        
    async def preload_rates(
        self, 
        pairs: List[Tuple[str, str]], 
        start_date: date, 
        end_date: date, 
        db: AsyncSession
    ):
        """
        Precarga tasas de cambio en caché para múltiples pares y un rango de fechas.
        """
        if not pairs:
            return
            
        symbols = [f"{f}{t}=X" for f, t in pairs]
        # También considerar los inversos por si acaso
        symbols += [f"{t}{f}=X" for f, t in pairs]
        
        # Buscar todos estos activos
        asset_result = await db.execute(
            select(Asset).where(
                and_(
                    Asset.symbol.in_(symbols),
                    Asset.asset_type == AssetType.CURRENCY
                )
            )
        )
        assets = {a.symbol: a for a in asset_result.scalars().all()}
        
        if not assets:
            return
            
        # Buscar todas las cotizaciones para estos activos en el rango
        lookback_start = start_date - timedelta(days=7)
        
        quotes_result = await db.execute(
            select(Quote).where(
                and_(
                    Quote.asset_id.in_([a.id for a in assets.values()]),
                    Quote.date >= lookback_start,
                    Quote.date <= end_date
                )
            ).order_by(Quote.date)
        )
        quotes = quotes_result.scalars().all()
        
        # Organizar por (asset_id, date)
        quotes_by_asset: Dict[str, Dict[date, float]] = defaultdict(dict)
        for q in quotes:
            quotes_by_asset[str(q.asset_id)][q.date.date()] = float(q.close)
            
        # Llenar la caché para el rango solicitado
        for from_curr, to_curr in pairs:
            symbol = f"{from_curr}{to_curr}=X"
            inv_symbol = f"{to_curr}{from_curr}=X"
            
            asset = assets.get(symbol)
            is_inverse = False
            if not asset:
                asset = assets.get(inv_symbol)
                is_inverse = True
                
            if not asset:
                continue
                
            asset_quotes = quotes_by_asset.get(str(asset.id), {})
            if not asset_quotes:
                continue
                
            curr_d = start_date
            available_dates = sorted(asset_quotes.keys())
            
            while curr_d <= end_date:
                rate = asset_quotes.get(curr_d)
                if rate is None:
                    # Buscar la más cercana anterior (dentro de los 7 días)
                    prev_dates = [d for d in available_dates if d < curr_d and d >= curr_d - timedelta(days=7)]
                    if prev_dates:
                        rate = asset_quotes[prev_dates[-1]]
                
                if rate:
                    actual_rate = 1.0 / rate if is_inverse else rate
                    self._rate_cache[(from_curr, to_curr, curr_d)] = actual_rate
                
                curr_d += timedelta(days=1)

    def clear_cache(self):
        """Limpia la caché de tasas de cambio"""
        self._rate_cache.clear()


# Singleton
forex_service = ForexService()

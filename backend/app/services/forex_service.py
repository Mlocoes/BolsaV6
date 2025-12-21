"""
Servicio para conversión de monedas usando tasas de cambio de Yahoo Finance
"""
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, timedelta
import logging

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
        
    def clear_cache(self):
        """Limpia la caché de tasas de cambio"""
        self._rate_cache.clear()


# Singleton
forex_service = ForexService()

import asyncio
import logging
import json
from datetime import datetime
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.redis_client import redis_client
from app.models.transaction import Transaction, TransactionType
from app.models.asset import Asset, AssetType
from app.services.yfinance_service import yfinance_service

logger = logging.getLogger(__name__)

class MarketDataService:
    """
    Servicio centralizado para la gestión de datos de mercado en tiempo real.
    Actúa como el 'dueño' de la tabla virtual de cotizaciones.
    """
    
    def __init__(self):
        self.is_running = False
        self.update_interval = 60  # Segundos entre actualizaciones
        self.last_update = None
        self.last_error = None
        self.tracked_symbols_count = 0

    async def start_background_service(self):
        """Inicia el bucle de actualización en segundo plano"""
        if self.is_running:
            return
            
        self.is_running = True
        logger.info("🚀 Iniciando Servicio de Datos de Mercado (Background)")
        
        while self.is_running:
            try:
                await self.update_market_data()
                self.last_error = None  # Clear error on success
            except Exception as e:
                self.last_error = str(e)
                logger.error(f"❌ Error CRÍTICO en ciclo de actualización de mercado: {e}", exc_info=True)
                # No detenemos el servicio, solo esperamos para reintentar
            
            await asyncio.sleep(self.update_interval)

    async def stop_background_service(self):
        """Detiene el servicio"""
        self.is_running = False
        logger.info("🛑 Deteniendo Servicio de Datos de Mercado")

    async def update_market_data(self):
        """
        1. Identifica todos los activos con saldo > 0 en el sistema.
        2. Identifica todas las monedas catastradas para conversión.
        3. Obtiene cotizaciones unificadas.
        4. Actualiza la 'tabla virtual' (Redis).
        """
        logger.info("🔄 Ejecutando ciclo de actualización de mercado...")
        
        async with AsyncSessionLocal() as db:
            active_symbols = await self._get_symbols_to_track(db)
            
        if not active_symbols:
            logger.info("⚠️ No hay activos ni monedas para trackear en el sistema.")
            return

        logger.info(f"📊 {len(active_symbols)} símbolos a actualizar ({', '.join(active_symbols[:10])}...)")
        
        # Obtener cotizaciones de Yahoo Finance
        try:
            quotes = await yfinance_service.fetch_real_time_quotes(active_symbols)
            
            if quotes:
                await self._update_virtual_table(quotes)
                self.last_update = datetime.now()
                self.tracked_symbols_count = len(quotes)
                logger.info(f"✅ Tabla virtual actualizada con {len(quotes)} cotizaciones")
        except Exception as e:
             logger.error(f"⚠️ Error obteniendo cotizaciones: {e}")
             raise e # Re-raise to be caught by main loop

    def get_status(self):
        """Retorna el estado actual del servicio"""
        return {
            "is_running": self.is_running,
            "last_update": self.last_update.isoformat() if self.last_update else None,
            "tracked_symbols_count": self.tracked_symbols_count,
            "last_error": self.last_error,
            "update_interval": self.update_interval
        }

    async def _get_symbols_to_track(self, db: AsyncSession) -> list[str]:
        """
        Identifica símbolos que deben ser monitorizados 24/7:
        1. Activos con saldo DISTINTO DE CERO en cualquier cartera.
        2. Activos catastrados como tipo 'currency' (Monedas para conversión).
        """
        # Símbolos con posición activa
        active_pos_stmt = select(Asset.symbol).\
            join(Transaction, Asset.id == Transaction.asset_id).\
            group_by(Asset.id, Asset.symbol).\
            having(
                func.abs(
                    func.sum(
                        case(
                            (Transaction.transaction_type == TransactionType.BUY, Transaction.quantity),
                            (Transaction.transaction_type == TransactionType.SELL, -Transaction.quantity),
                            else_=0
                        )
                    )
                ) > 0.000001
            )
            
        # Monedas configuradas en el sistema (para conversiones)
        currencies_stmt = select(Asset.symbol).where(Asset.asset_type == AssetType.CURRENCY)
        
        # Combinar resultados
        res_active = await db.execute(active_pos_stmt)
        res_curr = await db.execute(currencies_stmt)
        
        symbols = set(res_active.scalars().all())
        symbols.update(res_curr.scalars().all())
        
        return list(symbols)

    async def _update_virtual_table(self, quotes: dict):
        """
        Guarda las cotizaciones en Redis (La Tabla Virtual).
        Formato Key: 'quote:{symbol}'
        Value: JSON con precio y timestamp
        """
        pipeline = redis_client.client.pipeline()
        
        for symbol, data in quotes.items():
            if data:
                key = f"quote:{symbol}"
                # Añadimos timestamp de actualización del sistema
                data['system_updated_at'] = datetime.now().isoformat()
                
                # Convertir objetos datetime a string para JSON
                if 'date' in data and isinstance(data['date'], datetime):
                    data['date'] = data['date'].isoformat()
                
                pipeline.set(key, json.dumps(data), ex=300) # TTL 5 minutos por seguridad
                
        await pipeline.execute()

market_data_service = MarketDataService()

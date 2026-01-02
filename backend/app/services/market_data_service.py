import asyncio
import logging
import json
from datetime import datetime
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.redis_client import redis_client
from app.models.transaction import Transaction, TransactionType
from app.models.asset import Asset
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

    async def start_background_service(self):
        """Inicia el bucle de actualización en segundo plano"""
        if self.is_running:
            return
            
        self.is_running = True
        logger.info("🚀 Iniciando Servicio de Datos de Mercado (Background)")
        
        while self.is_running:
            try:
                await self.update_market_data()
            except Exception as e:
                logger.error(f"❌ Error en ciclo de actualización de mercado: {e}")
            
            await asyncio.sleep(self.update_interval)

    async def stop_background_service(self):
        """Detiene el servicio"""
        self.is_running = False
        logger.info("🛑 Deteniendo Servicio de Datos de Mercado")

    async def update_market_data(self):
        """
        1. Identifica todos los activos con saldo > 0 en el sistema.
        2. Obtiene cotizaciones unificadas.
        3. Actualiza la 'tabla virtual' (Redis).
        """
        logger.info("🔄 Ejecutando ciclo de actualización de mercado...")
        
        async with AsyncSessionLocal() as db:
            active_symbols = await self._get_all_active_symbols(db)
            
        if not active_symbols:
            logger.info("⚠️ No hay activos activos en el sistema.")
            return

        logger.info(f"📊 Activos a actualizar: {len(active_symbols)} ({', '.join(active_symbols[:5])}...)")
        
        # Obtener cotizaciones de Yahoo Finance (u otros proveedores)
        quotes = await yfinance_service.fetch_real_time_quotes(active_symbols)
        
        if quotes:
            await self._update_virtual_table(quotes)
            logger.info(f"✅ Tabla virtual actualizada con {len(quotes)} cotizaciones")

    async def _get_all_active_symbols(self, db: AsyncSession) -> list[str]:
        """
        Consulta SQL optimizada para obtener símbolos únicos de activos 
        que tienen un saldo DISTINTO DE CERO en CUALQUIER cartera.
        (Incluye posiciones cortas/vendidas)
        """
        # Calcular suma de cantidades agrupadas por activo
        # SUM(CASE WHEN type='BUY' THEN quantity ELSE -quantity END)
        stmt = select(Asset.symbol).\
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
            
        result = await db.execute(stmt)
        return result.scalars().all()

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

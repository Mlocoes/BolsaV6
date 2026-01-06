"""
Servicio de programación de tareas (Scheduler) para BolsaV6
"""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from pytz import timezone
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal
from app.models.asset import Asset
from app.models.quote import Quote
from app.services.yfinance_service import yfinance_service
from app.models.system_setting import SystemSetting

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.timezone = timezone('Europe/Madrid')

    def start(self):
        """Inicia el programador de tareas"""
        if not self.scheduler.running:
            # Tarea diaria (configurada por Base de Datos o 00:00 UTC)
            self.scheduler.start()
            asyncio.create_task(self.reload_jobs())
            logger.info("✅ Programador de tareas iniciado")

    def shutdown(self):
        """Detiene el programador de tareas"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("🛑 Programador de tareas detenido")

    async def sync_all_quotes(self):
        """Sincroniza las cotizaciones de todos los activos registrados (solo sync_enabled=True)"""
        logger.info("🔄 Iniciando sincronización automática de cotizaciones...")
        
        async with AsyncSessionLocal() as db:
            try:
                # Obtener todos los activos registrados
                result = await db.execute(
                    select(Asset)
                )
                assets = result.scalars().all()
                
                logger.info(f"📊 Procesando {len(assets)} activos habilitados para actualizar cotizaciones")
                
                for asset in assets:
                    try:
                        logger.info(f"🔎 Actualizando {asset.symbol}...")
                        
                        # Obtener cotización actual (o del último cierre)
                        price_data = await yfinance_service.get_current_quote(asset.symbol)
                        
                        if price_data:
                            # Normalizar fecha a medianoche para la tabla de histórico
                            quote_date = datetime.combine(price_data["date"].date(), datetime.min.time())
                            
                            # Verificar si ya existe para hoy
                            existing = await db.execute(
                                select(Quote).where(
                                    and_(
                                        Quote.asset_id == asset.id,
                                        Quote.date == quote_date
                                    )
                                )
                            )
                            
                            if existing.scalar_one_or_none():
                                logger.info(f"⏭️ Cotización ya existe para {asset.symbol} en {quote_date.date()}, actualizando...")
                                # Opcional: Podríamos actualizar el precio si cambió, pero para cierre diario suele bastar
                                continue
                                
                            # Crear nueva cotización
                            new_quote = Quote(
                                asset_id=asset.id,
                                date=quote_date,
                                open=price_data["open"],
                                high=price_data["high"],
                                low=price_data["low"],
                                close=price_data["close"],
                                volume=price_data["volume"],
                                source="yfinance_auto"
                            )
                            db.add(new_quote)
                            logger.info(f"✅ Nueva cotización para {asset.symbol}: {price_data['close']}")
                        else:
                            logger.warning(f"⚠️ No se pudo obtener cotización para {asset.symbol}")
                            
                    except Exception as e:
                        logger.error(f"❌ Error sincronizando {asset.symbol}: {str(e)}")
                
                await db.commit()
                logger.info("✅ Sincronización automática de cotizaciones completada exitosamente")
                
            except Exception as e:
                await db.rollback()
                logger.error(f"❌ Error general en la sincronización de cotizaciones: {str(e)}")

    async def reload_jobs(self):
        """Recarga los trabajos del programador basándose en la configuración de la DB"""
        async with AsyncSessionLocal() as db:
            try:
                # Obtener configuración de hora y minuto
                res_h = await db.execute(select(SystemSetting).where(SystemSetting.key == "scheduler_sync_hour_utc"))
                res_m = await db.execute(select(SystemSetting).where(SystemSetting.key == "scheduler_sync_minute_utc"))
                
                h_set = res_h.scalar_one_or_none()
                m_set = res_m.scalar_one_or_none()
                
                hour = int(h_set.value) if h_set else 0
                minute = int(m_set.value) if m_set else 0
                
                logger.info(f"⏰ Configurando sincronización diaria para las {hour:02d}:{minute:02d} UTC")
                
                self.scheduler.add_job(
                    self.sync_all_quotes,
                    CronTrigger(hour=hour, minute=minute, timezone='UTC'),
                    id='sync_all_quotes_daily',
                    name='Sincronización diaria de cotizaciones',
                    replace_existing=True
                )
            except Exception as e:
                logger.error(f"❌ Error recargando trabajos del scheduler: {str(e)}")
                # Reintento básico por defecto si falla
                self.scheduler.add_job(
                    self.sync_all_quotes,
                    CronTrigger(hour=0, minute=0, timezone='UTC'),
                    id='sync_all_quotes_daily',
                    name='Sincronización diaria de cotizaciones',
                    replace_existing=True
                )

# Instancia global
scheduler_service = SchedulerService()

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
            asyncio.create_task(self.check_startup_sync())
            logger.info("✅ Programador de tareas iniciado")

    def shutdown(self):
        """Detiene el programador de tareas"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("🛑 Programador de tareas detenido")

    async def sync_all_quotes(self):
        """Sincroniza las cotizaciones de todos los activos registrados (Cierre Diario - Backfill 5 días)"""
        logger.info("🔄 Iniciando sincronización automática de cotizaciones (Estrategia Backfill 5d)...")
        
        async with AsyncSessionLocal() as db:
            try:
                # Obtener todos los activos registrados
                result = await db.execute(select(Asset))
                assets = result.scalars().all()
                
                logger.info(f"📊 Procesando {len(assets)} activos para cierre diario")
                
                # Obtener fecha actual en UTC para validación básica
                from datetime import timezone as dt_timezone
                now_utc = datetime.now(dt_timezone.utc)
                
                stats_processed = 0
                stats_inserted = 0
                
                for asset in assets:
                    try:
                        logger.info(f"🔎 Verificando historial reciente para {asset.symbol}...")
                        
                        # ESTRATEGIA: Obtener últimos 5 días para rellenar huecos si falló algún día anterior
                        historical_data = await yfinance_service.get_historical_quotes(asset.symbol, period="5d")
                        
                        if historical_data:
                            for quote_data in historical_data:
                                # Normalizar fecha a medianoche UTC (ya viene así del servicio, pero aseguramos)
                                data_date = quote_data["date"]
                                
                                # EVITAR FINES DE SEMANA
                                # (Sábado = 5, Domingo = 6)
                                from app.models.asset import AssetType
                                if asset.asset_type != AssetType.CRYPTO and data_date.weekday() >= 5:
                                    continue
                                
                                quote_date = datetime.combine(data_date.date(), datetime.min.time()).replace(tzinfo=dt_timezone.utc)
                                
                                # FIX CRÍTICO: Ignorar velas incompletas de HOY
                                # Solo importar cotizaciones de días estrictamente anteriores
                                if quote_date.date() >= now_utc.date():
                                    logger.debug(f"⏭️ Ignorando cotización incompleta de hoy para {asset.symbol} ({quote_date.date()})")
                                    continue
                                
                                # Verificar si ya existe exactamente para esa fecha
                                existing = await db.execute(
                                    select(Quote).where(
                                        and_(
                                            Quote.asset_id == asset.id,
                                            Quote.date == quote_date
                                        )
                                    )
                                )
                                
                                if existing.scalar_one_or_none():
                                    continue
                                    
                                # Crear nueva cotización
                                new_quote = Quote(
                                    asset_id=asset.id,
                                    date=quote_date,
                                    open=quote_data["open"],
                                    high=quote_data["high"],
                                    low=quote_data["low"],
                                    close=quote_data["close"],
                                    volume=quote_data["volume"],
                                    source="daily_scheduler_backfill"
                                )
                                db.add(new_quote)
                                stats_inserted += 1
                                logger.info(f"✅ Nuevo cierre importado para {asset.symbol}: {quote_data['close']} ({quote_date.date()})")
                                
                        else:
                            logger.warning(f"⚠️ No se obtuvieron datos históricos para {asset.symbol}")
                            
                        stats_processed += 1
                        
                    except Exception as e:
                        logger.error(f"❌ Error sincronizando {asset.symbol}: {str(e)}")
                
                # Actualizar marca de tiempo de última ejecución exitosa
                try:
                    now_str = now_utc.date().isoformat()
                    setting = await db.execute(select(SystemSetting).where(SystemSetting.key == "scheduler_last_sync_date"))
                    setting_obj = setting.scalar_one_or_none()
                    
                    if not setting_obj:
                        setting_obj = SystemSetting(
                            key="scheduler_last_sync_date", 
                            value=now_str, 
                            type="date", 
                            description="Última ejecución exitosa del cierre diario"
                        )
                        db.add(setting_obj)
                    else:
                        setting_obj.value = now_str
                except Exception as ex_setting:
                    logger.error(f"⚠️ No se pudo guardar la fecha de sincronización: {ex_setting}")

                await db.commit()
                logger.info(f"✅ Cierre diario completado. Activos: {stats_processed}, Nuevas Cotizaciones: {stats_inserted}")
                
            except Exception as e:
                await db.rollback()
                logger.error(f"❌ Error general en la sincronización de cierre: {str(e)}")

    async def check_startup_sync(self):
        """Verifica al inicio si falta la sincronización del día"""
        logger.info("⏳ Esperando arranque para verificar sincronizaciones pendientes...")
        await asyncio.sleep(15)  # Esperar a que otros servicios arranquen
        
        async with AsyncSessionLocal() as db:
            try:
                from datetime import timezone as dt_timezone
                now_utc = datetime.now(dt_timezone.utc).date()
                
                res = await db.execute(select(SystemSetting).where(SystemSetting.key == "scheduler_last_sync_date"))
                setting = res.scalar_one_or_none()
                
                last_sync = None
                if setting:
                    try:
                        last_sync = datetime.strptime(setting.value, "%Y-%m-%d").date()
                    except:
                        pass
                
                if not last_sync or last_sync < now_utc:
                    logger.warning(f"⚠️ Detectado que no se ha ejecutado el cierre diario hoy ({now_utc}). Último: {last_sync}. Ejecutando ahora...")
                    await self.sync_all_quotes()
                else:
                    logger.info(f"✅ Sincronización diaria ya realizada hoy ({last_sync}).")
                    
            except Exception as e:
                logger.error(f"❌ Error verificando sincronización al inicio: {e}")

    async def reload_jobs(self):
        """Recarga los trabajos del programador basándose en la configuración de la DB"""
        async with AsyncSessionLocal() as db:
            try:
                # Obtener configuración de hora y minuto
                res_h = await db.execute(select(SystemSetting).where(SystemSetting.key == "scheduler_sync_hour_utc"))
                res_m = await db.execute(select(SystemSetting).where(SystemSetting.key == "scheduler_sync_minute_utc"))
                
                h_set = res_h.scalar_one_or_none()
                m_set = res_m.scalar_one_or_none()
                
                # Por defecto 00:00 UTC si no está configurado
                hour = int(h_set.value) if h_set else 0
                minute = int(m_set.value) if m_set else 0
                
                logger.info(f"⏰ Configurando sincronización diaria (Cierre) para las {hour:02d}:{minute:02d} UTC")
                
                self.scheduler.add_job(
                    self.sync_all_quotes,
                    CronTrigger(hour=hour, minute=minute, timezone='UTC'),
                    id='sync_all_quotes_daily',
                    name='Sincronización diaria de cotizaciones (Cierre)',
                    replace_existing=True
                )
            except Exception as e:
                logger.error(f"❌ Error recargando trabajos del scheduler: {str(e)}")
                # Reintento básico 00:00 UTC
                self.scheduler.add_job(
                    self.sync_all_quotes,
                    CronTrigger(hour=0, minute=0, timezone='UTC'),
                    id='sync_all_quotes_daily',
                    name='Sincronización diaria de cotizaciones (Fallback 00:00 UTC)',
                    replace_existing=True
                )

# Instancia global
scheduler_service = SchedulerService()

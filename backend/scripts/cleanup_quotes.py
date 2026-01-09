import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from sqlalchemy import select, and_, func, delete
from app.core.database import AsyncSessionLocal
from app.models.quote import Quote
from datetime import datetime, timezone, timedelta

async def cleanup_quotes():
    print("--- Iniciando limpieza SEGURA de cotizaciones ---")
    async with AsyncSessionLocal() as db:
        from sqlalchemy import text
        
        # 1. Normalizar fechas una por una para evitar UniqueConstraint violation
        print("Buscando registros con desvío horario (21:00-03:00)...")
        sql_to_fix = """
        SELECT id, asset_id, date 
        FROM quotes 
        WHERE EXTRACT(HOUR FROM date) > 20 OR EXTRACT(HOUR FROM date) < 4
        """
        res = await db.execute(text(sql_to_fix))
        to_fix = res.all()
        
        print(f"Encontrados {len(to_fix)} registros para normalizar.")
        for rid, aid, old_date in to_fix:
            # Calcular nueva fecha (medianoche del día 'objetivo')
            # Si es > 20:00, es el día siguiente. Si es < 04:00 es el mismo día.
            if old_date.hour > 20:
                new_date = (old_date + timedelta(hours=4)).replace(hour=0, minute=0, second=0, microsecond=0)
            else:
                new_date = old_date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Verificar si ya existe ese (asset_id, new_date)
            exists_res = await db.execute(
                select(Quote.id).where(and_(Quote.asset_id == aid, Quote.date == new_date))
            )
            existing_id = exists_res.scalar_one_or_none()
            
            if existing_id and existing_id != rid:
                # Ya existe, borrar este duplicado
                await db.execute(delete(Quote).where(Quote.id == rid))
            else:
                # No existe, actualizar
                await db.execute(text("UPDATE quotes SET date = :d WHERE id = :id"), {"d": new_date, "id": rid})

        await db.commit()
        
        # 2. Eliminar cotizaciones en fines de semana (Sábado=6, Domingo=0)
        print("Eliminando registros de fines de semana...")
        sql_weekend = "DELETE FROM quotes WHERE EXTRACT(DOW FROM date) IN (0, 6)"
        res_w = await db.execute(text(sql_weekend))
        print(f"Registros de fin de semana eliminados: {res_w.rowcount}")
        
        # 3. Eliminar duplicados residuales
        print("Buscando duplicados residuales...")
        sql_dup = """
        SELECT asset_id, date, count(*) 
        FROM quotes 
        GROUP BY asset_id, date 
        HAVING count(*) > 1
        """
        res_d = await db.execute(text(sql_dup))
        dups = res_d.all()
        
        for asset_id, date_val, count in dups:
            res_ids = await db.execute(
                select(Quote.id).where(and_(Quote.asset_id == asset_id, Quote.date == date_val)).order_by(Quote.created_at.desc())
            )
            ids = res_ids.scalars().all()
            for extra_id in ids[1:]:
                await db.execute(delete(Quote).where(Quote.id == extra_id))

        await db.commit()
        print("--- Limpieza SEGURA completada ---")
        
        await db.commit()
        print("--- Limpieza completada con éxito ---")

if __name__ == "__main__":
    asyncio.run(cleanup_quotes())

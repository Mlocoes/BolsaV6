import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal
from app.models.quote import Quote
from datetime import datetime, date, timezone

async def check_existing_dates():
    asset_id = "55818ddf-5e1e-4c90-bec0-df2ca999fc7c" # DIA.MC
    print(f"Buscando fechas existentes para DIA.MC ({asset_id})...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Quote.date).where(Quote.asset_id == asset_id))
        rows = result.all()
        dates = {r[0].date() for r in rows}
        
        target = date(2026, 1, 5)
        if target in dates:
            print(f"❌ ENCONTRADO: {target} YA EXISTE en existing_dates.")
            # Buscar el registro exacto
            res_ex = await db.execute(select(Quote).where(and_(Quote.asset_id == asset_id, Quote.date >= datetime(2026,1,5), Quote.date < datetime(2026,1,6))))
            exact = res_ex.scalar_one_or_none()
            if exact:
                print(f"  Registro exacto: date={exact.date}, close={exact.close}, created_at={exact.created_at}")
        else:
            print(f"✅ NO ENCONTRADO: {target} NO existe en existing_dates.")

if __name__ == "__main__":
    asyncio.run(check_existing_dates())

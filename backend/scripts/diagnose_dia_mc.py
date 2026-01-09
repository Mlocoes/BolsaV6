import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal
from app.models.asset import Asset
from app.models.quote import Quote
from datetime import datetime, date, timedelta

async def diagnose_dia_mc():
    symbol = "DIA.MC"
    print(f"--- Diagnóstico profundo de {symbol} ---")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.symbol == symbol))
        asset = res.scalar_one_or_none()
        if not asset:
            print(f"Error: {symbol} no encontrado.")
            return
        
        # Obtener todas las cotizaciones del 2026-01-01 en adelante
        start_date = datetime(2026, 1, 1)
        res = await db.execute(
            select(Quote).where(
                and_(Quote.asset_id == asset.id, Quote.date >= start_date)
            ).order_by(Quote.date.asc())
        )
        quotes = res.scalars().all()
        
        print(f"{'FECHA (UTC/TZ)':<30} | {'CIERRE':<10} | {'SOURCE':<20} | {'CREATED_AT':<20}")
        print("-" * 90)
        for q in quotes:
            print(f"{str(q.date):<30} | {float(q.close):<10.4f} | {q.source:<20} | {str(q.created_at)}")

if __name__ == "__main__":
    asyncio.run(diagnose_dia_mc())

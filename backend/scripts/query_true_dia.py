import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def q():
    # ID real de DIA.MC según check_asset_details.py
    asset_id = '424e567b-b2f1-4f80-a170-d20e5e3314ee'
    async with AsyncSessionLocal() as db:
        res = await db.execute(text(f"SELECT date, close, source, created_at FROM quotes WHERE date >= '2026-01-01' AND asset_id = '{asset_id}' ORDER BY date"))
        print(f"{'FECHA':<30} | {'CIERRE':<10} | {'SOURCE':<20} | {'CREATED_AT':<20}")
        for row in res.all():
            print(f"{str(row[0]):<30} | {float(row[1]):<10.4f} | {row[2]:<20} | {str(row[3])}")

if __name__ == "__main__":
    asyncio.run(q())

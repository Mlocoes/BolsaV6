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
    asset_id = '99507ed9-d033-4c7e-b9c3-3f0f94039e86'
    async with AsyncSessionLocal() as db:
        # Buscar el primer fin de semana de enero 2026 (3 y 4)
        res = await db.execute(text(f"SELECT date, close, source FROM quotes WHERE asset_id='{asset_id}' AND date >= '2026-01-01' ORDER BY date"))
        print(f"{'FECHA':<30} | {'CIERRE':<10} | {'SOURCE':<20}")
        rows = res.all()
        for row in rows:
            print(f"{str(row[0]):<30} | {float(row[1]):<10.4f} | {row[2]:<20}")
        
        if not rows:
            print("No se encontraron registros.")

if __name__ == "__main__":
    asyncio.run(q())

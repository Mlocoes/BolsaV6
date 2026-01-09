import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from app.core.database import AsyncSessionLocal
from app.models.asset import Asset
from sqlalchemy import select

async def search_dia():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.symbol.like('DIA%')))
        assets = res.scalars().all()
        print(f"Encontrados {len(assets)} activos:")
        for a in assets:
            print(f"ID: {a.id}")
            print(f"  Symbol: {a.symbol}")
            print(f"  Name: {a.name}")
            print(f"  Type: {a.asset_type}")

if __name__ == "__main__":
    asyncio.run(search_dia())

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

async def search():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.symbol == 'SOL/USD'))
        a = res.scalar_one_or_none()
        if a:
            print(f"ID: {a.id}")
            print(f"Symbol: {a.symbol}")
            print(f"Type: {a.asset_type}")
        else:
            print("Asset not found.")

if __name__ == "__main__":
    asyncio.run(search())

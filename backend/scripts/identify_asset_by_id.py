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

async def check_id():
    asset_id = '55818ddf-5e1e-4c90-bec0-df2ca999fc7c'
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.id == asset_id))
        a = res.scalar_one_or_none()
        if a:
            print(f"ID: {a.id}")
            print(f"Symbol: {a.symbol}")
            print(f"Name: {a.name}")
        else:
            print("Asset not found.")

if __name__ == "__main__":
    asyncio.run(check_id())

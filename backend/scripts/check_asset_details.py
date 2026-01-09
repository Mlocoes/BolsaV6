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

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.symbol == 'DIA.MC'))
        asset = res.scalar_one_or_none()
        if asset:
            print(f"Asset ID: {asset.id}")
            print(f"Name: {asset.name}")
            print(f"Symbol: {asset.symbol}")
            print(f"Type: {asset.asset_type}")
        else:
            print("Asset not found.")

if __name__ == "__main__":
    asyncio.run(check())

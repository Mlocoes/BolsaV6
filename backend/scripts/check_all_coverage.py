import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from app.core.database import AsyncSessionLocal
from app.models.asset import Asset
from app.api.quotes import _check_asset_needs_import
from sqlalchemy import select

async def check_all_coverage():
    print("--- Verificando cobertura de todos los activos ---")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Asset).order_by(Asset.symbol))
        assets = result.scalars().all()
        
        needs_repair = []
        for asset in assets:
            check = await _check_asset_needs_import(str(asset.id), db)
            status = "✅ OK" if not check["needs_import"] else f"❌ NEEDS IMPORT ({check['reason']})"
            print(f"{asset.symbol:<15} | Status: {status:<30} | Msg: {check['message']}")
            if check["needs_import"]:
                needs_repair.append(asset.symbol)
        
        print(f"\nTotal activos que necesitan reparación: {len(needs_repair)}")

if __name__ == "__main__":
    asyncio.run(check_all_coverage())

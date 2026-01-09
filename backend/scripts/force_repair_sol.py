import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from app.api.quotes import _bulk_import_historical
from app.models.asset import AssetType

async def force_repair_sol():
    # ID de SOL/USD
    asset_id = "99507ed9-d033-4c7e-b9c3-3f0f94039e86"
    assets = [{"id": asset_id, "symbol": "SOL/USD", "asset_type": AssetType.CRYPTO}]
    print(f"Forzando reparación para {assets}")
    await _bulk_import_historical(assets, force_refresh=False)
    print("Reparación completada.")

if __name__ == "__main__":
    asyncio.run(force_repair_sol())

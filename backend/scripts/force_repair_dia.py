import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from app.api.quotes import _bulk_import_historical

async def force_repair_dia():
    # ID real de DIA.MC
    asset_id = "424e567b-b2f1-4f80-a170-d20e5e3314ee"
    assets = [{"id": asset_id, "symbol": "DIA.MC"}]
    print(f"Forzando reparación para {assets}")
    await _bulk_import_historical(assets, force_refresh=False)
    print("Reparación completada.")

if __name__ == "__main__":
    asyncio.run(force_repair_dia())

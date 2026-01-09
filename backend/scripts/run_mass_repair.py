import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from app.core.database import AsyncSessionLocal
from app.models.asset import Asset
from app.api.quotes import _bulk_import_historical
from sqlalchemy import select

async def run_mass_repair():
    print("--- Iniciando Reparación Masiva de Activos ---")
    async with AsyncSessionLocal() as db:
        # Obtener todos los activos con sincronización habilitada
        result = await db.execute(select(Asset).where(Asset.sync_enabled == True).order_by(Asset.symbol))
        assets_objs = result.scalars().all()
        
        assets_data = [
            {"id": str(a.id), "symbol": a.symbol, "asset_type": a.asset_type}
            for a in assets_objs
        ]
        
        print(f"Lanzando reparación para {len(assets_data)} activos operativos...")
        # Llamar directamente a la función de reparación (que internamente filtra)
        await _bulk_import_historical(assets_data, force_refresh=False)
        print("\nProceso de reparación masiva finalizado.")

if __name__ == "__main__":
    asyncio.run(run_mass_repair())

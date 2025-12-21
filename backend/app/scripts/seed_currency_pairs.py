"""
Script para poblar pares de monedas (currency pairs) como activos
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.core.database import AsyncSessionLocal
from app.models.asset import Asset, AssetType
from sqlalchemy import select


async def seed_currency_pairs():
    """Crear activos tipo CURRENCY para los pares forex más comunes"""
    
    # Pares de monedas principales (formato Yahoo Finance)
    currency_pairs = [
        # EUR como base
        {"symbol": "EURUSD=X", "name": "EUR/USD", "from_currency": "EUR", "to_currency": "USD"},
        {"symbol": "EURGBP=X", "name": "EUR/GBP", "from_currency": "EUR", "to_currency": "GBP"},
        {"symbol": "EURJPY=X", "name": "EUR/JPY", "from_currency": "EUR", "to_currency": "JPY"},
        {"symbol": "EURCHF=X", "name": "EUR/CHF", "from_currency": "EUR", "to_currency": "CHF"},
        {"symbol": "EURCAD=X", "name": "EUR/CAD", "from_currency": "EUR", "to_currency": "CAD"},
        
        # USD como base
        {"symbol": "USDEUR=X", "name": "USD/EUR", "from_currency": "USD", "to_currency": "EUR"},
        {"symbol": "USDGBP=X", "name": "USD/GBP", "from_currency": "USD", "to_currency": "GBP"},
        {"symbol": "USDJPY=X", "name": "USD/JPY", "from_currency": "USD", "to_currency": "JPY"},
        {"symbol": "USDCHF=X", "name": "USD/CHF", "from_currency": "USD", "to_currency": "CHF"},
        {"symbol": "USDCAD=X", "name": "USD/CAD", "from_currency": "USD", "to_currency": "CAD"},
        
        # GBP como base
        {"symbol": "GBPUSD=X", "name": "GBP/USD", "from_currency": "GBP", "to_currency": "USD"},
        {"symbol": "GBPEUR=X", "name": "GBP/EUR", "from_currency": "GBP", "to_currency": "EUR"},
        {"symbol": "GBPJPY=X", "name": "GBP/JPY", "from_currency": "GBP", "to_currency": "JPY"},
        
        # Otros pares importantes
        {"symbol": "CHFEUR=X", "name": "CHF/EUR", "from_currency": "CHF", "to_currency": "EUR"},
        {"symbol": "CHFUSD=X", "name": "CHF/USD", "from_currency": "CHF", "to_currency": "USD"},
        {"symbol": "CADEUR=X", "name": "CAD/EUR", "from_currency": "CAD", "to_currency": "EUR"},
        {"symbol": "CADUSD=X", "name": "CAD/USD", "from_currency": "CAD", "to_currency": "USD"},
        {"symbol": "JPYEUR=X", "name": "JPY/EUR", "from_currency": "JPY", "to_currency": "EUR"},
        {"symbol": "JPYUSD=X", "name": "JPY/USD", "from_currency": "JPY", "to_currency": "USD"},
    ]
    
    async with AsyncSessionLocal() as db:
        print("\n💱 Poblando pares de monedas...")
        print(f"📊 Total de pares a crear: {len(currency_pairs)}\n")
        
        created = 0
        skipped = 0
        
        for pair in currency_pairs:
            # Verificar si ya existe
            result = await db.execute(
                select(Asset).where(Asset.symbol == pair["symbol"])
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"⏭️  Ya existe: {pair['symbol']}")
                skipped += 1
                continue
            
            # Crear nuevo par de monedas
            currency_asset = Asset(
                symbol=pair["symbol"],
                name=pair["name"],
                asset_type=AssetType.CURRENCY,  # Usar el enum directamente
                currency=pair["to_currency"],  # La moneda de cotización
                market="FOREX"
            )
            
            db.add(currency_asset)
            created += 1
            print(f"✅ Creado: {pair['symbol']:15} ({pair['name']:10}) - {pair['from_currency']} → {pair['to_currency']}")
        
        if created > 0:
            await db.commit()
        
        print(f"\n📈 Resumen:")
        print(f"  ✅ Creados: {created}")
        print(f"  ⏭️  Ya existían: {skipped}")
        print(f"  📊 Total: {created + skipped}")
        print(f"\n✨ Proceso finalizado")


if __name__ == "__main__":
    asyncio.run(seed_currency_pairs())

"""
Script para poblar la tabla de mercados con datos iniciales
"""
import asyncio
import sys
import os

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.database import get_db
from app.models.market import Market
from sqlalchemy import select

INITIAL_MARKETS = [
    {"name": "NASDAQ", "currency": "USD", "country": "USA"},
    {"name": "NYSE", "currency": "USD", "country": "USA"},
    {"name": "NEW YORK", "currency": "USD", "country": "USA"},
    {"name": "NYSE AMERICAN", "currency": "USD", "country": "USA"},
    {"name": "CONTINUO", "currency": "EUR", "country": "ESPAÑA"},
    {"name": "MCE", "currency": "EUR", "country": "ESPAÑA"},
    {"name": "XETRA", "currency": "EUR", "country": "ALEMANIA"},
    {"name": "XETRA US STARS", "currency": "EUR", "country": "ALEMANIA"},
    {"name": "FRANKFURT", "currency": "EUR", "country": "ALEMANIA"},
    {"name": "PARIS", "currency": "EUR", "country": "FRANCIA"},
    {"name": "MILAN", "currency": "EUR", "country": "ITALIA"},
    {"name": "AMSTERDAM", "currency": "EUR", "country": "HOLANDA"},
    {"name": "LSE", "currency": "GBP", "country": "REINO UNIDO"},
    {"name": "LONDON", "currency": "GBP", "country": "REINO UNIDO"},
    {"name": "SWX", "currency": "CHF", "country": "SUIZA"},
    {"name": "TORONTO", "currency": "CAD", "country": "CANADÁ"},
]

async def seed_markets():
    print("🌱 Poblando tabla de mercados...")
    async for db in get_db():
        for m_data in INITIAL_MARKETS:
            # Comprobar si ya existe
            result = await db.execute(select(Market).where(Market.name == m_data["name"]))
            if not result.scalar_one_or_none():
                market = Market(**m_data)
                db.add(market)
                print(f"✅ Añadido: {m_data['name']} ({m_data['currency']})")
            else:
                print(f"⏭️ Ya existe: {m_data['name']}")
        
        await db.commit()
        break
    print("✨ Proceso finalizado")

if __name__ == "__main__":
    asyncio.run(seed_markets())

import asyncio
import os
import sys
from dotenv import load_dotenv

# Añadir el directorio raíz al path para poder importar la app
# Y cargar el .env ANTES de importar módulos de la app
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from sqlalchemy import select, func, and_
from app.core.database import AsyncSessionLocal
from app.models.asset import Asset
from app.models.quote import Quote
from app.models.transaction import Transaction
from datetime import datetime, date, timedelta

async def diagnose_asset(symbol):
    print(f"--- Diagnóstico de {symbol} ---")
    async with AsyncSessionLocal() as db:
        # 1. Buscar Activo
        res = await db.execute(select(Asset).where(Asset.symbol == symbol))
        asset = res.scalar_one_or_none()
        if not asset:
            print(f"Error: Activo {symbol} no encontrado.")
            return
        
        print(f"Asset ID: {asset.id}")
        print(f"Moneda: {asset.currency}")
        
        # 2. Buscar Transacciones
        res = await db.execute(select(func.min(Transaction.date), func.max(Transaction.date), func.count(Transaction.id)).where(Transaction.asset_id == asset.id))
        min_tx, max_tx, count_tx = res.one()
        print(f"Transacciones: {count_tx}")
        print(f"Primera transacción: {min_tx}")
        
        # 3. Buscar Cotizaciones recientes
        today = date.today()
        start_look = datetime.combine(today - timedelta(days=15), datetime.min.time())
        res = await db.execute(select(Quote.date, Quote.close).where(and_(Quote.asset_id == asset.id, Quote.date >= start_look)).order_by(Quote.date.desc()))
        quotes = res.all()
        
        print(f"Cotizaciones desde {start_look.date()}:")
        quote_dates = set()
        for q in quotes:
            print(f"  {q.date.date()} - {q.close}")
            quote_dates.add(q.date.date())
        
        # 4. Simular detección de lagunas
        start_date = min_tx.date() if min_tx else (today - timedelta(days=730))
        # Limitar a hace 15 días para el diagnóstico legible
        if start_date < (today - timedelta(days=15)):
            start_date = today - timedelta(days=15)
            
        print(f"\nSimulación de detección de lagunas (desde {start_date}):")
        missing_days = []
        curr = start_date
        while curr < today:
            if curr.weekday() < 5: # Lunes a Viernes
                if curr not in quote_dates:
                    missing_days.append(curr)
            curr += timedelta(days=1)
            
        if missing_days:
            print(f"Lagunas detectadas ({len(missing_days)}):")
            for d in missing_days:
                print(f"  - {d}")
        else:
            print("No se detectaron lagunas (L-V).")

if __name__ == "__main__":
    symbol = sys.argv[1] if len(sys.argv) > 1 else "AGAE"
    asyncio.run(diagnose_asset(symbol))

import asyncio
import os
import sys
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
load_dotenv(os.path.join(root_dir, '.env'))

from app.core.database import AsyncSessionLocal
from app.api.quotes import _get_asset_quote_coverage
from sqlalchemy import select
from app.models.asset import Asset

async def diagnose_xpev():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Asset).where(Asset.symbol == 'XPEV'))
        a = res.scalar_one_or_none()
        if not a:
            print("XPEV no encontrado.")
            return
            
        coverage = await _get_asset_quote_coverage(str(a.id), db)
        print(f"Diagnóstico para {a.symbol}:")
        print(f"  Total Quotes: {coverage['total_quotes']}")
        print(f"  Missing Days Count: {coverage['missing_days_count']}")
        print(f"  Gaps? {coverage['has_gaps']}")
        
        # Necesitamos acceder a la lista de missing_days, pero _get_asset_quote_coverage no la devuelve en el dict público por defecto o sí?
        # Re-calculémoslo aquí o modifiquemos temporalmente la función.
        # En mi implementación anterior de _get_asset_quote_coverage SÍ devolvía missing_days_count pero no la lista.
        
        # Vamos a listar los primeros 20 missing days para ver si son festivos.
        from datetime import date, timedelta, datetime, timezone
        from app.models.quote import Quote
        from app.models.transaction import Transaction
        from sqlalchemy import func, and_
        
        required_start = coverage['required_start_date']
        print(f"  Required Start: {required_start}")
        
        quotes_result = await db.execute(
            select(Quote.date).where(
                and_(
                    Quote.asset_id == a.id,
                    Quote.date >= datetime.combine(required_start, datetime.min.time()).replace(tzinfo=timezone.utc)
                )
            )
        )
        existing_dates = {row[0].date() for row in quotes_result.all()}
        
        missing = []
        curr = required_start
        today = date.today()
        while curr < today:
            if curr.weekday() < 5 and curr not in existing_dates:
                missing.append(curr)
            curr += timedelta(days=1)
            
        print(f"  Listado de los primeros 20 huecos detectados:")
        for d in missing[:20]:
            print(f"    - {d} ({d.strftime('%A')})")

if __name__ == "__main__":
    asyncio.run(diagnose_xpev())

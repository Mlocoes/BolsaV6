
import sys
import os
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# MOCK DATABASE
mock_db = MagicMock()
mock_db.Base = object
sys.modules['app.core.database'] = mock_db

from app.schemas.fiscal import FiscalOperation
from app.services.fiscal_service import fiscal_service
from app.models.transaction import TransactionType

def run_debug():
    print("=== DEBUG WASH SALE (PARCIAL) ===")
    
    # Escenario: 
    # 1. Compra 100 Acciones @ 10€
    # 2. Venta 100 Acciones @ 8€ (Pérdida de 200€)
    # 3. Recompra 10 Acciones @ 9€ (Dentro de los 2 meses)
    
    # Comportamiento esperado:
    # - Se ha recomprado el 10% de lo vendido.
    # - Solo el 10% de la pérdida (20€) debería ser "No computable".
    # - El 90% de la pérdida (180€) debería ser deducible ahora.
    
    # Comportamiento actual (Sospechado):
    # - 100% de la pérdida (200€) es bloqueada.

    ops = [
        FiscalOperation(
            id="1", date=datetime(2023, 1, 1), type=TransactionType.BUY,
            asset_id="TEST", asset_symbol="TEST", quantity=Decimal(100), price=Decimal(10), fees=Decimal(0)
        ),
        FiscalOperation(
            id="2", date=datetime(2023, 2, 1), type=TransactionType.SELL,
            asset_id="TEST", asset_symbol="TEST", quantity=Decimal(100), price=Decimal(8), fees=Decimal(0)
        ),
        FiscalOperation(
            id="3", date=datetime(2023, 2, 10), type=TransactionType.BUY,
            asset_id="TEST", asset_symbol="TEST", quantity=Decimal(10), price=Decimal(9), fees=Decimal(0)
        ),
    ]
    
    report = fiscal_service.calculate_fiscal_impact("debug", ops)
    
    item = report.years[0].items[0]
    print(f"Pérdida Bruta: {item.gross_result}€")
    print(f"Es Wash Sale: {item.is_wash_sale}")
    print(f"Pérdida No Computable: {item.wash_sale_disallowed_loss}€")
    
    if item.wash_sale_disallowed_loss == item.gross_result:
        print("\n[CONFIRMADO] El sistema está bloqueando TODA la pérdida.")
    elif item.wash_sale_disallowed_loss == Decimal("-20.00"): # 10% de -200
        print("\n[CORRECTO] El sistema está bloqueando solo la parte proporcional.")
    else:
        print(f"\n[?] Comportamiento inesperado: {item.wash_sale_disallowed_loss}")

if __name__ == "__main__":
    run_debug()

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.asset import Asset
from app.schemas.fiscal import FiscalReport, FiscalOperation
from app.services.fiscal_service import fiscal_service

router = APIRouter()

@router.get("/calculate", response_model=FiscalReport)
async def get_fiscal_report(
    portfolio_id: str,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Calcula el informe fiscal para una cartera específica.
    """
    try:
        # Verificar UUID válido
        try:
            pid = UUID(portfolio_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid portfolio ID format")

        # Obtener transacciones ordenadas por fecha con asset cargado
        query = (
            select(Transaction)
            .options(joinedload(Transaction.asset))
            .where(Transaction.portfolio_id == pid)
            .order_by(Transaction.transaction_date)
        )
        result = await db.execute(query)
        transactions = result.scalars().all()

        if not transactions:
            return FiscalReport(portfolio_id=portfolio_id)

        # Convertir a FiscalOperation
        fiscal_ops = []
        for t in transactions:
            # Asegurar asset_symbol
            asset_symbol = t.asset.symbol if t.asset else "UNKNOWN"
            
            fiscal_op = FiscalOperation(
                id=str(t.id),
                date=t.transaction_date,
                type=t.transaction_type,
                asset_id=str(t.asset_id),
                asset_symbol=asset_symbol,
                quantity=t.quantity,
                price=t.price,
                fees=t.fees or 0
            )
            fiscal_ops.append(fiscal_op)

        # Calcular reporte
        report = fiscal_service.calculate_fiscal_impact(portfolio_id, fiscal_ops)
        
        # Filtrar por año si se solicita
        if year:
            report.years = [y for y in report.years if y.year == year]
            
        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating fiscal report: {str(e)}")

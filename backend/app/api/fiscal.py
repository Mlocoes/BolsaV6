from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.transaction import Transaction
from app.models.asset import Asset
from app.models.user import User
from app.schemas.fiscal import FiscalReport, FiscalOperation
from app.services.fiscal_service import fiscal_service

router = APIRouter()

@router.get("/calculate", response_model=FiscalReport)
async def get_fiscal_report(
    portfolio_id: str,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calcula el informe fiscal para una cartera específica.
    """
    try:
        user_id = current_user["user_id"]
        
        # Obtener moneda base del usuario
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        target_currency = user.base_currency if user else "EUR"

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
            asset_currency = t.asset.currency if t.asset else "USD"
            
            fiscal_op = FiscalOperation(
                id=str(t.id),
                date=t.transaction_date,
                type=t.transaction_type,
                asset_id=str(t.asset_id),
                asset_symbol=asset_symbol,
                asset_currency=asset_currency,
                quantity=t.quantity,
                price=t.price,
                fees=t.fees or 0,
                original_price=t.price, # Guardar valor original antes de conversión
                original_fees=t.fees or 0
            )
            fiscal_ops.append(fiscal_op)

        # Calcular reporte
        report = await fiscal_service.calculate_fiscal_impact(portfolio_id, fiscal_ops, target_currency, db)
        
        # Filtrar por año si se solicita
        if year:
            report.years = [y for y in report.years if y.year == year]
            
        return report

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error calculating fiscal report: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al calcular el informe fiscal")

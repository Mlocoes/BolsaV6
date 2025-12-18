"""
API de Carteras
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List
from decimal import Decimal
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.transaction import Transaction, TransactionType
from app.models.asset import Asset
from app.models.quote import Quote
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse

router = APIRouter()


@router.get("/", response_model=List[PortfolioResponse])
async def list_portfolios(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar carteras del usuario actual"""
    result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user["user_id"])
    )
    portfolios = result.scalars().all()
    return [PortfolioResponse.model_validate(p) for p in portfolios]


@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear nueva cartera"""
    new_portfolio = Portfolio(
        user_id=current_user["user_id"],
        name=portfolio_data.name,
        description=portfolio_data.description
    )
    
    db.add(new_portfolio)
    await db.commit()
    await db.refresh(new_portfolio)
    
    return PortfolioResponse.model_validate(new_portfolio)


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener cartera por ID"""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    return PortfolioResponse.model_validate(portfolio)


@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: str,
    portfolio_data: PortfolioUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar cartera"""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    if portfolio_data.name is not None:
        portfolio.name = portfolio_data.name
    if portfolio_data.description is not None:
        portfolio.description = portfolio_data.description
    
    await db.commit()
    await db.refresh(portfolio)
    
    return PortfolioResponse.model_validate(portfolio)


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar cartera"""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    await db.delete(portfolio)
    await db.commit()


@router.get("/{portfolio_id}/positions")
async def get_portfolio_positions(
    portfolio_id: str,
    online: bool = False,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener posiciones actuales de una cartera"""
    # Verificar que la cartera pertenece al usuario
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    portfolio = result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    # Obtener todas las transacciones de la cartera
    transactions_result = await db.execute(
        select(Transaction, Asset).join(Asset).where(
            Transaction.portfolio_id == portfolio_id
        ).order_by(Transaction.transaction_date)
    )
    transactions = transactions_result.all()
    
    # Calcular posiciones por activo
    positions = {}
    for transaction, asset in transactions:
        asset_id = str(transaction.asset_id)
        
        if asset_id not in positions:
            positions[asset_id] = {
                "asset_id": asset_id,
                "symbol": asset.symbol,
                "name": asset.name,
                "quantity": Decimal("0"),
                "average_price": Decimal("0"),
                "total_invested": Decimal("0")
            }
        
        if transaction.transaction_type == TransactionType.BUY:
            # Compra: sumar cantidad y calcular precio promedio
            new_invested = (transaction.quantity * transaction.price) + transaction.fees
            
            positions[asset_id]["quantity"] += transaction.quantity
            positions[asset_id]["total_invested"] += new_invested
            
            if positions[asset_id]["quantity"] > 0:
                positions[asset_id]["average_price"] = positions[asset_id]["total_invested"] / positions[asset_id]["quantity"]
        
        elif transaction.transaction_type == TransactionType.SELL:
            # Venta: restar cantidad y ajustar inversión proporcionalmente
            if positions[asset_id]["quantity"] > 0:
                proportion = transaction.quantity / positions[asset_id]["quantity"]
                positions[asset_id]["total_invested"] -= positions[asset_id]["total_invested"] * proportion
                positions[asset_id]["quantity"] -= transaction.quantity
                
                if positions[asset_id]["quantity"] > 0:
                    positions[asset_id]["average_price"] = positions[asset_id]["total_invested"] / positions[asset_id]["quantity"]
                else:
                    positions[asset_id]["average_price"] = Decimal("0")
    
    # Filtrar solo posiciones con cantidad > 0
    active_symbols = [pos["symbol"] for pos in positions.values() if pos["quantity"] > 0]
    
    # Obtener precios online si se solicita
    online_prices = {}
    if online and active_symbols:
        from app.services.yfinance_service import yfinance_service
        online_prices = await yfinance_service.get_multiple_current_quotes(active_symbols)
    
    # Procesar posiciones finales
    active_positions = []
    for pos in positions.values():
        if pos["quantity"] > 0:
            if online and pos["symbol"] in online_prices and online_prices[pos["symbol"]]:
                current_price = online_prices[pos["symbol"]]["close"]
                source = "online"
            else:
                # Fallback a la última cotización del histórico
                quote_result = await db.execute(
                    select(Quote).where(
                        Quote.asset_id == pos["asset_id"]
                    ).order_by(desc(Quote.date)).limit(1)
                )
                latest_quote = quote_result.scalar_one_or_none()
                current_price = float(latest_quote.close) if latest_quote else 0.0
                source = "historic"
            
            quantity = float(pos["quantity"])
            avg_price = float(pos["average_price"])
            cost_basis = float(pos["total_invested"])
            current_value = quantity * current_price
            profit_loss = current_value - cost_basis
            profit_loss_percent = (profit_loss / cost_basis * 100) if cost_basis > 0 else 0.0
            
            active_positions.append({
                "asset_id": pos["asset_id"],
                "symbol": pos["symbol"],
                "name": pos["name"],
                "quantity": quantity,
                "avg_price": avg_price,
                "current_price": current_price,
                "cost_basis": cost_basis,
                "current_value": current_value,
                "profit_loss": profit_loss,
                "profit_loss_percent": profit_loss_percent,
                "source": source
            })
    
    return active_positions

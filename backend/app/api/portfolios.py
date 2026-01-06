"""
API de Carteras
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.transaction import Transaction, TransactionType
from app.models.asset import Asset, AssetType
from app.models.quote import Quote
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from app.services.forex_service import forex_service

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
    target_date: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener posiciones de una cartera.
    Si se proporciona target_date, se calculan las posiciones a esa fecha.
    En caso contrario, se calculan las posiciones actuales.
    """
    # Obtener moneda base del usuario
    user_result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = user_result.scalar_one()
    base_currency = user.base_currency or "EUR"

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
    
    # Calcular fecha de referencia
    ref_date = target_date or datetime.now().date()
    
    # Obtener todas las transacciones de la cartera hasta la fecha de referencia
    stmt = select(Transaction, Asset).join(Asset).where(
        Transaction.portfolio_id == portfolio_id
    )
    if target_date:
        stmt = stmt.where(Transaction.transaction_date <= target_date)
    
    stmt = stmt.order_by(Transaction.transaction_date, Transaction.id)
    
    transactions_result = await db.execute(stmt)
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
                "currency": asset.currency,
                "asset_type": asset.asset_type,
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
    active_asset_ids = [pos["asset_id"] for pos in positions.values() if pos["quantity"] > 0]
    active_symbols = [pos["symbol"] for pos in positions.values() if pos["quantity"] > 0]
    
    # Obtener precios online solo si es para "HOY" (no target_date o target_date es hoy)
    is_today = not target_date or target_date == datetime.now().date()
    
    online_prices = {}
    if online and active_symbols and is_today:
        from app.services.yfinance_service import yfinance_service
        online_prices = await yfinance_service.get_multiple_current_quotes(active_symbols)
        
        # Inyectar tasas de cambio online si es necesario
        needed_currencies = {pos["currency"] for pos in positions.values() if pos["quantity"] > 0 and pos["currency"] != base_currency}
        if needed_currencies:
            needed_pairs = [f"{curr}{base_currency}=X" for curr in needed_currencies]
            currency_quotes = await yfinance_service.get_multiple_current_quotes(needed_pairs)
            for pair, data in currency_quotes.items():
                if data:
                    from_c = pair[:3]
                    to_c = pair[3:6]
                    forex_service.inject_live_rate(from_c, to_c, ref_date, data["close"])
    
    # Batch fetch the last 2 quotes for each active asset (N+1 Optimization)
    # If target_date is set, we want the quote on or before target_date, 
    # and the one before that for daily change.
    quotes_map = {}
    if active_asset_ids:
        # Subquery to rank quotes by date per asset using row_number window function
        stmt = select(
            Quote.id,
            Quote.asset_id,
            Quote.date,
            Quote.close,
            func.row_number().over(
                partition_by=Quote.asset_id,
                order_by=Quote.date.desc()
            ).label("rn")
        ).where(Quote.asset_id.in_(active_asset_ids))
        
        if target_date:
            stmt = stmt.where(Quote.date <= target_date)
            
        stmt = stmt.subquery()
        
        # Select only the top 2 for each asset
        batch_result = await db.execute(select(stmt).where(stmt.c.rn <= 2))
        
        for row in batch_result:
            aid = str(row.asset_id)
            if aid not in quotes_map:
                quotes_map[aid] = []
            quotes_map[aid].append(row)

    # Procesar posiciones finales
    active_positions = []
    for pos in positions.values():
        if pos["quantity"] > 0:
            asset_id_str = str(pos["asset_id"])
            asset_quotes = quotes_map.get(asset_id_str, [])
            
            # Obtener precio actual (Online > Historic)
            if online and is_today and pos["symbol"] in online_prices and online_prices[pos["symbol"]]:
                current_price = online_prices[pos["symbol"]]["close"]
                source = "online"
            else:
                latest_quote = asset_quotes[0] if asset_quotes else None
                current_price = float(latest_quote.close) if latest_quote else 0.0
                source = "historic"
            
            # Obtener precio del día anterior (penúltima cotización o fallback a la actual)
            previous_close = float(asset_quotes[1].close) if len(asset_quotes) > 1 else current_price
            
            # Si estamos en una fecha histórica, el "anterior" debe ser estrictamente menor que la fecha de la cotización actual
            # para que el "resultado del día" tenga sentido.
            
            quantity = float(pos["quantity"])
            avg_price = float(pos["average_price"])
            cost_basis = float(pos["total_invested"])
            current_value = quantity * current_price
            profit_loss = current_value - cost_basis
            profit_loss_percent = (profit_loss / cost_basis * 100) if cost_basis > 0 else 0.0
            
            # Cálculos del día
            day_change = current_price - previous_close
            day_change_percent = (day_change / previous_close * 100) if previous_close > 0 else 0.0
            day_result = day_change * quantity
            
            active_positions.append({
                "asset_id": pos["asset_id"],
                "symbol": pos["symbol"],
                "name": pos["name"],
                "currency": pos["currency"],
                "asset_type": pos["asset_type"],
                "quantity": quantity,
                "avg_price": avg_price,
                "current_price": current_price,
                "previous_close": previous_close,
                "day_change": day_change,
                "day_change_percent": day_change_percent,
                "day_result": day_result,
                "cost_basis": cost_basis,
                "current_value": current_value,
                "profit_loss": profit_loss,
                "profit_loss_percent": profit_loss_percent,
                "source": source,
                "date": ref_date.isoformat()
            })

    # Apply conversion using ForexService
    for pos in active_positions:
        asset_currency = pos.get("currency")
        if asset_currency == base_currency:
            continue
            
        # Convertir todos los valores monetarios
        rate = await forex_service.get_exchange_rate(asset_currency, base_currency, ref_date, db)
        
        if rate and rate != 1.0:
            pos["current_price"] *= rate
            pos["current_value"] *= rate
            pos["cost_basis"] *= rate
            pos["avg_price"] *= rate
            pos["day_result"] *= rate
            pos["profit_loss"] = pos["current_value"] - pos["cost_basis"]
            pos["profit_loss_percent"] = (pos["profit_loss"] / pos["cost_basis"] * 100) if pos["cost_basis"] > 0 else 0.0
            
            pos["converted"] = True
            pos["original_currency"] = asset_currency
            pos["exchange_rate"] = rate
            pos["currency"] = base_currency
        elif asset_currency != base_currency:
             pos["conversion_error"] = f"Missing rate for {asset_currency}->{base_currency}"
    
    return active_positions



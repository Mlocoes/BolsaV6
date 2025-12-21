from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from collections import defaultdict
import datetime
import logging

from app.models.transaction import Transaction, TransactionType
from app.models.quote import Quote
from app.models.asset import Asset, AssetType
from app.models.user import User
from app.schemas.dashboard import DashboardStats, PerformancePoint, MonthlyValue, AssetAllocation
from app.services.forex_service import forex_service

# Configure logger
logger = logging.getLogger(__name__)

class DashboardService:
    async def get_stats(
        self, 
        portfolio_id: str, 
        year: int, 
        user_id: str,
        db: AsyncSession
    ) -> DashboardStats:
        logger.info(f"Dashboard stats requested for portfolio {portfolio_id}, year {year}")
        try:
            # 0. Obtener moneda base del usuario
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            base_currency = user.base_currency if user else "EUR"
            logger.info(f"Using base currency: {base_currency}")
            
            # 1. Fetch all transactions (ordered by date)
            result = await db.execute(
                select(Transaction)
                .where(Transaction.portfolio_id == portfolio_id)
                .order_by(Transaction.transaction_date)
            )
            transactions = result.scalars().all()
            logger.info(f"Found {len(transactions)} transactions")

            # 2. Identify unique assets
            asset_ids = list(set(t.asset_id for t in transactions))
            
            # Handle empty portfolio case
            if not asset_ids:
                return DashboardStats(
                    performance_history=[],
                    monthly_values=[],
                    asset_allocation=[],
                    total_value=0.0,
                    total_invested=0.0,
                    total_pl=0.0,
                    total_pl_percentage=0.0
                )
            
            # 3. Fetch Asset details
            assets_result = await db.execute(select(Asset).where(Asset.id.in_(asset_ids)))
            assets = {str(a.id): a for a in assets_result.scalars().all()}
            
            # 4. Fetch Quotes
            start_date = datetime.date(year, 1, 1)
            end_date = datetime.date(year, 12, 31)
            today = datetime.date.today()
            if end_date > today:
                end_date = today

            quotes_result = await db.execute(
                select(Quote)
                .where(
                    and_(
                        Quote.asset_id.in_(asset_ids),
                        Quote.date >= start_date,
                        Quote.date <= end_date
                    )
                )
                .order_by(Quote.date)
            )
            quotes = quotes_result.scalars().all()
            logger.info(f"Found {len(quotes)} quotes")
            
            # Organize quotes: asset_id -> date -> close_price
            quotes_map: Dict[str, Dict[date, float]] = defaultdict(dict)
            for q in quotes:
                # q.date is datetime with timezone, convert to date
                q_date = q.date.date()
                quotes_map[str(q.asset_id)][q_date] = float(q.close)

            # 6. Calculate Performance History
            performance_history: List[PerformancePoint] = []
            monthly_map: Dict[str, float] = {}
            
            # State
            current_holdings: Dict[str, float] = defaultdict(float) # asset_id -> quantity
            
            # Filter transactions
            initial_transactions = [t for t in transactions if t.transaction_date.date() < start_date]
            year_transactions = [t for t in transactions if start_date <= t.transaction_date.date() <= end_date]
            
            # Initial State Calculation
            for t in initial_transactions:
                self._apply_transaction(t, current_holdings)
                
            # Re-map transactions by date for easy lookup during loop
            tx_by_date = defaultdict(list)
            for t in year_transactions:
                tx_by_date[t.transaction_date.date()].append(t)
                
            current_date = start_date
            last_known_prices: Dict[str, float] = {} # asset_id -> price
            
            # Loop through days
            while current_date <= end_date:
                # Process transactions for today
                day_txs = tx_by_date.get(current_date, [])
                for tx in day_txs:
                    self._apply_transaction(tx, current_holdings)
                
                # Update last known prices
                for aid in asset_ids:
                    aid_str = str(aid)
                    if current_date in quotes_map[aid_str]:
                        last_known_prices[aid_str] = quotes_map[aid_str][current_date]
                
                # Calculate Total Value (con conversión de moneda)
                day_value = 0.0
                
                for aid, qty in current_holdings.items():
                    if qty != 0: 
                        price = last_known_prices.get(aid, 0.0)
                        asset_obj = assets.get(aid)
                        
                        if asset_obj and price > 0:
                            # Valor en moneda del activo
                            value_in_asset_currency = float(qty) * price
                            
                            # Convertir a moneda base del usuario
                            converted_value = await forex_service.convert_value(
                                value_in_asset_currency,
                                asset_obj.currency,
                                base_currency,
                                current_date,
                                db
                            )
                            day_value += converted_value
                        else:
                            # Fallback sin conversión
                            day_value += float(qty) * price
                
                performance_history.append(PerformancePoint(
                    date=current_date,
                    value=round(day_value, 2),
                    invested=0.0 # Placeholder
                ))
                
                # End of month check
                if current_date.month != (current_date + timedelta(days=1)).month or current_date == end_date:
                    month_key = current_date.strftime("%Y-%m")
                    monthly_map[month_key] = round(day_value, 2)
                    
                current_date += timedelta(days=1)
                
            # 7. Convert Monthly Map to List
            monthly_values = [MonthlyValue(month=k, value=v) for k, v in monthly_map.items()]
            
            # 8. Asset Allocation (Current State) - con conversión de moneda
            allocation: List[AssetAllocation] = []
            total_value = 0.0
            
            for aid, qty in current_holdings.items():
                if qty > 0.000001: # Show only positive holdings (ignore dust)
                    aid_str = str(aid)
                    price = last_known_prices.get(aid_str, 0.0)
                    asset_obj = assets.get(aid_str)
                    
                    if asset_obj and price > 0:
                        # Valor en moneda del activo
                        value_in_asset_currency = float(qty) * price
                        
                        # Convertir a moneda base del usuario
                        asset_val = await forex_service.convert_value(
                            value_in_asset_currency,
                            asset_obj.currency,
                            base_currency,
                            end_date,  # Usar última fecha del año
                            db
                        )
                    else:
                        # Fallback sin conversión
                        asset_val = float(qty) * price
                    
                    total_value += asset_val
                    
                    name = asset_obj.name if asset_obj else "Unknown"
                    symbol = asset_obj.symbol if asset_obj else "???"
                    # Convert Enum to string safely
                    atype = asset_obj.asset_type if asset_obj else "Unknown"
                    if hasattr(atype, 'value'):
                        atype = atype.value
                    
                    allocation.append(AssetAllocation(
                        symbol=symbol,
                        name=name,
                        value=round(asset_val, 2),
                        percentage=0.0,
                        type=str(atype)
                    ))
            
            # Calculate percentages
            if total_value > 0:
                for item in allocation:
                    item.percentage = round((item.value / total_value) * 100, 2)
                    
            # Calculate Total Invested (Cost Basis approximation) - con conversión
            cost_basis_map = defaultdict(float) # asset_id -> total_cost
            current_holdings_replay = defaultdict(float) 
            avg_price_map = defaultdict(float)
            
            for t in transactions:
                aid = str(t.asset_id)
                qty = float(t.quantity)
                price = float(t.price)
                fees = float(t.fees or 0.0)
                
                if t.transaction_type == TransactionType.BUY:
                    old_qty = current_holdings_replay[aid]
                    new_qty = old_qty + qty
                    current_cost = avg_price_map[aid] * old_qty
                    new_cost = current_cost + (qty * price) + fees
                    if new_qty > 0:
                        avg_price_map[aid] = new_cost / new_qty
                    current_holdings_replay[aid] = new_qty
                    
                elif t.transaction_type == TransactionType.SELL:
                    current_holdings_replay[aid] -= qty
            
            real_total_invested = 0.0
            for aid, qty in current_holdings_replay.items():
                if qty > 0.000001:
                    cost_in_asset_currency = qty * avg_price_map[aid]
                    asset_obj = assets.get(aid)
                    
                    if asset_obj:
                        # Convertir costo a moneda base del usuario
                        converted_cost = await forex_service.convert_value(
                            cost_in_asset_currency,
                            asset_obj.currency,
                            base_currency,
                            end_date,  # Usar última fecha del año
                            db
                        )
                        real_total_invested += converted_cost
                    else:
                        # Fallback sin conversión
                        real_total_invested += cost_in_asset_currency
                    
            total_pl = total_value - real_total_invested
            total_pl_percentage = (total_pl / real_total_invested * 100) if real_total_invested > 0 else 0.0

            return DashboardStats(
                performance_history=performance_history,
                monthly_values=monthly_values,
                asset_allocation=sorted(allocation, key=lambda x: x.value, reverse=True),
                total_value=round(total_value, 2),
                total_invested=round(real_total_invested, 2),
                total_pl=round(total_pl, 2),
                total_pl_percentage=round(total_pl_percentage, 2)
            )
        except Exception as e:
            logger.error(f"Error in get_stats: {e}", exc_info=True)
            print(f"CRITICAL ERROR in get_stats: {e}") # Ensure it prints to stdout
            import traceback
            traceback.print_exc()
            raise e

    def _apply_transaction(self, t: Transaction, holdings: Dict[str, float]):
        aid = str(t.asset_id)
        qty = float(t.quantity)
        if t.transaction_type == TransactionType.BUY:
            holdings[aid] += qty
        elif t.transaction_type == TransactionType.SELL:
            holdings[aid] -= qty

dashboard_service = DashboardService()


from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class PerformancePoint(BaseModel):
    date: date
    value: float
    invested: float  # Capital invertido (coste base)

class MonthlyValue(BaseModel):
    month: str  # Format: "YYYY-MM"
    value: float

class AssetAllocation(BaseModel):
    symbol: str
    name: str
    value: float
    percentage: float
    type: str  # e.g., "Stock", "ETF", "Cash"

class DashboardStats(BaseModel):
    performance_history: List[PerformancePoint]
    monthly_values: List[MonthlyValue]
    asset_allocation: List[AssetAllocation]
    total_value: float
    total_invested: float
    total_pl: float  # Profit/Loss
    total_pl_percentage: float

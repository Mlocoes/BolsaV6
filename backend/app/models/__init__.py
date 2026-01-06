"""
Inicialización de modelos
"""
from app.core.database import Base
from app.models.user import User
from app.models.asset import Asset, AssetType
from app.models.quote import Quote
from app.models.portfolio import Portfolio
from app.models.transaction import Transaction, TransactionType
from app.models.result import Result
from app.models.market import Market
from app.models.system_setting import SystemSetting

__all__ = [
    "Base",
    "User",
    "Asset",
    "AssetType",
    "Quote",
    "Portfolio",
    "Transaction",
    "TransactionType",
    "Result",
    "Market",
    "SystemSetting",
]

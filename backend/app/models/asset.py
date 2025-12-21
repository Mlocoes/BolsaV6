"""
Modelo de Activo (Valores: acciones, fondos, etc)
"""
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class AssetType(str, enum.Enum):
    """Tipos de activos"""
    STOCK = "stock"  # Acción
    ETF = "etf"      # Fondo cotizado
    FUND = "fund"    # Fondo de inversión
    CRYPTO = "crypto"  # Criptomoneda
    BOND = "bond"    # Bono
    CURRENCY = "currency" # Moneda
    OTHER = "other"  # Otro


class Asset(Base):
    """Tabla de activos/valores financieros"""
    __tablename__ = "assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), unique=True, nullable=False, index=True)  # Ticker
    name = Column(String(255), nullable=False)
    asset_type = Column(SQLEnum(AssetType, native_enum=False), nullable=False, default=AssetType.STOCK)
    currency = Column(String(10), default="USD", nullable=False)
    market = Column(String(50))  # Ej: NASDAQ, NYSE, etc
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    quotes = relationship("Quote", back_populates="asset", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="asset")
    
    def __repr__(self):
        return f"<Asset {self.symbol} - {self.name}>"

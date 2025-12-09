"""
Modelo de Transacción (Operaciones)
"""
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """Tipos de transacciones"""
    BUY = "buy"      # Compra
    SELL = "sell"    # Venta


class Transaction(Base):
    """Tabla de transacciones/operaciones"""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    transaction_date = Column(DateTime(timezone=True), nullable=False, index=True)
    quantity = Column(Numeric(18, 6), nullable=False)
    price = Column(Numeric(18, 6), nullable=False)
    fees = Column(Numeric(18, 6), default=0.0)
    notes = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    portfolio = relationship("Portfolio", back_populates="transactions")
    asset = relationship("Asset", back_populates="transactions")
    
    # Índices
    __table_args__ = (
        Index('idx_transaction_portfolio_date', 'portfolio_id', 'transaction_date'),
    )
    
    def __repr__(self):
        return f"<Transaction {self.transaction_type} {self.quantity} {self.asset_id}>"

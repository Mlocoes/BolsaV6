"""
Modelo de Cotización (Precios históricos)
"""
from sqlalchemy import Column, DateTime, Numeric, BigInteger, ForeignKey, Index, UniqueConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Quote(Base):
    """Tabla de cotizaciones históricas (OHLCV)"""
    __tablename__ = "quotes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # OHLCV - Open, High, Low, Close, Volume
    open = Column(Numeric(18, 6), nullable=False)
    high = Column(Numeric(18, 6), nullable=False)
    low = Column(Numeric(18, 6), nullable=False)
    close = Column(Numeric(18, 6), nullable=False)
    volume = Column(BigInteger, nullable=True)
    
    # Metadata
    source = Column(String(50), default="alpha_vantage")  # Fuente de datos
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relaciones
    asset = relationship("Asset", back_populates="quotes")
    
    # Constraints e índices
    __table_args__ = (
        UniqueConstraint('asset_id', 'date', name='uq_quote_asset_date'),
        Index('idx_quote_asset_date', 'asset_id', 'date'),
    )
    
    def __repr__(self):
        return f"<Quote {self.asset_id} {self.date} close={self.close}>"

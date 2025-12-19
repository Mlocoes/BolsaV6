"""
Modelo de Mercado / Bolsa de Valores
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Market(Base):
    """Tabla de mercados financieros (bolsas)"""
    __tablename__ = "markets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)  # Ej: NASDAQ, CONTINUO, XETRA
    currency = Column(String(10), nullable=False) # Ej: USD, EUR, GBP
    country = Column(String(100)) # Ej: USA, ESPAÑA, ALEMANIA
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Market {self.name} ({self.currency})>"

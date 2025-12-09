"""
Modelo de Resultado (Snapshots diarios de posiciones)
"""
from sqlalchemy import Column, Date, DateTime, Numeric, ForeignKey, Index, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Result(Base):
    """Tabla de resultados diarios (snapshots de posiciones)"""
    __tablename__ = "results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Valores totales del portfolio
    total_value = Column(Numeric(18, 2), nullable=False)  # Valor total actual
    invested_value = Column(Numeric(18, 2), nullable=False)  # Valor invertido (costo)
    profit_loss = Column(Numeric(18, 2), nullable=False)  # Ganancia/Pérdida
    profit_loss_percent = Column(Numeric(10, 4), nullable=False)  # Porcentaje
    
    # Detalle de posiciones en JSON
    # Formato: [{"asset_id": "...", "symbol": "...", "quantity": 100, "avg_price": 50.0, "current_price": 55.0, ...}]
    positions_snapshot = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relaciones
    portfolio = relationship("Portfolio", back_populates="results")
    
    # Constraints e índices
    __table_args__ = (
        UniqueConstraint('portfolio_id', 'date', name='uq_result_portfolio_date'),
        Index('idx_result_portfolio_date', 'portfolio_id', 'date'),
    )
    
    def __repr__(self):
        return f"<Result {self.portfolio_id} {self.date} P/L={self.profit_loss}>"

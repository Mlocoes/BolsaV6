from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field
from app.models.transaction import TransactionType

class FiscalOperation(BaseModel):
    """
    Representa una operación normalizada para el cálculo fiscal.
    Se construye a partir de una Transaction de la BD.
    """
    id: str  # UUID as string
    date: datetime
    type: TransactionType
    asset_id: str
    asset_symbol: str
    quantity: Decimal
    price: Decimal
    fees: Decimal
    
    class Config:
        from_attributes = True

class FiscalResultItem(BaseModel):
    """
    Resultado fiscal de una venta (o parte de ella).
    """
    asset_symbol: str
    quantity_sold: Decimal
    
    # Datos de la venta
    sale_date: datetime
    sale_price: Decimal
    sale_fees: Decimal
    sale_value: Decimal  # (qty * price) - fees
    
    # Datos de la compra (origen FIFO)
    acquisition_date: datetime
    acquisition_price: Decimal
    acquisition_fees: Decimal
    acquisition_value: Decimal # (qty * price) + fees
    
    # Resultados
    gross_result: Decimal # sale_value - acquisition_value
    days_held: int
    
    # Reglas especiales
    is_wash_sale: bool = False
    wash_sale_disallowed_loss: Decimal = Decimal(0)
    
    notes: Optional[str] = None

class FiscalYearSummary(BaseModel):
    """
    Resumen fiscal por año.
    """
    year: int
    total_gains: Decimal = Decimal(0)
    total_losses: Decimal = Decimal(0)
    net_result: Decimal = Decimal(0)
    
    # Operaciones detalladas que componen este resumen
    items: List[FiscalResultItem] = []
    
    # Operaciones pendientes de compensar (por wash sale)
    pending_wash_sales: List[FiscalResultItem] = []

class FiscalReport(BaseModel):
    """
    Informe fiscal completo para un portfolio.
    """
    portfolio_id: str
    generated_at: datetime = Field(default_factory=datetime.now)
    years: List[FiscalYearSummary] = []

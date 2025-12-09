"""
Schemas Pydantic para Quote
"""
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID


class QuoteResponse(BaseModel):
    """Schema para respuesta de cotización"""
    id: UUID
    asset_id: UUID
    date: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int
    source: str
    
    class Config:
        from_attributes = True

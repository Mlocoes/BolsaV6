"""
Schemas Pydantic para Transaction
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    """Base para Transaction"""
    asset_id: UUID
    transaction_type: TransactionType
    transaction_date: datetime
    quantity: Decimal = Field(..., gt=0)
    price: Decimal = Field(..., gt=0)
    fees: Decimal = Field(default=Decimal("0.0"), ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class TransactionCreate(TransactionBase):
    """Schema para crear transacción"""
    pass


class TransactionUpdate(BaseModel):
    """Schema para actualizar transacción"""
    transaction_type: Optional[TransactionType] = None
    transaction_date: Optional[datetime] = None
    quantity: Optional[Decimal] = Field(None, gt=0)
    price: Optional[Decimal] = Field(None, gt=0)
    fees: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class TransactionResponse(TransactionBase):
    """Schema para respuesta de transacción"""
    id: UUID
    portfolio_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

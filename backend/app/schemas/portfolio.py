"""
Schemas Pydantic para Portfolio
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class PortfolioBase(BaseModel):
    """Base para Portfolio"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class PortfolioCreate(PortfolioBase):
    """Schema para crear cartera"""
    pass


class PortfolioUpdate(BaseModel):
    """Schema para actualizar cartera"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class PortfolioResponse(PortfolioBase):
    """Schema para respuesta de cartera"""
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

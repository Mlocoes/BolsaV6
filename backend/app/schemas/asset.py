"""
Schemas Pydantic para Asset
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.asset import AssetType


class AssetBase(BaseModel):
    """Base para Asset"""
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)
    asset_type: AssetType
    currency: str = Field(default="USD", max_length=10)
    market: Optional[str] = Field(None, max_length=50)


class AssetCreate(AssetBase):
    """Schema para crear activo"""
    pass


class AssetUpdate(BaseModel):
    """Schema para actualizar activo"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    asset_type: Optional[AssetType] = None
    currency: Optional[str] = Field(None, max_length=10)
    market: Optional[str] = Field(None, max_length=50)


class AssetResponse(AssetBase):
    """Schema para respuesta de activo"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

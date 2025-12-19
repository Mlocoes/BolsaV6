from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class MarketBase(BaseModel):
    name: str
    currency: str
    country: Optional[str] = None


class MarketCreate(MarketBase):
    pass


class MarketUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    country: Optional[str] = None


class MarketResponse(MarketBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

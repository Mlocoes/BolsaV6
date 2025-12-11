"""
Schemas Pydantic para User
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re


class UserBase(BaseModel):
    """Base para User"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validar email permitiendo .local para desarrollo"""
        # Patrón básico de email
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        # Permitir también .local para desarrollo
        pattern_local = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.local$'
        
        if not (re.match(pattern, v) or re.match(pattern_local, v)):
            raise ValueError('Email inválido')
        return v.lower()


class UserCreate(UserBase):
    """Schema para crear usuario"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema para actualizar usuario"""
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validar email permitiendo .local para desarrollo"""
        if v is None:
            return v
        
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        pattern_local = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.local$'
        
        if not (re.match(pattern, v) or re.match(pattern_local, v)):
            raise ValueError('Email inválido')
        return v.lower()


class UserResponse(UserBase):
    """Schema para respuesta de usuario"""
    id: UUID
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema para login"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Schema para respuesta de login"""
    user: UserResponse
    message: str = "Login exitoso"

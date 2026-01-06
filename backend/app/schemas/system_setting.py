from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any

class SystemSettingBase(BaseModel):
    key: str = Field(..., description="Clave única del parámetro de configuración")
    value: str = Field(..., description="Valor del parámetro (almacenado como texto)")
    description: Optional[str] = Field(None, description="Descripción del propósito del parámetro")
    type: str = Field("string", description="Tipo de dato para conversión (string, int, float, bool, json)")

class SystemSettingUpdate(BaseModel):
    value: str = Field(..., description="Nuevo valor para el parámetro")

class SystemSetting(SystemSettingBase):
    updated_at: datetime

    class Config:
        from_attributes = True

# Comentario explicativo: Esquemas Pydantic para la validación y serialización de configuraciones del sistema.

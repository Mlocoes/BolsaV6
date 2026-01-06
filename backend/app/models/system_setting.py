from sqlalchemy import Column, String, Text, DateTime, func
from app.core.database import Base

class SystemSetting(Base):
    """
    Modelo para parámetros de configuración global del sistema
    """
    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    type = Column(String(20), default="string")  # string, int, float, bool, json
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())

    # Comentario explicativo: Este modelo almacena configuraciones clave-valor para el comportamiento global de la aplicación.

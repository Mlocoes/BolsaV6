"""
Configuración de la aplicación
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configuración de la aplicación desde variables de entorno"""
    
    # Base de datos
    DATABASE_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # Redis
    REDIS_URL: str
    
    # Seguridad
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    SESSION_EXPIRE_MINUTES: int = 480
    SECURE_COOKIES: bool = False
    
    # Alpha Vantage
    ALPHA_VANTAGE_API_KEY: str
    ALPHA_VANTAGE_RATE_LIMIT: int = 5
    QUOTE_UPDATE_INTERVAL_MINUTES: int = 60
    
    # Admin user
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@bolsav6.local"
    ADMIN_PASSWORD: str = "admin123"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convertir CORS_ORIGINS string a lista"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

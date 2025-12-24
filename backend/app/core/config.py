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
    
    # Alpha Vantage (Deprecated - use Polygon.io instead)
    ALPHA_VANTAGE_API_KEY: str
    ALPHA_VANTAGE_RATE_LIMIT: int = 5
    
    # Polygon.io (Reemplazo de Alpha Vantage para históricos)
    POLYGON_API_KEY: str
    
    # Finnhub (Cotizaciones en tiempo real)
    FINNHUB_API_KEY: str
    QUOTE_UPDATE_INTERVAL_MINUTES: int = 60
    
    # Admin user
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@bolsav6.local"
    ADMIN_PASSWORD: str = "admin123"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """
        Convertir CORS_ORIGINS string a lista
        En desarrollo, permite todos los orígenes en red local
        """
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        
        # En desarrollo, agregar patrones comunes automáticamente
        if self.ENVIRONMENT == "development":
            # Patrones para desarrollo local y red local
            development_patterns = [
                "http://localhost:3000",
                "http://localhost:5173",  # Vite dev
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
            ]
            # Agregar solo si no están ya
            for pattern in development_patterns:
                if pattern not in origins:
                    origins.append(pattern)
        
        return origins
    
    @property
    def is_cors_permissive(self) -> bool:
        """En desarrollo, permitir cualquier origen de red local"""
        return self.ENVIRONMENT == "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

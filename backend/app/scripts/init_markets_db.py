"""
Script para crear la tabla de mercados si no existe
"""
import asyncio
import sys
import os

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.database import engine, Base
from app.models.market import Market  # Importar para que SQLAlchemy lo reconozca

async def init_db():
    print("🚀 Creando tablas en la base de datos...")
    async with engine.begin() as conn:
        # Esto creará solo las tablas que no existan
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tablas creadas correctamente")

if __name__ == "__main__":
    asyncio.run(init_db())

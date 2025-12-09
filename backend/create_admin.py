"""
Script para crear usuario administrador inicial
"""
import asyncio
from uuid import uuid4
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy import select


async def create_admin():
    """Crear usuario administrador si no existe"""
    async with AsyncSessionLocal() as db:
        # Verificar si ya existe
        result = await db.execute(
            select(User).where(User.username == "admin")
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print(f"✓ Usuario admin ya existe")
            return
        
        # Crear usuario admin
        admin = User(
            id=uuid4(),
            username="admin",
            email="admin@bolsav6.com",
            hashed_password=hash_password("admin123_change_me"),
            is_active=True,
            is_admin=True
        )
        
        db.add(admin)
        await db.commit()
        
        print(f"✓ Usuario admin creado:")
        print(f"  Username: admin")
        print(f"  Email: admin@bolsav6.com")
        print(f"  Password: admin123_change_me")
        print(f"\n⚠️  CAMBIA LA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN")


if __name__ == "__main__":
    asyncio.run(create_admin())

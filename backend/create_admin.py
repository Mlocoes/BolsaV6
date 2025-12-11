#!/usr/bin/env python3
"""
Script para crear usuario administrador inicial
BolsaV6 - Sistema de Gestión de Carteras de Inversión
"""
import asyncio
import sys
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from app.core.config import settings


async def create_admin_user():
    """Crear usuario administrador si no existe"""
    print("=" * 60)
    print("BolsaV6 - Creación de Usuario Administrador")
    print("=" * 60)
    print()
    
    async with AsyncSessionLocal() as db:
        try:
            # Verificar si el usuario admin ya existe
            result = await db.execute(
                select(User).where(User.username == settings.ADMIN_USERNAME)
            )
            admin = result.scalar_one_or_none()
            
            if admin:
                print(f"ℹ️  El usuario administrador '{settings.ADMIN_USERNAME}' ya existe.")
                print(f"   Email: {admin.email}")
                print(f"   Activo: {'Sí' if admin.is_active else 'No'}")
                print(f"   Admin: {'Sí' if admin.is_admin else 'No'}")
                print()
                print("💡 Para cambiar la contraseña, elimine el usuario y vuelva a ejecutar este script.")
                return
            
            # Crear nuevo usuario administrador
            new_admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True,
                is_active=True
            )
            
            db.add(new_admin)
            await db.commit()
            await db.refresh(new_admin)
            
            print("✅ Usuario administrador creado exitosamente!")
            print()
            print("Credenciales:")
            print(f"   Usuario: {settings.ADMIN_USERNAME}")
            print(f"   Email: {settings.ADMIN_EMAIL}")
            print(f"   Contraseña: {settings.ADMIN_PASSWORD}")
            print()
            print("⚠️  IMPORTANTE: Cambie la contraseña después del primer inicio de sesión.")
            print()
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error al crear usuario administrador: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """Función principal"""
    try:
        asyncio.run(create_admin_user())
    except KeyboardInterrupt:
        print("\n\n⚠️  Operación cancelada por el usuario.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

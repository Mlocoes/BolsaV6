#!/usr/bin/env python3
"""
Orquestador de Configuración de Datos Iniciales
BolsaV6 - Sistema de Gestión de Carteras de Inversión

Este script ejecuta secuencialmente:
1. Creación de usuario administrador
2. Poblado de tabla de mercados
3. Poblado de activos tipo moneda (Forex)
"""
import asyncio
import sys
import os

# Añadir el directorio raíz al path para poder importar los módulos de la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

# Importar las funciones de seeding
# Nota: Importamos aquí para evitar problemas de path antes de tiempo
try:
    from create_admin import create_admin_user
    from app.scripts.seed_markets import seed_markets
    from app.scripts.seed_currency_pairs import seed_currency_pairs
except ImportError as e:
    print(f"❌ Error al importar scripts de configuración: {e}")
    sys.exit(1)

async def run_setup():
    print("🚀 Iniciando configuración de datos maestros...")
    print("=" * 60)

    try:
        # 1. Crear Administrador
        print("\n[1/3] Configurando usuario administrador...")
        await create_admin_user()

        # 2. Poblar Mercados
        print("\n[2/3] Configurando mercados...")
        await seed_markets()

        # 3. Poblar Pares de Monedas
        print("\n[3/3] Configurando pares de divisas (Forex)...")
        await seed_currency_pairs()

        print("\n" + "=" * 60)
        print("✅ Configuración de datos completada exitosamente!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error crítico durante la configuración: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(run_setup())
    except KeyboardInterrupt:
        print("\n\n⚠️  Operación cancelada por el usuario.")
        sys.exit(1)

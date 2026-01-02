"""
Servicio de Backup y Restore
"""
import subprocess
import os
import json
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.config import settings
from app.models.transaction import Transaction
from app.models.portfolio import Portfolio
from app.schemas.transaction import TransactionCreate

class BackupService:
    
    @staticmethod
    def _get_pg_env():
        """Configurar variables de entorno para pg_dump/pg_restore"""
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.POSTGRES_PASSWORD
        return env

    @staticmethod
    async def backup_full(output_path: str):
        """
        Realizar backup completo de la base de datos usando pg_dump
        """
        cmd = [
            "pg_dump",
            "-h", "db",  # Nombre del servicio en docker-compose
            "-U", settings.POSTGRES_USER,
            "-d", settings.POSTGRES_DB,
            "-F", "c",  # Formato Custom (comprimido y flexible)
            "-f", output_path
        ]
        
        process = subprocess.run(
            cmd, 
            env=BackupService._get_pg_env(), 
            capture_output=True, 
            text=True
        )
        
        if process.returncode != 0:
            raise Exception(f"Error en backup completo: {process.stderr}")
            
        return output_path

    @staticmethod
    async def restore_full(input_path: str):
        """
        Restaurar backup completo usando pg_restore
        """
        # pg_restore con -c (clean) para borrar objetos antes de crear
        cmd = [
            "pg_restore",
            "-h", "db",
            "-U", settings.POSTGRES_USER,
            "-d", settings.POSTGRES_DB,
            "-c",  # Clean (drop objects before creating)
            "--if-exists",
            "-F", "c",
            input_path
        ]
        
        process = subprocess.run(
            cmd, 
            env=BackupService._get_pg_env(), 
            capture_output=True, 
            text=True
        )
        
        # pg_restore puede devolver warnings (exit code 1) que no son errores fatales
        # pero exit code > 1 suele ser error.
        if process.returncode > 1:
            raise Exception(f"Error en restore completo: {process.stderr}")

    @staticmethod
    async def backup_quotes(output_path: str):
        """
        Realizar backup solo de la tabla de cotizaciones (quotes)
        """
        cmd = [
            "pg_dump",
            "-h", "db",
            "-U", settings.POSTGRES_USER,
            "-d", settings.POSTGRES_DB,
            "-t", "quotes",  # Solo tabla quotes
            "-F", "c",
            "-f", output_path
        ]
        
        process = subprocess.run(
            cmd, 
            env=BackupService._get_pg_env(), 
            capture_output=True, 
            text=True
        )
        
        if process.returncode != 0:
            raise Exception(f"Error en backup de cotizaciones: {process.stderr}")
            
        return output_path

    @staticmethod
    async def restore_quotes(input_path: str):
        """
        Restaurar tabla de cotizaciones
        """
        # Usamos -a (data-only) para no tocar el esquema, y -c para limpiar datos previos
        cmd = [
            "pg_restore",
            "-h", "db",
            "-U", settings.POSTGRES_USER,
            "-d", settings.POSTGRES_DB,
            "-a", # Data only
            "-c", # Clean (TRUNCATE antes de insertar si es data-only no funciona igual, pero con -c intenta drop)
            # Nota: pg_restore -c con -a no funciona. 
            # Estrategia: pg_restore normal de la tabla. Si falla por duplicados, es un problema.
            # Mejor estrategia para quotes: Limpiar tabla manualmente y luego restaurar data.
            "-F", "c",
            input_path
        ]
        
        # Nota: Para restaurar solo datos de una tabla limpiamente, a veces es mejor truncar primero.
        # Pero pg_restore -c intenta hacer DROP TABLE, lo cual borraría la estructura.
        # Vamos a usar pg_restore con --clean --if-exists que intentará borrar la tabla y recrearla con datos.
        # Como el dump fue hecho con -t quotes, contiene la definición de la tabla si no usamos -a en el dump.
        # En backup_quotes NO usamos -a, así que tiene el CREATE TABLE.
        # Entonces restore con -c borrará la tabla y la recreará.
        
        cmd = [
            "pg_restore",
            "-h", "db",
            "-U", settings.POSTGRES_USER,
            "-d", settings.POSTGRES_DB,
            "-c", 
            "--if-exists",
            "-F", "c",
            input_path
        ]

        process = subprocess.run(
            cmd, 
            env=BackupService._get_pg_env(), 
            capture_output=True, 
            text=True
        )
        
        if process.returncode > 1:
            raise Exception(f"Error en restore de cotizaciones: {process.stderr}")

    @staticmethod
    async def backup_transactions(db: AsyncSession, portfolio_id: str) -> str:
        """
        Exportar transacciones de una cartera a JSON
        """
        # Verificar que la cartera existe
        result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if not portfolio:
            raise Exception("Cartera no encontrada")

        # Obtener transacciones
        result = await db.execute(select(Transaction).where(Transaction.portfolio_id == portfolio_id))
        transactions = result.scalars().all()
        
        # Serializar
        data = []
        for t in transactions:
            data.append({
                "transaction_type": t.transaction_type.value,
                "asset_id": str(t.asset_id),
                "quantity": float(t.quantity),
                "price": float(t.price),
                "transaction_date": t.transaction_date.isoformat(),
                "fees": float(t.fees) if t.fees else 0.0,
                "notes": t.notes
            })
            
        return json.dumps(data, indent=2)

    @staticmethod
    async def restore_transactions(db: AsyncSession, portfolio_id: str, transactions_data: List[Dict[str, Any]]):
        """
        Restaurar transacciones desde JSON
        """
        # Verificar cartera
        result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if not portfolio:
            raise Exception("Cartera no encontrada")
            
        # Eliminar transacciones existentes (Opcional: ¿queremos merge o replace? Restore suele ser replace)
        # Vamos a asumir Replace para evitar duplicados.
        await db.execute(delete(Transaction).where(Transaction.portfolio_id == portfolio_id))
        
        # Insertar nuevas
        for t_data in transactions_data:
            transaction = Transaction(
                portfolio_id=portfolio_id,
                transaction_type=t_data["transaction_type"],
                asset_id=t_data["asset_id"],
                quantity=t_data["quantity"],
                price=t_data["price"],
                transaction_date=datetime.fromisoformat(t_data["transaction_date"]),
                fees=t_data.get("fees", 0.0),
                notes=t_data.get("notes")
            )
            db.add(transaction)
            
        await db.commit()

backup_service = BackupService()

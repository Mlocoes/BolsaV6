"""
API de Importación de Transacciones desde Excel
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from decimal import Decimal
import pandas as pd
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.models.transaction import Transaction, TransactionType

router = APIRouter()


@router.post("/transactions/excel/{portfolio_id}")
async def import_transactions_from_excel(
    portfolio_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Importar transacciones desde archivo Excel.
    
    Formato esperado:
    - Fecha: Formato DD/MM/YYYY
    - Valor: Símbolo del activo (ej: TSLA)
    - Tipo de Operación: "COMPRA ACCIONES" o "VENTA ACCIONES"
    - Títulos: Cantidad de acciones
    - Precio: Precio por acción
    - Efectivo: Valor total de la operación (negativo para compras)
    - Gastos: Comisiones/gastos
    """
    # Verificar que la cartera pertenece al usuario
    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    # Validar tipo de archivo
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer el archivo Excel
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas requeridas
        required_columns = ['Fecha', 'Valor', 'Tipo de Operación', 'Títulos', 'Precio', 'Gastos']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Faltan columnas requeridas: {', '.join(missing_columns)}"
            )
        
        transactions_created = 0
        transactions_skipped = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Extraer símbolo del campo "Valor" (puede contener nombre y símbolo)
                valor_text = str(row['Valor']).strip()
                lines = valor_text.split('\n')
                symbol = None
                
                # Buscar la línea que contiene el símbolo (formato corto, todo mayúsculas)
                for line in lines:
                    line = line.strip()
                    if len(line) <= 5 and line.isupper() and line.isalpha():
                        symbol = line
                        break
                
                if not symbol:
                    errors.append(f"Fila {index + 2}: No se pudo extraer el símbolo del activo")
                    transactions_skipped += 1
                    continue
                
                # Buscar el activo por símbolo
                asset_result = await db.execute(
                    select(Asset).where(Asset.symbol == symbol)
                )
                asset = asset_result.scalar_one_or_none()
                
                if not asset:
                    errors.append(f"Fila {index + 2}: Activo '{symbol}' no encontrado. Debe importarse primero.")
                    transactions_skipped += 1
                    continue
                
                # Determinar tipo de transacción
                tipo_operacion = str(row['Tipo de Operación']).upper()
                if 'COMPRA' in tipo_operacion:
                    transaction_type = TransactionType.BUY
                elif 'VENTA' in tipo_operacion:
                    transaction_type = TransactionType.SELL
                else:
                    errors.append(f"Fila {index + 2}: Tipo de operación '{row['Tipo de Operación']}' no reconocido")
                    transactions_skipped += 1
                    continue
                
                # Parsear fecha
                fecha_str = str(row['Fecha']).strip()
                try:
                    if '/' in fecha_str:
                        transaction_date = datetime.strptime(fecha_str, '%d/%m/%Y')
                    else:
                        transaction_date = pd.to_datetime(row['Fecha'])
                except Exception as e:
                    errors.append(f"Fila {index + 2}: Fecha inválida '{fecha_str}'")
                    transactions_skipped += 1
                    continue
                
                # Extraer valores numéricos
                quantity = Decimal(str(row['Títulos']))
                price = Decimal(str(row['Precio']))
                fees = Decimal(str(row['Gastos'])) if pd.notna(row['Gastos']) else Decimal('0')
                
                # Crear transacción
                new_transaction = Transaction(
                    portfolio_id=portfolio_id,
                    asset_id=asset.id,
                    transaction_type=transaction_type,
                    transaction_date=transaction_date,
                    quantity=quantity,
                    price=price,
                    fees=fees,
                    notes=f"Importado desde Excel - {file.filename}"
                )
                
                db.add(new_transaction)
                transactions_created += 1
                
            except Exception as e:
                errors.append(f"Fila {index + 2}: Error al procesar - {str(e)}")
                transactions_skipped += 1
                continue
        
        # Guardar todas las transacciones
        await db.commit()
        
        return {
            "success": True,
            "transactions_created": transactions_created,
            "transactions_skipped": transactions_skipped,
            "errors": errors if errors else None,
            "message": f"Se importaron {transactions_created} transacciones correctamente"
        }
        
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al leer el archivo Excel: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el archivo: {str(e)}"
        )

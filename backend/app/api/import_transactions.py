"""
API de Importación de Transacciones desde Excel
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone
from decimal import Decimal
import pandas as pd
import io
import traceback

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.asset import Asset, AssetType
from app.models.transaction import Transaction, TransactionType
from app.models.quote import Quote
from app.services.alpha_vantage_service import AlphaVantageService

router = APIRouter()
alpha_vantage_service = AlphaVantageService()


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
        assets_created = 0
        corporate_transactions = 0  # Contador de operaciones corporativas
        quotes_imported = 0  # Contador de cotizaciones históricas importadas
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Extraer símbolo del campo "Valor" (puede contener nombre y símbolo)
                valor_text = str(row['Valor']).strip()
                
                # Si el valor es NaN o vacío, saltar
                if valor_text == 'nan' or not valor_text:
                    errors.append(f"Fila {index + 2}: Campo 'Valor' vacío")
                    transactions_skipped += 1
                    continue
                
                lines = valor_text.split('\n')
                symbol = None
                
                # Estrategia 1: Buscar el símbolo (formato corto, mayúsculas, puede contener números)
                for line in lines:
                    line = line.strip()
                    # Símbolo: 2-6 caracteres, mayúsculas, puede contener números (ej: TSLA, NVDA, BTC, 3M, IAG)
                    if 2 <= len(line) <= 6 and line.isupper() and line.replace(' ', '').replace('.', '').isalnum():
                        symbol = line.replace(' ', '').replace('.', '')
                        break
                
                # Estrategia 2: Si no se encontró, buscar una palabra corta en mayúsculas en cualquier línea
                if not symbol:
                    for line in lines:
                        words = line.strip().split()
                        for word in words:
                            word = word.strip().upper()
                            if 2 <= len(word) <= 6 and word.replace('.', '').isalnum():
                                symbol = word.replace('.', '')
                                break
                        if symbol:
                            break
                
                # Estrategia 3: Si sigue sin símbolo, tomar la última línea limpia
                if not symbol:
                    for line in reversed(lines):
                        line = line.strip().upper()
                        if line and len(line) <= 10:
                            # Limpiar caracteres especiales comunes
                            symbol = line.replace(' ', '').replace('.', '').replace('-', '')
                            if symbol.isalnum():
                                break
                            else:
                                symbol = None
                
                if not symbol:
                    errors.append(f"Fila {index + 2}: No se pudo extraer el símbolo del activo (valor: '{valor_text[:50]}')")
                    transactions_skipped += 1
                    continue
                
                # Buscar el activo por símbolo
                asset_result = await db.execute(
                    select(Asset).where(Asset.symbol == symbol)
                )
                asset = asset_result.scalar_one_or_none()
                
                # Si el activo no existe, crearlo automáticamente e importar cotizaciones
                if not asset:
                    # Extraer el nombre del activo del campo "Valor"
                    asset_name = lines[0].strip() if lines else symbol
                    
                    # Crear el nuevo activo
                    asset = Asset(
                        symbol=symbol,
                        name=asset_name,
                        asset_type=AssetType.STOCK,
                        currency="USD",
                        market="Unknown"
                    )
                    db.add(asset)
                    await db.flush()  # Asegurar que el activo tenga un ID antes de continuar
                    assets_created += 1
                    
                    # Importar cotizaciones históricas para el nuevo activo
                    try:
                        # Obtener cotizaciones históricas (últimos 100 días con plan gratuito)
                        historical_quotes = await alpha_vantage_service.get_historical_quotes(
                            symbol=symbol
                        )
                        
                        if historical_quotes:
                            # Insertar cotizaciones en la BD
                            asset_quotes_count = 0
                            for quote_data in historical_quotes:
                                # Verificar si la cotización ya existe
                                existing_quote = await db.execute(
                                    select(Quote).where(
                                        Quote.asset_id == asset.id,
                                        Quote.date == quote_data["date"]
                                    )
                                )
                                if not existing_quote.scalar_one_or_none():
                                    new_quote = Quote(
                                        asset_id=asset.id,
                                        date=quote_data["date"],
                                        open=quote_data["open"],
                                        high=quote_data["high"],
                                        low=quote_data["low"],
                                        close=quote_data["close"],
                                        volume=quote_data["volume"],
                                        source="alpha_vantage"
                                    )
                                    db.add(new_quote)
                                    asset_quotes_count += 1
                            
                            await db.flush()  # Guardar las cotizaciones
                            
                            if asset_quotes_count > 0:
                                quotes_imported += asset_quotes_count  # Acumular en el contador global
                                print(f"✅ {asset_quotes_count} cotizaciones históricas importadas para {symbol}")
                        else:
                            print(f"⚠️ No se pudieron obtener cotizaciones históricas para {symbol}")
                    
                    except Exception as e:
                        # Si falla la importación de cotizaciones, continuar de todos modos
                        print(f"⚠️ Error al importar cotizaciones para {symbol}: {str(e)}")
                        # No interrumpir el proceso de importación
                
                # Determinar tipo de transacción
                tipo_operacion = str(row['Tipo de Operación']).upper()
                
                # Clasificar el tipo de operación
                if 'COMPRA' in tipo_operacion or 'BUY' in tipo_operacion:
                    transaction_type = TransactionType.BUY
                elif 'VENTA' in tipo_operacion or 'SELL' in tipo_operacion:
                    transaction_type = TransactionType.SELL
                elif 'DIVIDENDO' in tipo_operacion or 'DIVIDEND' in tipo_operacion:
                    transaction_type = TransactionType.DIVIDEND
                elif 'SPLIT' in tipo_operacion:
                    transaction_type = TransactionType.SPLIT
                elif any(kw in tipo_operacion for kw in ['CAMBIO', 'ISIN', 'FUSIÓN', 'FUSION', 'SPINOFF', 'SPIN-OFF']):
                    transaction_type = TransactionType.CORPORATE
                else:
                    # Si no reconocemos el tipo, lo marcamos como corporativo genérico
                    transaction_type = TransactionType.CORPORATE
                
                # Parsear fecha
                fecha_str = str(row['Fecha']).strip()
                try:
                    if '/' in fecha_str:
                        transaction_date = datetime.strptime(fecha_str, '%d/%m/%Y')
                    else:
                        transaction_date = pd.to_datetime(row['Fecha']).to_pydatetime()
                    
                    # Agregar timezone UTC si la fecha no tiene timezone
                    if transaction_date.tzinfo is None:
                        transaction_date = transaction_date.replace(tzinfo=timezone.utc)
                except Exception as e:
                    errors.append(f"Fila {index + 2}: Fecha inválida '{fecha_str}'")
                    transactions_skipped += 1
                    continue
                
                # Extraer valores numéricos
                # Para operaciones corporativas, cantidad y precio pueden ser 0
                try:
                    quantity = abs(Decimal(str(row['Títulos']))) if pd.notna(row['Títulos']) else Decimal('0')
                except:
                    quantity = Decimal('0')
                
                try:
                    price = abs(Decimal(str(row['Precio']))) if pd.notna(row['Precio']) else Decimal('0')
                except:
                    price = Decimal('0')
                
                try:
                    fees = abs(Decimal(str(row['Gastos']))) if pd.notna(row['Gastos']) else Decimal('0')
                except:
                    fees = Decimal('0')
                
                # Crear nota descriptiva según el tipo
                note_parts = [f"Importado desde Excel - {file.filename}"]
                if transaction_type in [TransactionType.DIVIDEND, TransactionType.SPLIT, TransactionType.CORPORATE]:
                    note_parts.append(f"Operación: {row['Tipo de Operación']}")
                
                # Crear transacción
                new_transaction = Transaction(
                    portfolio_id=portfolio_id,
                    asset_id=asset.id,
                    transaction_type=transaction_type,
                    transaction_date=transaction_date,
                    quantity=quantity,
                    price=price,
                    fees=fees,
                    notes=" | ".join(note_parts)
                )
                
                db.add(new_transaction)
                transactions_created += 1
                
                # Contar operaciones corporativas
                if transaction_type in [TransactionType.DIVIDEND, TransactionType.SPLIT, TransactionType.CORPORATE]:
                    corporate_transactions += 1
                
            except Exception as e:
                errors.append(f"Fila {index + 2}: Error al procesar - {str(e)}")
                transactions_skipped += 1
                continue
        
        # Guardar todas las transacciones y activos creados
        await db.commit()
        
        # Construir mensaje de respuesta
        buy_sell_count = transactions_created - corporate_transactions
        message_parts = []
        
        if buy_sell_count > 0:
            message_parts.append(f"{buy_sell_count} transacciones de compra/venta")
        
        if corporate_transactions > 0:
            message_parts.append(f"{corporate_transactions} operaciones corporativas (splits, dividendos, etc.)")
        
        if assets_created > 0:
            message_parts.append(f"{assets_created} activos nuevos registrados")
        
        if quotes_imported > 0:
            message_parts.append(f"{quotes_imported} cotizaciones históricas importadas")
        
        main_message = f"✅ Importación completada: {', '.join(message_parts)}"
        
        if transactions_skipped > 0:
            main_message += f". Se omitieron {transactions_skipped} filas por datos inválidos"
        
        return {
            "success": True,
            "transactions_created": transactions_created,
            "buy_sell_count": buy_sell_count,
            "corporate_transactions": corporate_transactions,
            "transactions_skipped": transactions_skipped,
            "assets_created": assets_created,
            "quotes_imported": quotes_imported,
            "errors": errors if errors else None,
            "message": main_message
        }
        
    except pd.errors.ParserError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al leer el archivo Excel: {str(e)}"
        )
    except Exception as e:
        await db.rollback()
        error_detail = f"Error al procesar el archivo: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el archivo: {str(e)}"
        )

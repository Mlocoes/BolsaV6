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
import asyncio

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.asset import Asset, AssetType
from app.models.transaction import Transaction, TransactionType
from app.models.quote import Quote
from app.models.market import Market
from app.services.alpha_vantage_service import AlphaVantageService, RateLimitException
from app.services.yfinance_service import YFinanceService

router = APIRouter()
alpha_vantage_service = AlphaVantageService()
yfinance_service = YFinanceService()


@router.post("/transactions/excel/{portfolio_id}")
async def import_transactions_from_excel(
    portfolio_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Importar transacciones desde archivo Excel.
    
    NUEVO FORMATO (2025):
    Fecha	Valor	Cuenta	Tipo de Operación	Títulos	Precio	Efectivo	Gastos	Nº Operación
    
    - Valor: Campo multi-línea (Nombre, Símbolo, Mercado)
    - Fecha: Formato DD.MM.YY
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
        
        # Validar columnas requeridas (NUEVO FORMATO)
        required_columns = ['Fecha', 'Valor', 'Tipo de Operación', 'Títulos', 'Precio', 'Gastos']
        # Nota: Cuenta, Efectivo y Nº Operación se ignoran por ahora o se guardan en notas si es necesario
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Faltan columnas requeridas: {', '.join(missing_columns)}"
            )
        
        transactions_created = 0
        transactions_skipped = 0
        assets_created = 0
        limit_reached = False 
        corporate_transactions = 0  
        quotes_imported = 0  
        errors = []
        
        # Cache para no procesar el mismo activo múltiples veces en el mismo archivo
        processed_symbols_check = set()
        
        for index, row in df.iterrows():
            try:
                # 1. Extraer símbolo y nombre del campo "Valor" (NUEVO FORMATO MULTI-LÍNEA)
                valor_text = str(row['Valor']).strip()
                
                if valor_text == 'nan' or not valor_text:
                    errors.append(f"Fila {index + 2}: Campo 'Valor' vacío")
                    transactions_skipped += 1
                    continue
                
                lines = [l.strip() for l in valor_text.split('\n') if l.strip()]
                symbol = None
                asset_name = None
                market_hint = None
                
                # Palabras que NO son símbolos (mercados comunes)
                MARKET_KEYWORDS = [
                    "NASDAQ", "NYSE", "CONTINUO", "MC", "Bolsa", "NEW YORK", "STOCK", "EXCHANGE", "MERCADO",
                    "XETRA", "FRANKFURT", "PARIS", "MILAN", "AMSTERDAM", "LONDON", "LONDRES", "ESPAÑA", "SPAIN"
                ]
                
                def is_valid_symbol(s):
                    if not s: return False
                    s_up = s.upper()
                    # Evitar palabras reservadas de mercado
                    if any(kw == s_up or kw in s_up for kw in MARKET_KEYWORDS):
                        return False
                    # Un símbolo suele ser corto (1-8) y alfanumérico (puede tener punto)
                    return 1 <= len(s) <= 8 and s.replace('.', '').isalnum()

                # Heurística para el nuevo formato multi-línea
                # Ejemplo esperado:
                # Línea 0: Nombre (Ej: ALLIED GAMING & E)
                # Línea 1: Símbolo (Ej: AGAE)
                # Línea 2: Mercado (Ej: NASDAQ o XETRA)
                if len(lines) >= 2:
                    asset_name = lines[0]
                    # Probar línea 1 como símbolo
                    if is_valid_symbol(lines[1]):
                        symbol = lines[1].upper()
                    # Si línea 1 no es válida, probar línea 0
                    elif is_valid_symbol(lines[0]):
                        symbol = lines[0].upper()
                        asset_name = lines[1]
                    
                    if len(lines) >= 3:
                        market_hint = lines[2]
                
                # Fallback a búsqueda exhaustiva en todas las líneas si no se encontró
                if not symbol:
                    for line in lines:
                        clean_line = line.replace(' ', '')
                        if is_valid_symbol(clean_line):
                            symbol = clean_line.upper()
                            break
                
                if not symbol:
                    errors.append(f"Fila {index + 2}: No se pudo extraer el símbolo (valor: '{valor_text[:50]}')")
                    transactions_skipped += 1
                    continue
                
                if not asset_name:
                    asset_name = lines[0] if lines else symbol
                
                # 2. Buscar mercado en la tabla Markets usando market_hint
                market_currency = "USD"  # Default
                market_name = None
                
                if market_hint:
                    # Buscar en tabla markets (case insensitive)
                    market_result = await db.execute(
                        select(Market).where(Market.name.ilike(f"%{market_hint}%"))
                    )
                    market_obj = market_result.scalar_one_or_none()
                    
                    if market_obj:
                        market_currency = market_obj.currency
                        market_name = market_obj.name
                        print(f"💱 Mercado identificado: {market_name} → {market_currency}")
                    else:
                        print(f"⚠️ Mercado '{market_hint}' no encontrado en BD, usando USD por defecto")
                
                # 3. Normalizar símbolo según mercado (solo Yahoo Finance)
                normalized_symbol = await yfinance_service.normalize_symbol_for_market(symbol, market_hint)
                
                # 4. Buscar/Crear Activo
                asset_result = await db.execute(
                    select(Asset).where(Asset.symbol == normalized_symbol)
                )
                asset = asset_result.scalar_one_or_none()
                
                is_new_asset = False
                if not asset:
                    print(f"🔍 Creando activo: {normalized_symbol} ({asset_name})")
                    
                    # Obtener nombre oficial de Yahoo si es posible
                    try:
                        yahoo_info = await yfinance_service.get_asset_info(normalized_symbol)
                        official_name = yahoo_info.get("longName") or yahoo_info.get("shortName") or asset_name
                    except:
                        official_name = asset_name
                    
                    asset = Asset(
                        symbol=normalized_symbol,
                        name=official_name,
                        asset_type=AssetType.STOCK,
                        currency=market_currency,  # Usar moneda del mercado
                        market=market_name or market_hint
                    )
                    db.add(asset)
                    await db.flush()
                    assets_created += 1
                    is_new_asset = True
                    print(f"✨ Activo registrado: {normalized_symbol} - {asset.currency} @ {asset.market}")
                
                # 3. VERIFICACIÓN DE COTIZACIONES (DESHABILITADO TEMPORALMENTE PARA TESTS)
                """
                # Código preservado pero deshabilitado según petición del usuario
                if symbol not in processed_symbols_check and not limit_reached:
                    processed_symbols_check.add(symbol)
                    # Aquí iría la lógica de descarga...
                    pass
                """
                
                # 4. Determinar tipo de transacción
                tipo_operacion = str(row['Tipo de Operación']).upper()
                if 'COMPRA' in tipo_operacion or 'BUY' in tipo_operacion:
                    transaction_type = TransactionType.BUY
                elif 'VENTA' in tipo_operacion or 'SELL' in tipo_operacion:
                    transaction_type = TransactionType.SELL
                elif 'DIVIDENDO' in tipo_operacion or 'DIVIDEND' in tipo_operacion:
                    transaction_type = TransactionType.DIVIDEND
                elif 'SPLIT' in tipo_operacion:
                    transaction_type = TransactionType.SPLIT
                else:
                    transaction_type = TransactionType.CORPORATE
                
                # 5. Parsear fecha (NUEVO FORMATO: DD.MM.YY)
                fecha_str = str(row['Fecha']).strip()
                try:
                    if '.' in fecha_str and len(fecha_str.split('.')) == 3:
                        # Manejar DD.MM.YY o DD.MM.YYYY
                        parts = fecha_str.split('.')
                        if len(parts[2]) == 2:
                            transaction_date = datetime.strptime(fecha_str, '%d.%m.%y')
                        else:
                            transaction_date = datetime.strptime(fecha_str, '%d.%m.%Y')
                    elif '/' in fecha_str:
                        transaction_date = datetime.strptime(fecha_str, '%d/%m/%Y')
                    else:
                        transaction_date = pd.to_datetime(row['Fecha']).to_pydatetime()
                    
                    if transaction_date.tzinfo is None:
                        transaction_date = transaction_date.replace(tzinfo=timezone.utc)
                except Exception as e:
                    errors.append(f"Fila {index + 2}: Fecha inválida '{fecha_str}' ({str(e)})")
                    transactions_skipped += 1
                    continue
                
                # 6. Extraer valores numéricos
                def clean_decimal(val):
                    if pd.isna(val) or val == '': return Decimal('0')
                    if isinstance(val, (int, float, Decimal)): return Decimal(str(val))
                    # Manejar formato español: 1.234,56 -> 1234.56
                    s = str(val).replace('.', '').replace(',', '.').strip()
                    try: return Decimal(s)
                    except: return Decimal('0')

                quantity = abs(clean_decimal(row.get('Títulos', 0)))
                price = abs(clean_decimal(row.get('Precio', 0)))
                fees = abs(clean_decimal(row.get('Gastos', 0)))
                efectivo = clean_decimal(row.get('Efectivo', 0))
                
                # 7. Crear Notas (Incluir info extra del nuevo formato)
                note_parts = [f"Importado (Nuevo Formato) - {file.filename}"]
                if pd.notna(row.get('Cuenta')):
                    note_parts.append(f"Cuenta: {row['Cuenta']}")
                if pd.notna(row.get('Nº Operación')):
                    note_parts.append(f"Operación: {row['Nº Operación']}")
                if efectivo != 0:
                    note_parts.append(f"Efectivo: {efectivo}")
                
                # 8. Crear transacción
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
                
                if transaction_type in [TransactionType.DIVIDEND, TransactionType.SPLIT, TransactionType.CORPORATE]:
                    corporate_transactions += 1
                
            except Exception as e:
                errors.append(f"Fila {index + 2}: Error crítico - {str(e)}")
                transactions_skipped += 1
                continue
        
        await db.commit()
        
        # Construir mensaje de respuesta
        buy_sell_count = transactions_created - corporate_transactions
        message_parts = []
        if buy_sell_count > 0: message_parts.append(f"{buy_sell_count} compra/venta")
        if corporate_transactions > 0: message_parts.append(f"{corporate_transactions} corp.")
        if assets_created > 0: message_parts.append(f"{assets_created} activos nuevos")
        
        return {
            "success": True,
            "transactions_created": transactions_created,
            "assets_created": assets_created,
            "errors": errors if errors else None,
            "message": f"✅ Importación completada ({', '.join(message_parts)}). Cotizaciones automáticas omitidas para test."
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

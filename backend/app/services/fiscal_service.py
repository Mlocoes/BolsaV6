from typing import List, Dict, Optional
from datetime import timedelta
from decimal import Decimal
from collections import deque
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.fiscal import FiscalOperation, FiscalResultItem, FiscalReport, FiscalYearSummary
from app.models.transaction import TransactionType
from app.services.forex_service import forex_service

class PositionLot:
    """Clase auxiliar para rastrear lotes abiertos para FIFO."""
    def __init__(self, op: FiscalOperation, quantity: Decimal):
        self.op = op
        self.remaining_quantity = quantity

class FiscalService:
    async def calculate_fiscal_impact(
        self, 
        portfolio_id: str, 
        operations: List[FiscalOperation],
        target_currency: str = "EUR",
        db: Optional[AsyncSession] = None
    ) -> FiscalReport:
        # Pre-procesamiento: Conversión de divisas si es necesario
        if db:
            print(f"DEBUG: Starting currency conversion. Target: {target_currency}")
            for op in operations:
                if op.asset_currency and op.asset_currency != target_currency:
                    # Convertir a moneda objetivo usando fecha de operación
                    try:
                        rate = await forex_service.get_exchange_rate(
                            op.asset_currency, 
                            target_currency, 
                            op.date.date(), 
                            db
                        )
                        # DEBUG
                        # print(f"DEBUG: Converting {op.asset_symbol} {op.date.date()} USD->EUR Rate: {rate}")
                        
                        if rate:
                            # Guardamos los originales si aún no se han rellenado en la creación
                            # Aunque ya lo hicimos en el API, nos aseguramos aquí
                            if op.original_price is None:
                                op.original_price = op.price
                                op.original_fees = op.fees

                            op.price = op.price * Decimal(str(rate))
                            op.fees = op.fees * Decimal(str(rate))
                            # op.asset_currency = target_currency # No cambiamos la etiqueta para mantener rastro, pero los valores ya están convertidos
                    except Exception as e:
                        print(f"Error converting currency for fiscal report: {e}")

        # 1. Ordenar operaciones cronológicamente
        ops = sorted(operations, key=lambda x: x.date)
        
        # Estructuras de estado
        open_positions: Dict[str, deque[PositionLot]] = {} # asset_id -> Queue of lots
        results: List[FiscalResultItem] = []
        # Mapa para rastrear consumo de lotes (buy_id -> quantity_sold)
        buy_consumption_map = {}
        
        # 2. Procesar FIFO
        for op in ops:
            if op.type == TransactionType.BUY:
                self._process_buy(op, open_positions)
            elif op.type == TransactionType.SELL:
                sale_results = self._process_sell(op, open_positions, buy_consumption_map)
                results.extend(sale_results)
                
        # 3. Aplicar Regla de los 2 Meses (Wash Sales)
        self._apply_wash_sale_rules(results, ops, buy_consumption_map)
        
        # 4. Agrupar por años
        report = self._build_report(portfolio_id, results)
        return report

    def _process_buy(self, op: FiscalOperation, open_positions: Dict[str, deque[PositionLot]]):
        if op.asset_id not in open_positions:
            open_positions[op.asset_id] = deque()
        
        # Agregar nuevo lote
        lot = PositionLot(op, op.quantity)
        open_positions[op.asset_id].append(lot)

    def _process_sell(self, op: FiscalOperation, open_positions: Dict[str, deque[PositionLot]], buy_consumption_map: Dict[str, Decimal]) -> List[FiscalResultItem]:
        results = []
        quantity_to_sell = op.quantity
        
        if op.asset_id not in open_positions or not open_positions[op.asset_id]:
            return [] # Venta al descubierto

        lots = open_positions[op.asset_id]
        
        while quantity_to_sell > 0 and lots:
            current_lot = lots[0] # FIFO: primer elemento
            
            matched_qty = min(quantity_to_sell, current_lot.remaining_quantity)
            
            # Registrar consumo del lote
            # buy_id = current_lot.op.id (o hash si es simulado)
            buy_id = getattr(current_lot.op, 'id', str(id(current_lot.op)))
            buy_consumption_map[buy_id] = buy_consumption_map.get(buy_id, Decimal(0)) + matched_qty
            
            # Calcular valores proporcionales
            
            # --- LOGICA CORREGIDA SEGÚN PETICION USUARIO ---
            # Calcular Tasa de Cambio implícita en la venta
            # Forzamos cálculo via rate implícito para alinear con el método bancario (P&L en Divisa Orig * Tasa Venta)
            sale_conversion_rate = Decimal(1)
            sell_original_price = op.original_price if op.original_price is not None else op.price
            
            # Evitar división por cero
            if sell_original_price and sell_original_price != 0:
                 sale_conversion_rate = op.price / sell_original_price

            # Calcular valores originales PRIMERO
            buy_original_price = current_lot.op.original_price if current_lot.op.original_price is not None else current_lot.op.price
            buy_original_fees_part = (current_lot.op.original_fees if current_lot.op.original_fees is not None else current_lot.op.fees) * (matched_qty / current_lot.op.quantity)
            buy_original_value = (buy_original_price * matched_qty) + buy_original_fees_part

            sell_original_fees_part = (op.original_fees if op.original_fees is not None else op.fees) * (matched_qty / op.quantity)
            sell_original_value = (sell_original_price * matched_qty) - sell_original_fees_part

            # Recalcular valores en Moneda Objetivo (EUR) usando TASA DE VENTA para TODO
            
            # Venta (ya convertida correctamente con tasa de venta en pre-proceso)
            sell_fees_part = op.fees * (matched_qty / op.quantity)
            sell_value = (op.price * matched_qty) - sell_fees_part

            # Compra (VALORES HISTÓRICOS REALES - MODIFICADO A ORIGINALES POR SOLICITUD)
            # Volvemos a usar los valores originales para los campos principales
            acquisition_price_final = buy_original_price
            acquisition_fees_final = buy_original_fees_part
            acquisition_value_final = buy_original_value

            # Venta (VALORES ORIGINALES POR SOLICITUD)
            sale_price_final = sell_original_price
            sale_fees_final = sell_original_fees_part
            sale_value_final = sell_original_value

            # RESULTADO: Ajustado a Tasa de Venta (Petición Usuario)
            # Gross Result = (P&L Original) * Tasa Venta
            gross_result_adjusted = (sell_original_value - buy_original_value) * sale_conversion_rate

            # Crear item de resultado
            item = FiscalResultItem(
                asset_symbol=op.asset_symbol,
                asset_currency=op.asset_currency,
                quantity_sold=matched_qty,
                sale_date=op.date,
                
                # CAMPOS PRINCIPALES EN ORIGINAL (USD)
                sale_price=sale_price_final,
                sale_fees=sale_fees_final,
                sale_value=sale_value_final,
                
                sale_price_original=sell_original_price,
                sale_fees_original=sell_original_fees_part,
                sale_value_original=sell_original_value,

                acquisition_date=current_lot.op.date,
                
                # CAMPOS PRINCIPALES EN ORIGINAL (USD)
                acquisition_price=acquisition_price_final,
                acquisition_fees=acquisition_fees_final,
                acquisition_value=acquisition_value_final,
                
                acquisition_price_original=buy_original_price,
                acquisition_fees_original=buy_original_fees_part,
                acquisition_value_original=buy_original_value,

                # RESULTADO EN EUR (CONVERTIDO)
                gross_result=gross_result_adjusted,
                # RESULTADO EN USD (ORIGINAL)
                gross_result_original=sell_original_value - buy_original_value,
                
                exchange_rate_used=sale_conversion_rate,
                days_held=(op.date - current_lot.op.date).days
            )
            results.append(item)
            
            # Actualizar lotes
            quantity_to_sell -= matched_qty
            current_lot.remaining_quantity -= matched_qty
            
            if current_lot.remaining_quantity <= 0:
                lots.popleft() # Lote consumido
                
        return results

    def _apply_wash_sale_rules(self, results: List[FiscalResultItem], all_ops: List[FiscalOperation], buy_consumption_map: Dict[str, Decimal]):
        """
        Aplica la norma anti-aplicación de pérdidas (regla de los 2 meses).
        Si se ha comprado valores homogéneos 2 meses antes o después de una venta con pérdidas.
        """
        # Agrupar compras por symbol para acceso rápido
        buys_by_symbol = {}
        for op in all_ops:
            if op.type == TransactionType.BUY:
                if op.asset_symbol not in buys_by_symbol:
                    buys_by_symbol[op.asset_symbol] = []
                buys_by_symbol[op.asset_symbol].append(op)

        window = timedelta(days=60) # Aproximación de 2 meses
        
        # Mapa para rastrear qué cantidad de cada compra ya se ha usado para "lavar" pérdidas
        # buy_id -> quantity_used_for_wash
        buy_usage_map = {}

        for item in results:
            if item.gross_result < 0:
                potential_buys = buys_by_symbol.get(item.asset_symbol, [])
                
                # Cantidad de la pérdida que necesitamos "cubrir" con recompras
                remaining_loss_qty = item.quantity_sold
                matched_wash_qty = Decimal(0)

                for buy in potential_buys:
                    # Excluir la compra original que originó este lote (aunque por fecha no debería solaparse si held > 0)
                    if buy.date == item.acquisition_date:
                        continue
                        
                    # Verificar si esta compra ha sido VENDIDA (posición cerrada)
                    # Si ya se vendió, no bloquea la pérdida (o la desbloquea en el mismo ejercicio)
                    # Para simplificar el reporte anual: si se vendió, ignoremos el wash sale.
                    buy_id = getattr(buy, 'id', str(id(buy)))
                    sold_qty = buy_consumption_map.get(buy_id, Decimal(0))
                    
                    # DEBUG LOG
                    # print(f"DEBUG WASH: Buy {buy.asset_symbol} Qty={buy.quantity} Sold={sold_qty}")

                    # Si se ha vendido todo el lote de recompra, saltar
                    if sold_qty >= buy.quantity:
                        continue

                    # Verificar ventana temporal
                    if (item.sale_date - window) <= buy.date <= (item.sale_date + window):
                        # Esta compra está en la ventana. Es candidata para Wash Sale.
                        # Verificar cuánta cantidad de esta compra está disponible (no usada por otro wash sale)
                        used_qty = buy_usage_map.get(buy_id, Decimal(0))
                        available_qty = buy.quantity - used_qty
                        
                        if available_qty > 0:
                            # Tomar lo que necesitemos hasta cubrir la venta
                            match = min(remaining_loss_qty, available_qty)
                            
                            matched_wash_qty += match
                            remaining_loss_qty -= match
                            
                            # Marcar como usada
                            buy_usage_map[buy_id] = used_qty + match
                            
                            if remaining_loss_qty <= 0:
                                break
                
                if matched_wash_qty > 0:
                    item.is_wash_sale = True
                    # Calcular la proporción de la pérdida que no es computable
                    # Si vendí 100 y recompré 10, matched=10. Proporción = 10/100 = 0.1
                    # Pérdida bloqueada = Pérdida total * 0.1
                    ratio = matched_wash_qty / item.quantity_sold
                    item.wash_sale_disallowed_loss = item.gross_result * ratio
                    
                    if ratio < 1:
                        item.notes = f"Wash Sale Parcial ({ratio:.1%}): Recompra de {matched_wash_qty} uds."
                    else:
                        item.notes = "Lavado de activos (Wash Sale): Recompra total."

    def _build_report(self, portfolio_id: str, results: List[FiscalResultItem]) -> FiscalReport:
        years = {}
        
        for item in results:
            y = item.sale_date.year
            if y not in years:
                years[y] = FiscalYearSummary(year=y)
            
            summary = years[y]
            summary.items.append(item)
            
            if item.is_wash_sale:
                summary.pending_wash_sales.append(item)
                
                # Sumar solo la parte DEDUCIBLE de la pérdida
                # loss = -200, disallowed = -20 (bloqueado)
                # deductible = -200 - (-20) = -180
                deductible_loss = item.gross_result - item.wash_sale_disallowed_loss
                if deductible_loss < 0:
                     summary.total_losses += deductible_loss
            else:
                if item.gross_result >= 0:
                    summary.total_gains += item.gross_result
                else:
                    summary.total_losses += item.gross_result
            
            # Recalcular neto
            summary.net_result = summary.total_gains + summary.total_losses

        return FiscalReport(
            portfolio_id=portfolio_id,
            years=list(years.values())
        )

fiscal_service = FiscalService()

from typing import List, Dict, Optional
from datetime import timedelta
from decimal import Decimal
from collections import deque
from app.schemas.fiscal import FiscalOperation, FiscalResultItem, FiscalReport, FiscalYearSummary
from app.models.transaction import TransactionType

class PositionLot:
    """Clase auxiliar para rastrear lotes abiertos para FIFO."""
    def __init__(self, op: FiscalOperation, quantity: Decimal):
        self.op = op
        self.remaining_quantity = quantity

class FiscalService:
    def calculate_fiscal_impact(self, portfolio_id: str, operations: List[FiscalOperation]) -> FiscalReport:
        # 1. Ordenar operaciones cronológicamente
        ops = sorted(operations, key=lambda x: x.date)
        
        # Estructuras de estado
        open_positions: Dict[str, deque[PositionLot]] = {} # asset_id -> Queue of lots
        results: List[FiscalResultItem] = []
        
        # 2. Procesar FIFO
        for op in ops:
            if op.type == TransactionType.BUY:
                self._process_buy(op, open_positions)
            elif op.type == TransactionType.SELL:
                sale_results = self._process_sell(op, open_positions)
                results.extend(sale_results)
                
        # 3. Aplicar Regla de los 2 Meses (Wash Sales)
        # Se aplica sobre las pérdidas generadas
        self._apply_wash_sale_rules(results, ops)
        
        # 4. Agrupar por años
        report = self._build_report(portfolio_id, results)
        return report

    def _process_buy(self, op: FiscalOperation, open_positions: Dict[str, deque[PositionLot]]):
        if op.asset_id not in open_positions:
            open_positions[op.asset_id] = deque()
        
        # Agregar nuevo lote
        lot = PositionLot(op, op.quantity)
        open_positions[op.asset_id].append(lot)

    def _process_sell(self, op: FiscalOperation, open_positions: Dict[str, deque[PositionLot]]) -> List[FiscalResultItem]:
        results = []
        quantity_to_sell = op.quantity
        
        if op.asset_id not in open_positions or not open_positions[op.asset_id]:
            # Venta al descubierto o error de datos. Ignoramos o logueamos.
            # Para este MVP, asumiremos que si no hay posiciones, no hay coste (ganancia total = venta)
            # O mejor: no generamos resultado fiscal válido para esa parte.
            return []

        lots = open_positions[op.asset_id]
        
        while quantity_to_sell > 0 and lots:
            current_lot = lots[0] # FIFO: primer elemento
            
            matched_qty = min(quantity_to_sell, current_lot.remaining_quantity)
            
            # Calcular valores proporcionales
            # Coste de adquisición = (Precio * Cantidad) + (Comisiones * (Cantidad casada / Cantidad original))
            # Pero la comision original era por el total del lote.
            buy_fees_part = current_lot.op.fees * (matched_qty / current_lot.op.quantity)
            buy_value = (current_lot.op.price * matched_qty) + buy_fees_part
            
            # Valor de venta = (Precio * Cantidad) - (Comisiones * (Cantidad casada / Cantidad total venta))
            sell_fees_part = op.fees * (matched_qty / op.quantity)
            sell_value = (op.price * matched_qty) - sell_fees_part
            
            # Crear item de resultado
            item = FiscalResultItem(
                asset_symbol=op.asset_symbol,
                quantity_sold=matched_qty,
                sale_date=op.date,
                sale_price=op.price,
                sale_fees=sell_fees_part,
                sale_value=sell_value,
                
                acquisition_date=current_lot.op.date,
                acquisition_price=current_lot.op.price,
                acquisition_fees=buy_fees_part,
                acquisition_value=buy_value,
                
                gross_result=sell_value - buy_value,
                days_held=(op.date - current_lot.op.date).days
            )
            results.append(item)
            
            # Actualizar lotes
            quantity_to_sell -= matched_qty
            current_lot.remaining_quantity -= matched_qty
            
            if current_lot.remaining_quantity <= 0:
                lots.popleft() # Lote consumido
                
        return results

    def _apply_wash_sale_rules(self, results: List[FiscalResultItem], all_ops: List[FiscalOperation]):
        """
        Aplica la norma anti-aplicación de pérdidas (regla de los 2 meses).
        Si se ha comprado valores homogéneos 2 meses antes o después de una venta con pérdidas.
        """
        # Agrupar compras por activo para acceso rápido
        buys_by_asset = {}
        for op in all_ops:
            if op.type == TransactionType.BUY:
                if op.asset_id not in buys_by_asset:
                    buys_by_asset[op.asset_id] = []
                buys_by_asset[op.asset_id].append(op)
                
        for item in results:
            if item.gross_result < 0:
                # Es una pérdida. Verificar si hay recompras.
                # Rango: [SaleDate - 60 dias, SaleDate + 60 dias]
                # Nota: La norma dice 2 meses. Usaremos 60 días para simplificar o timedelta exacto.
                
                asset_buys = buys_by_asset.get(item.asset_symbol, []) # Nota: item.asset_symbol deberia ser ID para ser robusto, pero usaremos lo que tenemos.
                # Necesitamos el asset_id. En results no lo guardé explícitamente, pero tengo symbol.
                # Mejor buscar por asset_symbol si es único, o haber guardado asset_id en ResultItem.
                # Buscaré por symbol en buys_by_asset (que re-indexaré por symbol ahora para facilitar)
                pass 
                
        # Re-indexar buys por symbol para cruzar con results
        buys_by_symbol = {}
        for op in all_ops:
            if op.type == TransactionType.BUY:
                if op.asset_symbol not in buys_by_symbol:
                    buys_by_symbol[op.asset_symbol] = []
                buys_by_symbol[op.asset_symbol].append(op)

        window = timedelta(days=60) # Aproximación de 2 meses
        
        for item in results:
            if item.gross_result < 0:
                potential_buys = buys_by_symbol.get(item.asset_symbol, [])
                is_wash = False
                for buy in potential_buys:
                    # Excluir la compra original que originó este lote (aunque por fecha no debería solaparse si held > 0)
                    if buy.date == item.acquisition_date:
                        continue
                        
                    # Verificar ventana temporal
                    if (item.sale_date - window) <= buy.date <= (item.sale_date + window):
                        # Encontrada recompra en ventana
                        is_wash = True
                        break
                
                if is_wash:
                    item.is_wash_sale = True
                    item.wash_sale_disallowed_loss = item.gross_result # Toda la pérdida bloqueada
                    item.notes = "Lavado de activos (Wash Sale): Recompra en +-2 meses."

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
                # No sumar al neto, es pérdida bloqueada.
                # Pero en la contabilidad "gross" quizas se quiera ver?
                # Ajustaré total_losses solo con pérdidas no lavadas.
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

import { useEffect, useRef } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import Layout from '../components/Layout';
import { usePortfolioStore } from '../stores/portfolioStore';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { priceRenderer, numberRenderer, percentRenderer } from '../utils/handsontableUtils';

/**
 * Página de Posiciones Actuales
 */
export default function Positions() {
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
    const { 
        portfolios, 
        selectedPortfolio, 
        positions, 
        isRealTime,
        lastSync,
        loadPortfolios, 
        selectPortfolio, 
        setRealTime 
    } = usePortfolioStore();

    /**
     * Calcula estadísticas resumen de las posiciones filtradas
     */
    const stats = {
        totalValue: positions.reduce((acc, pos) => acc + (pos.current_value || 0), 0),
        totalCost: positions.reduce((acc, pos) => acc + (pos.cost_basis || 0), 0),
        totalPL: positions.reduce((acc, pos) => acc + (pos.profit_loss || 0), 0),
        totalPLPercent: 0
    };
    if (stats.totalCost > 0) {
        stats.totalPLPercent = (stats.totalPL / stats.totalCost) * 100;
    }

    useEffect(() => {
        if (portfolios.length === 0) {
            loadPortfolios();
        }
    }, []);

    /**
     * Activar tiempo real al montar el componente
     */
    useEffect(() => {
        setRealTime(true);
        return () => setRealTime(false);
    }, []);

    // Inicializar Handsontable
    useEffect(() => {
        if (!hotTableRef.current || !selectedPortfolio || positions.length === 0) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: positions,
            licenseKey: 'non-commercial-and-evaluation',
            width: '100%',
            height: '100%',
            colHeaders: [
                'Símbolo',
                'Nombre',
                'Cantidad',
                'P. Compra',
                'P. Anterior',
                'P. Actual',
                '% Día',
                'Res. Día',
                'Costo Base',
                'Valor Actual',
                '% Total',
                'Resultado Total'
            ],
            columns: [
                { data: 'symbol', readOnly: true, width: 90, className: 'htLeft' },
                { data: 'name', readOnly: true, width: 180, className: 'htLeft' },
                {
                    data: 'quantity',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: numberRenderer
                },
                {
                    data: 'avg_price',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'previous_close',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'current_price',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'day_change_percent',
                    readOnly: true,
                    width: 90,
                    className: 'htRight',
                    renderer: percentRenderer
                },
                {
                    data: 'day_result',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'cost_basis',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'current_value',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'profit_loss_percent',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: percentRenderer
                },
                {
                    data: 'profit_loss',
                    readOnly: true,
                    width: 130,
                    className: 'htRight',
                    renderer: function (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any, cellProperties: any) {
                        priceRenderer(instance, td, row, col, prop, value, cellProperties);
                        td.style.fontWeight = 'bold';
                        return td;
                    }
                }
            ],
            rowHeaders: true,
            stretchH: 'all',
            autoColumnSize: false,
            filters: true,
            dropdownMenu: [
                'filter_by_condition',
                'filter_by_value',
                'filter_action_bar'
            ],
            columnSorting: true,
            manualColumnResize: true,
            wordWrap: false,
            rowHeights: 28
        });

        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, [positions, selectedPortfolio]);

    // Refresco automático de precios online
    // Eliminado: Ahora gestionado por usePortfolioStore

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Selector inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                📈 Posiciones
                            </h1>
                            {lastSync && (
                                <span className="text-[10px] text-dark-muted flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRealTime ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></span>
                                    Sincronizado: {lastSync.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <div className="w-48">
                            <select
                                value={selectedPortfolio ? selectedPortfolio.id : ''}
                                onChange={(e) => selectPortfolio(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                            >
                                <option value="">Selecciona una cartera</option>
                                {portfolios.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedPortfolio ? (
                        <>
                            {/* Summary Cards Row - Coherente con Dashboard */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-none">
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Valor Actual</h3>
                                    <div className="text-lg font-bold text-white leading-tight">
                                        {formatCurrency(stats.totalValue)} €
                                    </div>
                                </div>
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Inversión</h3>
                                    <div className="text-lg font-bold text-white leading-tight">
                                        {formatCurrency(stats.totalCost)} €
                                    </div>
                                </div>
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Pérdidas/Ganancias</h3>
                                    <div className={`text-lg font-bold leading-tight ${stats.totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stats.totalPL >= 0 ? '+' : ''}{formatCurrency(stats.totalPL)} €
                                        <span className="text-xs ml-2 font-normal opacity-80">
                                            ({stats.totalPL >= 0 ? '+' : ''}{formatPercent(stats.totalPLPercent)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Table Container */}
                            <div ref={hotTableRef} className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden handsontable-dark"></div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-dark-muted flex-1 flex items-center justify-center bg-dark-surface border border-dark-border rounded-lg">
                            Selecciona una cartera para ver las posiciones
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}


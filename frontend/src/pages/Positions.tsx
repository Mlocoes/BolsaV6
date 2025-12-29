import { useEffect, useRef, useState } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import Layout from '../components/Layout';
import { usePortfolioStore } from '../stores/portfolioStore';
import { formatCurrency, formatPercent } from '../utils/formatters';

/**
 * Página de Posiciones Actuales
 */
export default function Positions() {
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const { portfolios, selectedPortfolio, positions, loadPortfolios, selectPortfolio, loadPositions } = usePortfolioStore();

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
        loadPortfolios();
    }, [loadPortfolios]);

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
                    type: 'numeric',
                    numericFormat: {
                        pattern: '0',
                        culture: 'es-ES'
                    }
                },
                {
                    data: 'avg_price',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'previous_close',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'current_price',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'day_change_percent',
                    readOnly: true,
                    width: 90,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                            td.style.color = value >= 0 ? '#10b981' : '#ef4444';
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'day_result',
                    readOnly: true,
                    width: 110,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            td.style.color = value >= 0 ? '#10b981' : '#ef4444';
                            td.style.fontWeight = 'bold';
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'cost_basis',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'current_value',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'profit_loss_percent',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                            td.style.color = value >= 0 ? '#10b981' : '#ef4444';
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
                        return td;
                    }
                },
                {
                    data: 'profit_loss',
                    readOnly: true,
                    width: 130,
                    className: 'htRight',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        if (typeof value === 'number') {
                            td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            td.style.color = value >= 0 ? '#10b981' : '#ef4444';
                            td.style.fontWeight = 'bold';
                        } else {
                            td.textContent = value;
                        }
                        td.style.textAlign = 'right';
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
    useEffect(() => {
        if (!selectedPortfolio) return;

        // Función para cargar precios online
        const refreshOnline = async () => {
            console.log("⏱️ Refrescando precios online...");
            await loadPositions(selectedPortfolio.id, true);
            setLastSync(new Date());
        };

        // Ejecución inmediata la primera vez
        refreshOnline();

        // El timer dispara el refresco cada 60 segundos
        const timer = setInterval(refreshOnline, 60000);

        return () => clearInterval(timer);
    }, [selectedPortfolio, loadPositions]);

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
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-green-500 font-medium uppercase tracking-tight">Tiempo Real</span>
                                    <span className="text-[10px] text-green-500/60 ml-1">
                                        {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
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


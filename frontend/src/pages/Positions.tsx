import { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-enterprise';
import Layout from '../components/Layout';
import { usePortfolioStore } from '../stores/portfolioStore';
import { formatCurrency, formatQuantity, formatPercent } from '../utils/formatters';

/**
 * Página de Posiciones Actuales
 */
export default function Positions() {
    const gridRef = useRef<AgGridReact>(null);
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

    const columnDefs: ColDef[] = [
        { field: 'symbol', headerName: 'Símbolo', width: 90, pinned: 'left', cellClass: 'font-semibold text-primary' },
        { field: 'name', headerName: 'Nombre', width: 180 },
        {
            field: 'quantity',
            headerName: 'Cantidad',
            width: 100,
            valueFormatter: (params) => formatQuantity(params.value)
        },
        {
            field: 'avg_price',
            headerName: 'P. Compra',
            width: 110,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'previous_close',
            headerName: 'P. Anterior',
            width: 110,
            cellClass: 'text-gray-400',
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'current_price',
            headerName: 'P. Actual',
            width: 110,
            cellClass: (params) => params.data.source === 'online' ? 'text-green-400 font-medium' : '',
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'day_change_percent',
            headerName: '% Día',
            width: 90,
            valueFormatter: (params) => formatPercent(params.value),
            cellStyle: (params) => ({
                color: (params.value != null && params.value >= 0) ? '#10b981' : '#ef4444',
                fontWeight: '600'
            })
        },
        {
            field: 'day_result',
            headerName: 'Res. Día',
            width: 110,
            cellStyle: (params) => ({
                color: (params.value != null && params.value >= 0) ? '#10b981' : '#ef4444',
                fontWeight: '600'
            }),
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'cost_basis',
            headerName: 'Costo Base',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'current_value',
            headerName: 'Valor Actual',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'profit_loss_percent',
            headerName: '% Total',
            width: 100,
            valueFormatter: (params) => formatPercent(params.value),
            cellStyle: (params) => ({
                color: (params.value != null && params.value >= 0) ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
            })
        },
        {
            field: 'profit_loss',
            headerName: 'Resultado Total',
            width: 130,
            cellStyle: (params) => ({
                color: (params.value != null && params.value >= 0) ? '#10b981' : '#ef4444'
            }),
            valueFormatter: (params) => formatCurrency(params.value)
        },
    ];

    useEffect(() => {
        loadPortfolios();
    }, [loadPortfolios]);

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
                            <div className="ag-theme-quartz-dark rounded-lg border border-dark-border flex-1 min-h-[300px]">
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={positions}
                                    columnDefs={columnDefs}
                                    defaultColDef={{
                                        sortable: true,
                                        resizable: true,
                                        filter: true,
                                    }}
                                    enableRangeSelection={true}
                                    enableRangeHandle={true}
                                    enableFillHandle={true}
                                    suppressCellFocus={false}
                                    copyHeadersToClipboard={true}
                                    animateRows={true}
                                    onGridReady={(params) => {
                                        params.api.sizeColumnsToFit();
                                    }}
                                    domLayout='normal'
                                    containerStyle={{ height: '100%', width: '100%' }}
                                />
                            </div>
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


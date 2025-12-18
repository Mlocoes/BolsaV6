import { useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import Layout from '../components/Layout';
import { usePortfolioStore } from '../stores/portfolioStore';
import { formatCurrency, formatQuantity, formatPercent } from '../utils/formatters';

/**
 * Página de Posiciones Actuales
 */
export default function Positions() {
    const gridRef = useRef<AgGridReact>(null);
    const { portfolios, selectedPortfolio, positions, loadPortfolios, selectPortfolio } = usePortfolioStore();

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
        { field: 'symbol', headerName: 'Símbolo', width: 100, pinned: 'left' },
        { field: 'name', headerName: 'Nombre', width: 220 },
        {
            field: 'quantity',
            headerName: 'Cantidad',
            width: 110,
            valueFormatter: (params) => formatQuantity(params.value)
        },
        {
            field: 'avg_price',
            headerName: 'Precio Compra',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'current_price',
            headerName: 'Precio Actual',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'cost_basis',
            headerName: 'Costo Base',
            width: 130,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'current_value',
            headerName: 'Valor Actual',
            width: 130,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'profit_loss',
            headerName: 'Resultado',
            width: 130,
            cellStyle: (params) => ({
                color: (params.value != null && params.value >= 0) ? '#10b981' : '#ef4444'
            }),
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'profit_loss_percent',
            headerName: 'Resultado %',
            width: 120,
            valueFormatter: (params) => formatPercent(params.value),
            cellStyle: (params) => ({
                color: (params.value != null && params.value >= 0) ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
            })
        },
    ];

    useEffect(() => {
        loadPortfolios();
    }, [loadPortfolios]);

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Selector inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            📈 Posiciones
                        </h1>
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
                                    animateRows={true}
                                    suppressCellFocus={true}
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


import { useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import Layout from '../components/Layout';
import { usePortfolioStore } from '../stores/portfolioStore';

export default function Positions() {
    const gridRef = useRef<AgGridReact>(null);
    const { portfolios, selectedPortfolio, positions, loadPortfolios, selectPortfolio } = usePortfolioStore();

    const columnDefs: ColDef[] = [
        { field: 'symbol', headerName: 'Símbolo', width: 100, pinned: 'left' },
        { field: 'name', headerName: 'Nombre', width: 200 },
        {
            field: 'quantity',
            headerName: 'Cantidad',
            width: 120,
            valueFormatter: (params) => params.value.toFixed(2)
        },
        {
            field: 'avg_price',
            headerName: 'Precio Compra',
            width: 140,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'current_price',
            headerName: 'Precio Actual',
            width: 140,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'cost_basis',
            headerName: 'Costo Base',
            width: 140,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'current_value',
            headerName: 'Valor Actual',
            width: 140,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'profit_loss',
            headerName: 'Resultado',
            width: 140,
            cellStyle: (params) => ({
                color: params.value >= 0 ? '#10b981' : '#ef4444'
            }),
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'profit_loss_percent',
            headerName: 'Resultado %',
            width: 140,
            valueFormatter: (params) => `${params.value.toFixed(2)}%`,
            cellStyle: (params) => ({
                color: params.value >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
            })
        },
    ];

    useEffect(() => {
        loadPortfolios();
    }, [loadPortfolios]);

    return (
        <Layout>
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">{selectedPortfolio ? selectedPortfolio.name : 'Posiciones Actuales'}</h1>
                </div>

                <div className="flex space-x-4 mb-4">
                    <select
                        value={selectedPortfolio ? selectedPortfolio.id : ''}
                        onChange={(e) => selectPortfolio(e.target.value)}
                        className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    >
                        <option value="">Selecciona una cartera</option>
                        {portfolios.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {selectedPortfolio && (
                    <div className="ag-theme-quartz-dark flex-1 rounded-lg overflow-hidden border border-dark-border" style={{ height: 'calc(100vh - 260px)' }}>
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
                            domLayout='normal'
                        />
                    </div>
                )}

                {!selectedPortfolio && (
                    <div className="text-center py-12 text-dark-muted flex-1 flex items-center justify-center">
                        Selecciona una cartera para ver las posiciones
                    </div>
                )}
            </div>
        </Layout>
    );
}


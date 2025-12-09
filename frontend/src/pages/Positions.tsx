/**
 * Página de Posiciones (tabla detallada de una cartera)
 */
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import Layout from '../components/Layout';
import api from '../services/api';

interface Position {
    symbol: string;
    name: string;
    quantity: number;
    avg_price: number;
    current_price: number;
    cost_basis: number;
    current_value: number;
    profit_loss: number;
    profit_loss_percent: number;
}

export default function Positions() {
    const [searchParams] = useSearchParams();
    const portfolioId = searchParams.get('portfolio');
    const gridRef = useRef<AgGridReact>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [portfolioName, setPortfolioName] = useState('');

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
            valueFormatter: (params) => `$${params.value.toFixed(2)}`,
            cellStyle: (params) => ({
                color: params.value >= 0 ? '#10b981' : '#ef4444'
            })
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
        if (portfolioId) {
            loadPortfolio();
            loadPositions();
        }
    }, [portfolioId]);

    const loadPortfolio = async () => {
        try {
            const response = await api.get(`/portfolios/${portfolioId}`);
            setPortfolioName(response.data.name);
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
    };

    const loadPositions = async () => {
        try {
            // TODO: Implementar endpoint de posiciones calculadas
            // Por ahora, datos de ejemplo
            setPositions([]);
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    };

    if (!portfolioId) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-dark-muted">Selecciona una cartera desde el Dashboard</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-4 h-[calc(100vh-12rem)]">
                <div>
                    <h1 className="text-3xl font-bold">{portfolioName || 'Posiciones'}</h1>
                    <p className="text-dark-muted mt-1">Vista detallada de posiciones</p>
                </div>

                <div className="ag-theme-alpine-dark h-full rounded-lg overflow-hidden border border-dark-border">
                    <AgGridReact
                        ref={gridRef}
                        rowData={positions}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                        }}
                        animateRows={true}
                        suppressCellFocus={true}
                    />
                </div>
            </div>
        </Layout>
    );
}

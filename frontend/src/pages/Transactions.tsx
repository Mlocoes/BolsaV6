/**
 * Página de Gestión de Transacciones
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import Layout from '../components/Layout';
import api from '../services/api';

interface Transaction {
    id: string;
    portfolio_id: string;
    asset_id: string;
    transaction_type: string;
    transaction_date: string;
    quantity: number;
    price: number;
    fees: number;
    notes: string;
}

export default function Transactions() {
    const gridRef = useRef<AgGridReact>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState('');

    const columnDefs: ColDef[] = [
        {
            field: 'transaction_date',
            headerName: 'Fecha',
            width: 120,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            field: 'transaction_type',
            headerName: 'Tipo',
            width: 100,
            cellStyle: (params) => ({
                color: params.value === 'buy' ? '#10b981' : '#ef4444'
            })
        },
        { field: 'asset_id', headerName: 'Activo', width: 120 },
        {
            field: 'quantity',
            headerName: 'Cantidad',
            width: 120,
            valueFormatter: (params) => params.value.toFixed(2)
        },
        {
            field: 'price',
            headerName: 'Precio',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'fees',
            headerName: 'Comisiones',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        { field: 'notes', headerName: 'Notas', flex: 1 },
        {
            headerName: 'Acciones',
            width: 150,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleDelete(params.data.id)}
                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm"
                    >
                        Eliminar
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadPortfolios();
    }, []);

    useEffect(() => {
        if (selectedPortfolio) {
            loadTransactions();
        }
    }, [selectedPortfolio]);

    const loadPortfolios = async () => {
        try {
            const response = await api.get('/portfolios');
            setPortfolios(response.data);
            if (response.data.length > 0) {
                setSelectedPortfolio(response.data[0].id);
            }
        } catch (error) {
            console.error('Error loading portfolios:', error);
        }
    };

    const loadTransactions = async () => {
        try {
            const response = await api.get(`/transactions/portfolio/${selectedPortfolio}`);
            setTransactions(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

        try {
            await api.delete(`/transactions/${id}`);
            loadTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error al eliminar transacción');
        }
    };

    return (
        <Layout>
            <div className="space-y-4 h-[calc(100vh-12rem)]">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Gestión de Transacciones</h1>
                        <select
                            value={selectedPortfolio}
                            onChange={(e) => setSelectedPortfolio(e.target.value)}
                            className="mt-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {portfolios.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                        + Nueva Transacción
                    </button>
                </div>

                <div className="ag-theme-alpine-dark h-full rounded-lg overflow-hidden border border-dark-border">
                    <AgGridReact
                        ref={gridRef}
                        rowData={transactions}
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

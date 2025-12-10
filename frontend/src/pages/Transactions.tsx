/**
 * Página de Gestión de Transacciones
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { toast } from 'react-toastify';
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
            toast.error('Error al cargar las carteras. Por favor, inténtelo de nuevo.');
        }
    };

    const loadTransactions = async () => {
        try {
            const response = await api.get(`/transactions/portfolio/${selectedPortfolio}`);
            setTransactions(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Error al cargar las transacciones. Por favor, inténtelo de nuevo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

        try {
            await api.delete(`/transactions/${id}`);
            toast.success('Transacción eliminada correctamente');
            loadTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Error al eliminar transacción. Por favor, inténtelo de nuevo.');
        }
    };

    const filteredTransactions = selectedPortfolio
        ? transactions.filter(t => t.portfolio_id === selectedPortfolio)
        : transactions;

    return (
        <Layout>
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Transacciones</h1>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                        + Nueva Transacción
                    </button>
                </div>

                <div className="flex space-x-4 mb-4">
                    <select
                        value={selectedPortfolio}
                        onChange={(e) => setSelectedPortfolio(e.target.value)}
                        className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    >
                        <option value="">Todas las carteras</option>
                        {portfolios.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="ag-theme-quartz-dark rounded-lg border border-dark-border" style={{ height: '600px', width: '100%', flex: '1 1 auto', minHeight: 0 }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={filteredTransactions}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                            filter: true,
                        }}
                        pagination={true}
                        paginationPageSize={20}
                        animateRows={true}
                        suppressCellFocus={true}
                        domLayout='normal'
                    />
                </div>
            </div>
        </Layout>
    );
}

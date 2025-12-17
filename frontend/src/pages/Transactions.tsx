/**
 * Página de Gestión de Transacciones
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { formatCurrency, formatQuantity } from '../utils/formatters';

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
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [formData, setFormData] = useState({
        portfolio_id: '',
        asset_id: '',
        transaction_type: 'BUY',
        transaction_date: new Date().toISOString().split('T')[0],
        quantity: '',
        price: '',
        fees: '0',
        notes: ''
    });

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
            width: 120,
            valueFormatter: (params) => {
                const typeMap: Record<string, string> = {
                    'BUY': 'Compra',
                    'SELL': 'Venta',
                    'DIVIDEND': 'Dividendo',
                    'SPLIT': 'Split',
                    'CORPORATE': 'Corporativa'
                };
                return typeMap[params.value] || params.value;
            },
            cellStyle: (params) => {
                const colorMap: Record<string, string> = {
                    'BUY': '#10b981',
                    'SELL': '#ef4444',
                    'DIVIDEND': '#3b82f6',
                    'SPLIT': '#8b5cf6',
                    'CORPORATE': '#64748b'
                };
                return { color: colorMap[params.value] || '#ffffff' };
            }
        },
        {
            field: 'asset_id',
            headerName: 'Activo',
            width: 120,
            valueFormatter: (params) => {
                const asset = assets.find(a => a.id === params.value);
                return asset ? asset.symbol : params.value;
            }
        },
        {
            field: 'quantity',
            headerName: 'Cantidad',
            width: 120,
            valueFormatter: (params) => formatQuantity(params.value)
        },
        {
            field: 'price',
            headerName: 'Precio',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'fees',
            headerName: 'Comisiones',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            headerName: 'Total',
            width: 130,
            valueGetter: (params) => {
                const quantity = parseFloat(params.data.quantity) || 0;
                const price = parseFloat(params.data.price) || 0;
                const fees = parseFloat(params.data.fees) || 0;
                return (quantity * price) + fees;
            },
            valueFormatter: (params) => formatCurrency(params.value),
            cellStyle: { fontWeight: 'bold' }
        },
        { field: 'notes', headerName: 'Notas', flex: 1 },
        {
            headerName: 'Acciones',
            width: 200,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleEdit(params.data)}
                        className="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-sm"
                    >
                        Editar
                    </button>
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
        loadAssets();
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
                setFormData(prev => ({ ...prev, portfolio_id: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error loading portfolios:', error);
            toast.error('Error al cargar las carteras. Por favor, inténtelo de nuevo.');
        }
    };

    const loadAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
        } catch (error) {
            console.error('Error loading assets:', error);
            toast.error('Error al cargar los activos. Por favor, inténtelo de nuevo.');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = {
                asset_id: formData.asset_id,
                transaction_type: formData.transaction_type,
                transaction_date: new Date(formData.transaction_date).toISOString(),
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price),
                fees: parseFloat(formData.fees),
                notes: formData.notes
            };

            if (editMode && selectedTransaction) {
                await api.patch(`/transactions/${selectedTransaction.id}`, dataToSend);
                toast.success('Transacción actualizada correctamente');
            } else {
                await api.post(`/transactions/portfolio/${formData.portfolio_id}`, dataToSend);
                toast.success('Transacción creada correctamente');
            }

            setShowForm(false);
            setEditMode(false);
            setSelectedTransaction(null);
            resetForm();
            loadTransactions();
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error(editMode ? 'Error al actualizar transacción.' : 'Error al crear transacción.');
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setEditMode(true);
        setFormData({
            portfolio_id: transaction.portfolio_id,
            asset_id: transaction.asset_id,
            transaction_type: transaction.transaction_type,
            transaction_date: new Date(transaction.transaction_date).toISOString().split('T')[0],
            quantity: transaction.quantity.toString(),
            price: transaction.price.toString(),
            fees: transaction.fees.toString(),
            notes: transaction.notes || ''
        });
        setShowForm(true);
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

    const resetForm = () => {
        setFormData({
            portfolio_id: selectedPortfolio || (portfolios.length > 0 ? portfolios[0].id : ''),
            asset_id: '',
            transaction_type: 'BUY',
            transaction_date: new Date().toISOString().split('T')[0],
            quantity: '',
            price: '',
            fees: '0',
            notes: ''
        });
    };

    const handleNewTransaction = () => {
        resetForm();
        setEditMode(false);
        setSelectedTransaction(null);
        setShowForm(true);
    };

    const filteredTransactions = selectedPortfolio
        ? transactions.filter(t => t.portfolio_id === selectedPortfolio)
        : transactions;

    return (
        <Layout>
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Transacciones</h1>
                    <button
                        onClick={handleNewTransaction}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                    >
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

                {showForm && (
                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border mb-4">
                        <h2 className="text-xl font-bold mb-4">{editMode ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Cartera *</label>
                                <select
                                    value={formData.portfolio_id}
                                    onChange={(e) => setFormData({ ...formData, portfolio_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                    disabled={editMode}
                                >
                                    <option value="">Seleccionar cartera</option>
                                    {portfolios.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Activo *</label>
                                <select
                                    value={formData.asset_id}
                                    onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                    disabled={editMode}
                                >
                                    <option value="">Seleccionar activo</option>
                                    {assets.map((a) => (
                                        <option key={a.id} value={a.id}>{a.symbol} - {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo *</label>
                                <select
                                    value={formData.transaction_type}
                                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                >
                                    <optgroup label="Transacciones">
                                        <option value="BUY">Compra</option>
                                        <option value="SELL">Venta</option>
                                    </optgroup>
                                    <optgroup label="Operaciones Corporativas (Informativas)">
                                        <option value="DIVIDEND">Dividendo</option>
                                        <option value="SPLIT">Split</option>
                                        <option value="CORPORATE">Otra Operación Corporativa</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Fecha *</label>
                                <input
                                    type="date"
                                    value={formData.transaction_date}
                                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cantidad *</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Precio *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Comisiones</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.fees}
                                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    min="0"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>

                            <div className="col-span-2 flex space-x-2">
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                                    {editMode ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditMode(false);
                                        setSelectedTransaction(null);
                                        resetForm();
                                    }}
                                    className="bg-dark-border hover:bg-dark-border/80 text-white px-4 py-2 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="ag-theme-quartz-dark rounded-lg border border-dark-border" style={{ width: '100%', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                        containerStyle={{ height: '100%', width: '100%' }}
                    />
                </div>
            </div>
        </Layout>
    );
}

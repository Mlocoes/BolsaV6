/**
 * Página de Gestión de Transacciones
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { formatCurrency, formatQuantity } from '../utils/formatters';
import Modal from '../components/Modal';
import TableActions from '../components/TableActions';

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

    /**
     * Calcular estadísticas de transacciones filtradas
     */
    const filteredTransactions = selectedPortfolio
        ? transactions.filter(t => t.portfolio_id === selectedPortfolio)
        : transactions;

    const stats = {
        total: filteredTransactions.length,
        buys: filteredTransactions.filter(t => t.transaction_type === 'BUY').length,
        sells: filteredTransactions.filter(t => t.transaction_type === 'SELL').length
    };

    const columnDefs: ColDef[] = [
        {
            field: 'transaction_date',
            headerName: 'Fecha',
            width: 120,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : ''
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
            width: 140,
            cellRenderer: (params: any) => (
                <TableActions
                    data={params.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
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

    /**
     * Carga las carteras disponibles
     */
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

    /**
     * Carga el catálogo de activos
     */
    const loadAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
        } catch (error) {
            console.error('Error loading assets:', error);
            toast.error('Error al cargar los activos. Por favor, inténtelo de nuevo.');
        }
    };

    /**
     * Carga las transacciones de la cartera seleccionada
     */
    const loadTransactions = async () => {
        try {
            const response = await api.get(`/transactions/portfolio/${selectedPortfolio}`);
            setTransactions(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Error al cargar las transacciones. Por favor, inténtelo de nuevo.');
        }
    };

    /**
     * Procesa el guardado (creación/edición) de una transacción
     */
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

    /**
     * Prepara el formulario para editar una transacción existente
     */
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

    /**
     * Elimina una transacción tras confirmación
     */
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

    /**
     * Resetea el estado del formulario a sus valores por defecto
     */
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

    /**
     * Abre el modal para crear una nueva transacción
     */
    const handleNewTransaction = () => {
        resetForm();
        setEditMode(false);
        setSelectedTransaction(null);
        setShowForm(true);
    };

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Action & Selector inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                💸 Transacciones
                            </h1>
                            <div className="w-48">
                                <select
                                    value={selectedPortfolio}
                                    onChange={(e) => setSelectedPortfolio(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">Todas las carteras</option>
                                    {portfolios.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleNewTransaction}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-medium"
                        >
                            + Nueva Transacción
                        </button>
                    </div>

                    {/* Summary Cards Row */}
                    <div className="grid grid-cols-3 gap-3 flex-none">
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Operaciones</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.total}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Compras</h3>
                            <div className="text-lg font-bold text-green-500 leading-tight">
                                {stats.buys}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Ventas</h3>
                            <div className="text-lg font-bold text-red-500 leading-tight">
                                {stats.sells}
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="ag-theme-quartz-dark rounded-lg border border-dark-border flex-1 min-h-[300px]">
                        <AgGridReact
                            ref={gridRef}
                            rowData={filteredTransactions}
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
                            pagination={true}
                            paginationPageSize={20}
                            animateRows={true}
                            onGridReady={(params) => {
                                params.api.sizeColumnsToFit();
                            }}
                            domLayout='normal'
                            containerStyle={{ height: '100%', width: '100%' }}
                        />
                    </div>
                </div>

                <Modal
                    isOpen={showForm}
                    onClose={() => {
                        setShowForm(false);
                        setEditMode(false);
                        setSelectedTransaction(null);
                        resetForm();
                    }}
                    title={editMode ? 'Editar Transacción' : 'Nueva Transacción'}
                >
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Cartera *</label>
                            <select
                                value={formData.portfolio_id}
                                onChange={(e) => setFormData({ ...formData, portfolio_id: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
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
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
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
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
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
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
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
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
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
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
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
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                min="0"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Notas</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
                                rows={3}
                                maxLength={500}
                            />
                        </div>

                        <div className="col-span-2 flex justify-end space-x-2 mt-4">
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
                            <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                                {editMode ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}

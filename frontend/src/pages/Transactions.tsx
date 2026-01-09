import { useEffect, useState, useRef, useMemo } from 'react';
import Handsontable from 'handsontable';

import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import Modal from '../components/Modal';
import { getActionRenderer, priceRenderer, numberRenderer } from '../utils/handsontableUtils';

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
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
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

    // Memoized table data to avoid unnecessary re-renders
    const tableData = useMemo(() => {
        return filteredTransactions.map(t => {
            const asset = assets.find(a => a.id === t.asset_id);
            const typeMap: Record<string, string> = {
                'BUY': 'Compra',
                'SELL': 'Venta',
                'DIVIDEND': 'Dividendo',
                'SPLIT': 'Split',
                'CORPORATE': 'Corporativa'
            };
            const quantity = Number(t.quantity) || 0;
            const price = Number(t.price) || 0;
            const fees = Number(t.fees) || 0;
            const total = (quantity * price) + fees;

            return {
                id: t.id,
                portfolio_id: t.portfolio_id,
                asset_id: t.asset_id,
                date: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '',
                type: typeMap[t.transaction_type] || t.transaction_type,
                type_raw: t.transaction_type,
                asset: asset ? asset.symbol : t.asset_id,
                quantity: quantity,
                price: price,
                fees: fees,
                total: total,
                notes: t.notes || ''
            };
        });
    }, [filteredTransactions, assets]);

    // Ref to avoid stale closures in event listeners
    const filteredTransactionsRef = useRef(filteredTransactions);
    useEffect(() => {
        filteredTransactionsRef.current = filteredTransactions;
    }, [filteredTransactions]);

    const initializeHandsontable = () => {
        if (!hotTableRef.current) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: tableData,
            licenseKey: 'non-commercial-and-evaluation',
            width: '100%',
            height: '100%',
            themeName: 'ht-theme-main',
            colHeaders: [
                'Fecha', 'Tipo', 'Activo', 'Cantidad', 'Precio', 'Comisiones', 'Total', 'Notas', 'Acciones'
            ],
            columns: [
                { data: 'date', readOnly: true, width: 120, className: 'htLeft' },
                {
                    data: 'type',
                    readOnly: true,
                    width: 120,
                    className: 'htLeft',
                    renderer: (instance: any, td: HTMLTableCellElement, row: number, _col: number, _prop: any, value: any) => {
                        td.textContent = value;
                        const source = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                        const colorMap: Record<string, string> = {
                            'BUY': '#10b981',
                            'SELL': '#ef4444',
                            'DIVIDEND': '#3b82f6',
                            'SPLIT': '#8b5cf6',
                            'CORPORATE': '#64748b'
                        };
                        td.style.color = colorMap[source?.type_raw] || '#ffffff';
                        return td;
                    }
                },
                { data: 'asset', readOnly: true, width: 120, className: 'htLeft' },
                { data: 'quantity', readOnly: true, width: 120, className: 'htRight', renderer: numberRenderer },
                {
                    data: 'price',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'fees',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'total',
                    readOnly: true,
                    width: 130,
                    className: 'htRight',
                    renderer: function (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any, cellProperties: any) {
                        priceRenderer(instance, td, row, col, prop, value, cellProperties);
                        td.style.fontWeight = 'bold';
                        return td;
                    }
                },
                { data: 'notes', readOnly: true, width: 200, className: 'htLeft' },
                {
                    data: 'id',
                    readOnly: true,
                    width: 120,
                    className: 'htCenter htMiddle',
                    renderer: getActionRenderer([
                        { name: 'edit', tooltip: 'Editar' },
                        { name: 'delete', tooltip: 'Eliminar' }
                    ])
                }
            ],
            rowHeaders: false,
            stretchH: 'all',
            filters: true,
            dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
            columnSorting: true,
            manualColumnResize: true,
            wordWrap: false,
            rowHeights: 28
        });
    };

    // Dedicated effect for the click event listener
    useEffect(() => {
        const tableElement = hotTableRef.current;
        if (!tableElement) return;

        const handleTableClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            if (!action) return;

            const td = target.closest('td');
            if (!td) return;

            const coords = hotInstance.current?.getCoords(td as HTMLTableCellElement);
            if (!coords || coords.row < 0) return;

            const transactionId = hotInstance.current?.getDataAtRowProp(coords.row, 'id');
            if (!transactionId) return;

            const transaction = filteredTransactionsRef.current.find(t => t.id === transactionId);
            if (transaction) {
                if (action === 'edit') {
                    handleEdit(transaction);
                } else if (action === 'delete') {
                    handleDelete(transaction.id);
                }
            }
        };

        tableElement.addEventListener('click', handleTableClick);
        return () => tableElement.removeEventListener('click', handleTableClick);
    }, []);

    // Effect for initializing and updating data
    useEffect(() => {
        if (!hotInstance.current) {
            if (assets.length > 0) initializeHandsontable();
        } else {
            hotInstance.current.loadData(tableData);
        }
    }, [tableData, assets]);

    // Final cleanup
    useEffect(() => {
        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        loadPortfolios();
        loadAssets();
    }, []);

    useEffect(() => {
        const hasPortfolios = portfolios.length > 0;
        if (hasPortfolios) {
            loadTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            if (selectedPortfolio) {
                const response = await api.get(`/transactions/portfolio/${selectedPortfolio}`);
                setTransactions(response.data);
            } else {
                const allTransactions: Transaction[] = [];
                for (const portfolio of portfolios) {
                    try {
                        const response = await api.get(`/transactions/portfolio/${portfolio.id}`);
                        allTransactions.push(...response.data);
                    } catch (error) {
                        console.error(`Error loading transactions for portfolio ${portfolio.id}:`, error);
                    }
                }
                allTransactions.sort((a, b) =>
                    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
                );
                setTransactions(allTransactions);
            }
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
                    <div className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden">
                        <div ref={hotTableRef} className="w-full h-full"></div>
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
                                step="0.00000001"
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
                                step="0.00000001"
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
                                step="0.00000001"
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

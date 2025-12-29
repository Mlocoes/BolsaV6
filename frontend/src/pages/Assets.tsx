/**
 * Página de Catálogo de Activos
 */
import { useEffect, useState, useRef } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

interface Asset {
    id: string;
    symbol: string;
    name: string;
    asset_type: string;
    currency: string;
    market: string;
}

export default function Assets() {
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState({
        symbol: '',
        name: '',
        asset_type: 'stock',
        currency: 'USD',
        market: ''
    });

    /**
     * Calcular estadísticas de los activos
     */
    const stats = {
        totalAssets: assets.length,
        assetTypes: new Set(assets.map(a => a.asset_type)).size,
        currencies: new Set(assets.map(a => a.currency)).size
    };

    useEffect(() => {
        loadAssets();
    }, []);

    // Inicializar Handsontable
    useEffect(() => {
        if (!hotTableRef.current) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: assets,
            licenseKey: 'non-commercial-and-evaluation',
            width: '100%',
            height: '100%',
            colHeaders: ['Símbolo', 'Nombre', 'Tipo', 'Moneda', 'Mercado', 'Acciones'],
            columns: [
                { data: 'symbol', readOnly: true, width: 120, className: 'htLeft' },
                { data: 'name', readOnly: true, width: 250, className: 'htLeft' },
                { data: 'asset_type', readOnly: true, width: 100, className: 'htLeft' },
                { data: 'currency', readOnly: true, width: 100, className: 'htCenter' },
                { data: 'market', readOnly: true, width: 150, className: 'htLeft' },
                {
                    data: 'id',
                    readOnly: true,
                    width: 280,
                    className: 'htCenter htMiddle',
                    renderer: function(instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any) {
                        td.innerHTML = '';
                        const container = document.createElement('div');
                        container.style.display = 'inline-flex';
                        container.style.gap = '8px';
                        container.style.alignItems = 'center';
                        const editBtn = `<button type="button" class="text-yellow-500 hover:text-yellow-700 text-sm font-medium cursor-pointer" data-action="edit" data-id="${value}">✏️ Editar</button>`;
                        const fetchBtn = `<button type="button" class="text-blue-500 hover:text-blue-700 text-sm font-medium cursor-pointer" data-action="fetch" data-id="${value}">📥 Importar</button>`;
                        const deleteBtn = `<button type="button" class="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer" data-action="delete" data-id="${value}">🗑️ Eliminar</button>`;
                        container.innerHTML = `${editBtn}${fetchBtn}${deleteBtn}`;
                        td.appendChild(container);
                        td.style.textAlign = 'center';
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

        // Handle clicks on action buttons
        if (hotTableRef.current) {
            hotTableRef.current.addEventListener('click', (e: any) => {
                const target = e.target as HTMLElement;
                const btn = target.closest('button');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (!id || !action) return;

                const asset = assets.find(a => a.id === id);
                if (!asset) return;

                if (action === 'edit') {
                    handleEdit(asset);
                } else if (action === 'fetch') {
                    handleFetchQuotes(id, asset.symbol);
                } else if (action === 'delete') {
                    handleDelete(id);
                }
            });
        }

        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, [assets]);

    /**
     * Carga el catálogo completo de activos
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
     * Prepara el formulario para editar un activo
     */
    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setFormData({
            symbol: asset.symbol,
            name: asset.name,
            asset_type: asset.asset_type,
            currency: asset.currency,
            market: asset.market || ''
        });
        setShowForm(true);
    };

    /**
     * Procesa el envío del formulario (creación o edición)
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAsset) {
                // Actualizar activo existente
                await api.patch(`/assets/${editingAsset.id}`, formData);
                toast.success('Activo actualizado correctamente');
            } else {
                // Crear nuevo activo
                await api.post('/assets', formData);
                toast.success('Activo creado correctamente');
            }

            setShowForm(false);
            setEditingAsset(null);
            setFormData({ symbol: '', name: '', asset_type: 'stock', currency: 'USD', market: '' });
            loadAssets();
        } catch (error) {
            console.error('Error saving asset:', error);
            toast.error('Error al guardar el activo. Por favor, verifique los datos.');
        }
    };

    /**
     * Inicia la descarga manual de históricos para un activo
     */
    const handleFetchQuotes = async (assetId: string, symbol: string) => {
        try {
            await api.post(`/quotes/asset/${assetId}/fetch-history`);
            toast.success(`Importación de historial iniciada para ${symbol}`);
        } catch (error) {
            console.error('❌ Error fetching quotes:', error);
            toast.error('Error al importar cotizaciones. Por favor, inténtelo de nuevo.');
        }
    };

    /**
     * Elimina un activo tras confirmación
     */
    const handleDelete = async (assetId: string) => {
        if (!confirm('¿Estás seguro de eliminar este activo?')) return;

        try {
            await api.delete(`/assets/${assetId}`);
            toast.success('Activo eliminado correctamente');
            loadAssets();
        } catch (error) {
            console.error('Error deleting asset:', error);
            toast.error('Error al eliminar activo. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Action inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            📊 Catálogo de Activos
                        </h1>
                        <button
                            onClick={() => {
                                setEditingAsset(null);
                                setFormData({ symbol: '', name: '', asset_type: 'stock', currency: 'USD', market: '' });
                                setShowForm(true);
                            }}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-medium"
                        >
                            + Nuevo Activo
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-dark-surface p-4 rounded-lg border border-dark-border mb-0 flex-none animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-wider">
                                {editingAsset ? `Editar Activo: ${editingAsset.symbol}` : 'Nuevo Activo'}
                            </h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Símbolo</label>
                                    <input
                                        type="text"
                                        value={formData.symbol}
                                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary disabled:opacity-50"
                                        required
                                        placeholder="AAPL"
                                        disabled={editingAsset !== null}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        required
                                        placeholder="Apple Inc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Tipo</label>
                                    <select
                                        value={formData.asset_type}
                                        onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="stock">Acción</option>
                                        <option value="etf">ETF</option>
                                        <option value="crypto">Cripto</option>
                                        <option value="bond">Bono</option>
                                        <option value="fund">Fondo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Moneda</label>
                                    <input
                                        type="text"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        placeholder="EUR / USD"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Mercado</label>
                                    <input
                                        type="text"
                                        value={formData.market}
                                        onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        placeholder="NASDAQ / MC"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-5 flex justify-end space-x-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditingAsset(null);
                                        }}
                                        className="bg-dark-border hover:bg-dark-border/80 text-white px-3 py-1 rounded text-xs transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs transition-colors font-medium">
                                        {editingAsset ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Summary Cards Row */}
                    <div className="grid grid-cols-3 gap-3 flex-none">
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Total Activos</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.totalAssets}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Tipos</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.assetTypes}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Monedas</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.currencies}
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div ref={hotTableRef} className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden handsontable-dark"></div>
                </div>
            </div>
        </Layout>
    );
}

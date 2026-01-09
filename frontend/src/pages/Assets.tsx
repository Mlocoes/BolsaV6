/**
 * Página de Catálogo de Activos
 */
import { useEffect, useState, useMemo } from 'react';
import { useHandsontable } from '../hooks/useHandsontable';

import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { getActionRenderer } from '../utils/handsontableUtils';

interface Asset {
    id: string;
    symbol: string;
    name: string;
    asset_type: string;
    currency: string;
    market: string;
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState({
        symbol: '',
        name: '',
        asset_type: 'stock',
        currency: 'EUR',
        market: ''
    });

    // Memoized table data
    const tableData = useMemo(() => assets, [assets]);



    /**
     * Calcular estadísticas de los activos
     */
    const stats = {
        totalAssets: assets.length,
        assetTypes: new Set(assets.map(a => a.asset_type)).size,
        currencies: new Set(assets.map(a => a.currency)).size
    };

    // Use the custom hook for Handsontable
    const { containerRef } = useHandsontable({
        data: tableData,
        colHeaders: ['Símbolo', 'Nombre', 'Tipo', 'Moneda', 'Mercado', 'Acciones'],
        columns: [
            { data: 'symbol', readOnly: true, width: 100, className: 'htLeft' },
            { data: 'name', readOnly: true, width: 250, className: 'htLeft' },
            { data: 'asset_type', readOnly: true, width: 100, className: 'htLeft' },
            { data: 'currency', readOnly: true, width: 80, className: 'htCenter' },
            { data: 'market', readOnly: true, width: 120, className: 'htLeft' },
            {
                data: 'id',
                readOnly: true,
                width: 150,
                className: 'htCenter htMiddle',
                renderer: getActionRenderer([
                    { name: 'edit', tooltip: 'Editar' },
                    { name: 'custom', label: 'fetch', icon: '📥', tooltip: 'Importar Cotizaciones' },
                    { name: 'delete', tooltip: 'Eliminar' }
                ])
            }
        ],
        onEdit: (asset) => handleEdit(asset),
        onDelete: (id) => handleDelete(id),
        onAction: (action, asset) => {
            if (action === 'custom') {
                handleFetchQuotes(asset);
            }
        }
    });



    useEffect(() => {
        loadAssets();
    }, []);

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
                await api.patch(`/assets/${editingAsset.id}`, formData);
                toast.success('Activo actualizado correctamente');
            } else {
                await api.post('/assets', formData);
                toast.success('Activo creado correctamente');
            }

            setShowForm(false);
            setEditingAsset(null);
            setFormData({ symbol: '', name: '', asset_type: 'stock', currency: 'EUR', market: '' });
            loadAssets();
        } catch (error: any) {
            console.error('Error saving asset:', error);
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                Array.isArray(detail) ? detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ') :
                    'Error al guardar el activo. Por favor, verifique los datos.';
            toast.error(message);
        }
    };

    /**
     * Inicia la descarga manual de históricos para un activo
     */
    const handleFetchQuotes = async (asset: Asset) => {
        try {
            await api.post(`/quotes/asset/${asset.id}/fetch-history`);
            toast.success(`Importación de historial iniciada para ${asset.symbol}`);
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
                                setFormData({ symbol: '', name: '', asset_type: 'stock', currency: 'EUR', market: '' });
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
                    <div ref={containerRef} className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden handsontable-dark"></div>
                </div>
            </div>
        </Layout>
    );
}

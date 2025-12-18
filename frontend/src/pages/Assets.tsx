/**
 * Página de Catálogo de Activos con AG Grid
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
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
    const gridRef = useRef<AgGridReact>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showForm, setShowForm] = useState(false);
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

    const columnDefs: ColDef[] = [
        { field: 'symbol', headerName: 'Símbolo', width: 120, filter: true },
        { field: 'name', headerName: 'Nombre', flex: 1, filter: true },
        { field: 'asset_type', headerName: 'Tipo', width: 120, filter: true },
        { field: 'currency', headerName: 'Moneda', width: 100 },
        { field: 'market', headerName: 'Mercado', width: 120 },
        {
            headerName: 'Acciones',
            width: 200,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleFetchQuotes(params.data.id, params.data.symbol)}
                        className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-sm"
                    >
                        Importar
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
        loadAssets();
    }, []);

    // Refrescar grid cuando cambien los assets
    useEffect(() => {
        if (gridRef.current?.api && assets.length > 0) {
            gridRef.current.api.updateGridOptions({ rowData: assets });
        }
    }, [assets]);

    const loadAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
        } catch (error) {
            console.error('Error loading assets:', error);
            toast.error('Error al cargar los activos. Por favor, inténtelo de nuevo.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/assets', formData);
            setShowForm(false);
            setFormData({ symbol: '', name: '', asset_type: 'stock', currency: 'USD', market: '' });
            toast.success('Activo creado correctamente');
            loadAssets();
        } catch (error) {
            console.error('Error creating asset:', error);
            toast.error('Error al crear activo. Por favor, verifique los datos.');
        }
    };

    const handleFetchQuotes = async (assetId: string, symbol: string) => {
        try {
            console.log('🔄 Iniciando importación de cotizaciones para:', symbol, assetId);
            const response = await api.post(`/quotes/asset/${assetId}/fetch-history`);
            console.log('✅ Respuesta del servidor:', response.data);
            toast.success(`Importación de historial iniciada para ${symbol}`);
        } catch (error) {
            console.error('❌ Error fetching quotes:', error);
            toast.error('Error al importar cotizaciones. Por favor, inténtelo de nuevo.');
        }
    };

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
                            💼 Catálogo de Activos
                        </h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-medium"
                        >
                            + Nuevo Activo
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-dark-surface p-4 rounded-lg border border-dark-border mb-0 flex-none animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-wider">Nuevo Activo</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Símbolo</label>
                                    <input
                                        type="text"
                                        value={formData.symbol}
                                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        required
                                        placeholder="AAPL"
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
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Moneda</label>
                                    <input
                                        type="text"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        placeholder="USD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Mercado</label>
                                    <input
                                        type="text"
                                        value={formData.market}
                                        onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        placeholder="NASDAQ"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-5 flex justify-end space-x-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="bg-dark-border hover:bg-dark-border/80 text-white px-3 py-1 rounded text-xs transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs transition-colors font-medium">
                                        Crear
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
                    <div className="ag-theme-quartz-dark rounded-lg border border-dark-border flex-1 min-h-[300px]">
                        <AgGridReact
                            ref={gridRef}
                            rowData={assets}
                            columnDefs={columnDefs}
                            defaultColDef={{
                                sortable: true,
                                filter: true,
                                resizable: true,
                            }}
                            pagination={true}
                            paginationPageSize={20}
                            animateRows={true}
                            suppressCellFocus={true}
                            rowSelection="single"
                            onGridReady={(params) => {
                                params.api.sizeColumnsToFit();
                            }}
                            containerStyle={{ height: '100%', width: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}

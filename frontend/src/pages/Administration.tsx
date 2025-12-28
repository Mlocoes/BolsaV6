/**
 * Página de Administración - Gestión de Mercados
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import TableActions from '../components/TableActions';

interface Market {
    id: string;
    name: string;
    currency: string;
    country: string;
}

export default function Administration() {
    const gridRef = useRef<AgGridReact>(null);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        currency: '',
        country: ''
    });

    const columnDefs: ColDef[] = [
        {
            field: 'name',
            headerName: 'Nombre del Mercado',
            flex: 1,
            filter: true,
            editable: true,
            cellClass: 'editable-cell'
        },
        {
            field: 'currency',
            headerName: 'Moneda',
            width: 120,
            editable: true,
            cellClass: 'editable-cell',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'BRL']
            }
        },
        {
            field: 'country',
            headerName: 'País',
            width: 150,
            editable: true,
            cellClass: 'editable-cell'
        },
        {
            headerName: 'Acciones',
            width: 120,
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
        loadMarkets();
    }, []);

    const loadMarkets = async () => {
        try {
            const response = await api.get('/markets');
            setMarkets(response.data);
        } catch (error) {
            console.error('Error loading markets:', error);
            toast.error('Error al cargar los mercados');
        }
    };

    const handleCellValueChanged = async (event: any) => {
        const updatedMarket = event.data;
        try {
            await api.patch(`/markets/${updatedMarket.id}`, {
                name: updatedMarket.name,
                currency: updatedMarket.currency,
                country: updatedMarket.country
            });
            toast.success(`Mercado ${updatedMarket.name} actualizado`);
            loadMarkets();
        } catch (error: any) {
            console.error('Error updating market:', error);
            toast.error(error.response?.data?.detail || 'Error al actualizar el mercado');
            loadMarkets(); // Recargar para revertir cambios
        }
    };

    const handleEdit = (market: Market) => {
        setEditingMarket(market);
        setFormData({
            name: market.name,
            currency: market.currency,
            country: market.country || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de que desea eliminar este mercado?')) {
            return;
        }

        try {
            await api.delete(`/markets/${id}`);
            toast.success('Mercado eliminado');
            loadMarkets();
        } catch (error: any) {
            console.error('Error deleting market:', error);
            toast.error(error.response?.data?.detail || 'Error al eliminar el mercado');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingMarket) {
                await api.patch(`/markets/${editingMarket.id}`, formData);
                toast.success('Mercado actualizado');
            } else {
                await api.post('/markets', formData);
                toast.success('Mercado creado');
            }
            setShowForm(false);
            setEditingMarket(null);
            setFormData({ name: '', currency: '', country: '' });
            loadMarkets();
        } catch (error: any) {
            console.error('Error saving market:', error);
            toast.error(error.response?.data?.detail || 'Error al guardar el mercado');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingMarket(null);
        setFormData({ name: '', currency: '', country: '' });
    };

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Action inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                🏛️ Administración de Mercados
                            </h1>
                            <p className="text-xs text-dark-muted mt-1 hidden sm:block">
                                Gestione las bolsas y mercados financieros del sistema
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-medium border border-primary"
                        >
                            + Nuevo Mercado
                        </button>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-none">
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Total Mercados</h3>
                            <div className="text-lg font-bold text-white leading-tight">{markets.length}</div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Monedas</h3>
                            <div className="text-lg font-bold text-primary-light leading-tight">
                                {new Set(markets.map(m => m.currency)).size}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Países</h3>
                            <div className="text-lg font-bold text-dark-text leading-tight">
                                {new Set(markets.map(m => m.country).filter(Boolean)).size}
                            </div>
                        </div>
                    </div>

                    {/* Tabla AG Grid */}
                    <div className="ag-theme-quartz-dark rounded-lg border border-dark-border flex-1 min-h-[300px]">
                        <AgGridReact
                            ref={gridRef}
                            rowData={markets}
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
                            onCellValueChanged={handleCellValueChanged}
                            onGridReady={(params) => {
                                params.api.sizeColumnsToFit();
                            }}
                            domLayout='normal'
                            containerStyle={{ height: '100%', width: '100%' }}
                        />
                    </div>

                    {/* Nota informativa */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex-none">
                        <p className="text-xs text-blue-200">
                            <strong>💡 Nota:</strong> Puede editar los mercados directamente en la tabla haciendo clic en las celdas.
                            La moneda y país de cada mercado se utilizarán para asignar automáticamente estos valores a los activos importados.
                        </p>
                    </div>

                    {/* Formulario Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                            <div className="bg-dark-surface border border-dark-border rounded-lg shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                                <h2 className="text-lg font-bold text-white mb-4">
                                    {editingMarket ? 'Editar Mercado' : 'Nuevo Mercado'}
                                </h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-dark-muted mb-1.5">
                                            Nombre del Mercado *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder-dark-muted/50"
                                            placeholder="Ej: NASDAQ, CONTINUO, XETRA"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-dark-muted mb-1.5">
                                            Moneda *
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                                            required
                                        >
                                            <option value="">Seleccione una moneda</option>
                                            <option value="USD">USD - Dólar estadounidense</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - Libra esterlina</option>
                                            <option value="JPY">JPY - Yen japonés</option>
                                            <option value="CAD">CAD - Dólar canadiense</option>
                                            <option value="CHF">CHF - Franco suizo</option>
                                            <option value="AUD">AUD - Dólar australiano</option>
                                            <option value="CNY">CNY - Yuan chino</option>
                                            <option value="BRL">BRL - Real brasileño</option>
                                        </select>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-xs font-semibold text-dark-muted mb-1.5">
                                            País
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder-dark-muted/50"
                                            placeholder="Ej: USA, España, Alemania"
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex-1 bg-dark-bg border border-dark-border hover:bg-dark-border text-dark-muted hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {editingMarket ? 'Actualizar' : 'Crear'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

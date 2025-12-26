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
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleEdit(params.data)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Editar"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => handleDelete(params.data.id)}
                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                </div>
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            🏛️ Administración de Mercados
                        </h1>
                        <p className="text-gray-600">
                            Gestione las bolsas y mercados financieros del sistema
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                        ➕ Nuevo Mercado
                    </button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Total de Mercados</div>
                        <div className="text-2xl font-bold text-primary">{markets.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Monedas Diferentes</div>
                        <div className="text-2xl font-bold text-primary">
                            {new Set(markets.map(m => m.currency)).size}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Países Diferentes</div>
                        <div className="text-2xl font-bold text-primary">
                            {new Set(markets.map(m => m.country).filter(Boolean)).size}
                        </div>
                    </div>
                </div>

                {/* Tabla AG Grid */}
                <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={markets}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                        }}
                        enableRangeSelection={true}
                        enableRangeHandle={true}
                        enableFillHandle={true}
                        suppressCellFocus={false}
                        copyHeadersToClipboard={true}
                        pagination={true}
                        paginationPageSize={20}
                        onCellValueChanged={handleCellValueChanged}
                        suppressMovableColumns={true}
                    />
                </div>

                {/* Formulario Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingMarket ? 'Editar Mercado' : 'Nuevo Mercado'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Nombre del Mercado *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Ej: NASDAQ, CONTINUO, XETRA"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Moneda *
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
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
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        País
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Ej: USA, España, Alemania"
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    >
                                        {editingMarket ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Nota informativa */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Nota:</strong> Puede editar los mercados directamente en la tabla haciendo clic en las celdas. 
                        Los cambios se guardarán automáticamente. La moneda y país de cada mercado se utilizarán para 
                        asignar automáticamente estos valores a los activos importados.
                    </p>
                </div>
            </div>
        </Layout>
    );
}

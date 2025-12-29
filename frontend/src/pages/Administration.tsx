/**
 * Página de Administración - Gestión de Mercados
 */
import { useEffect, useState, useRef, useMemo } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { getActionRenderer } from '../utils/handsontableUtils';

interface Market {
    id: string;
    name: string;
    currency: string;
    country: string;
}

export default function Administration() {
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        currency: '',
        country: ''
    });

    // Definición de columnas para Handsontable
    const columns = useMemo(() => [
        { data: 'name', title: 'Nombre del Mercado', width: 200, className: 'htLeft' },
        {
            data: 'currency',
            title: 'Moneda',
            width: 120,
            type: 'dropdown',
            source: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'BRL']
        },
        { data: 'country', title: 'País', width: 150, className: 'htLeft' },
        {
            data: 'id',
            title: 'Acciones',
            width: 120,
            renderer: getActionRenderer([
                { name: 'edit', tooltip: 'Editar' },
                { name: 'delete', tooltip: 'Eliminar' }
            ]),
            readOnly: true
        }
    ], []);

    /**
     * Inicializa la instancia de Handsontable
     */
    const initializeHandsontable = () => {
        if (!hotTableRef.current) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: markets,
            columns: columns,
            colHeaders: columns.map(c => c.title),
            rowHeaders: true,
            height: '100%',
            width: '100%',
            stretchH: 'all',
            autoWrapRow: true,
            autoWrapCol: true,
            licenseKey: 'non-commercial-and-evaluation',
            columnSorting: true,
            filters: true,
            dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
            className: 'handsontable-dark',
            afterChange: (changes, source) => {
                if (!changes || source === 'loadData') return;

                changes.forEach(([row, _prop, oldValue, newValue]) => {
                    if (oldValue !== newValue) {
                        const rowData = hotInstance.current?.getSourceDataAtRow(row) as Market;
                        if (rowData) handleCellValueChanged(rowData);
                    }
                });
            }
        });

        // Registrar listener de clics para acciones
        hotTableRef.current.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;

            // Alternativa: usar las coordenadas de Handsontable para obtener el dato
            const coords = hotInstance.current?.getCoords(target as HTMLTableCellElement);
            if (coords && coords.row >= 0) {
                const rowData = hotInstance.current?.getSourceDataAtRow(coords.row) as Market;
                if (rowData && action) {
                    if (action === 'edit') handleEdit(rowData);
                    else if (action === 'delete') handleDelete(rowData.id);
                }
            }
        });
    };

    /**
     * Actualiza los datos de la tabla cuando cambian los mercados
     */
    useEffect(() => {
        if (hotTableRef.current && !hotInstance.current && markets.length >= 0) {
            initializeHandsontable();
        } else if (hotInstance.current) {
            hotInstance.current.loadData(markets);
        }
    }, [markets]);

    /**
     * Limpieza al desmontar
     */
    useEffect(() => {
        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        loadMarkets();
    }, []);

    /**
     * Carga los mercados desde la API
     */
    const loadMarkets = async () => {
        try {
            const response = await api.get('/markets');
            setMarkets(response.data);
        } catch (error) {
            console.error('Error loading markets:', error);
            toast.error('Error al cargar los mercados');
        }
    };

    /**
     * Maneja el guardado automático tras editar una celda
     */
    const handleCellValueChanged = async (updatedMarket: Market) => {
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

    /**
     * Abre el formulario para editar un mercado
     */
    const handleEdit = (market: Market) => {
        setEditingMarket(market);
        setFormData({
            name: market.name,
            currency: market.currency,
            country: market.country || ''
        });
        setShowForm(true);
    };

    /**
     * Elimina un mercado
     */
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

    /**
     * Maneja el envío del formulario (Crear/Editar)
     */
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

    /**
     * Cancela la edición y cierra el formulario
     */
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

                    {/* Tabla Handsontable */}
                    <div className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden">
                        <div ref={hotTableRef} className="w-full h-full"></div>
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

/**
 * Página de Importación de Datos
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Import() {
    const [loading, setLoading] = useState(false);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState('');
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [showCoverageModal, setShowCoverageModal] = useState(false);
    const [coverageData, setCoverageData] = useState<any>(null);
    const [importingBulk, setImportingBulk] = useState(false);

    const handleImportHistorical = async () => {
        setLoading(true);
        try {
            // Obtener cobertura de todos los activos
            const response = await api.get('/quotes/assets/coverage');
            setCoverageData(response.data);
            setShowCoverageModal(true);
        } catch (error: any) {
            console.error('Error:', error);
            if (error.response?.status === 401) {
                toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                window.location.href = '/login';
            } else {
                const errorMsg = error.response?.data?.detail || 'Error al obtener información de cobertura.';
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStartBulkImport = async (forceRefresh: boolean = false) => {
        setImportingBulk(true);
        try {
            const response = await api.post('/quotes/import/bulk-historical', {
                force_refresh: forceRefresh
            });
            
            toast.success(response.data.message, { autoClose: 5000 });
            toast.info('La importación se está ejecutando en segundo plano. Esto puede tardar varios minutos.');
            
            // Cerrar modal y refrescar después de unos segundos
            setTimeout(() => {
                setShowCoverageModal(false);
                handleImportHistorical(); // Refrescar cobertura
            }, 3000);
            
        } catch (error: any) {
            console.error('Error:', error);
            const errorMsg = error.response?.data?.detail || 'Error al iniciar importación masiva.';
            toast.error(errorMsg);
        } finally {
            setImportingBulk(false);
        }
    };

    const handleImportLatest = async () => {
        setLoading(true);
        try {
            const response = await api.post('/quotes/sync-all');
            toast.success(response.data.message);
            toast.info('La sincronización se está ejecutando en segundo plano.');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar. Por favor, inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPortfolios();
        loadAssets();
    }, []);

    const loadPortfolios = async () => {
        try {
            const response = await api.get('/portfolios');
            setPortfolios(response.data);
            if (response.data.length > 0) {
                setSelectedPortfolio(response.data[0].id);
            }
        } catch (error) {
            console.error('Error loading portfolios:', error);
            toast.error('Error al cargar las carteras.');
        }
    };

    const loadAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
            if (response.data.length > 0) {
                // No seleccionamos uno por defecto para forzar la elección
            }
        } catch (error) {
            console.error('Error loading assets:', error);
            toast.error('Error al cargar los activos.');
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedPortfolio) {
            toast.error('Por favor, selecciona una cartera primero.');
            e.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(
                `/import/transactions/excel/${selectedPortfolio}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const result = response.data;

            if (result.success) {
                let message = result.message;

                toast.success(message, { autoClose: 5000 });

                // Si hay errores específicos, mostrarlos en consola
                if (result.errors && result.errors.length > 0) {
                    console.group('📋 Detalle de filas omitidas durante la importación:');
                    console.table(result.errors.map((err: string, idx: number) => ({
                        '#': idx + 1,
                        'Error': err
                    })));
                    console.log('Errores detallados:');
                    result.errors.forEach((err: string, idx: number) => {
                        console.log(`  ${idx + 1}. ${err}`);
                    });
                    console.groupEnd();

                    // Mostrar solo un resumen si hay muchos errores
                    if (result.errors.length > 5) {
                        toast.info(`ℹ️ ${result.errors.length} filas fueron omitidas. Ver consola para detalles completos.`, { autoClose: 7000 });
                    } else {
                        toast.info(`ℹ️ Algunas filas fueron omitidas. Ver consola para detalles.`, { autoClose: 5000 });
                    }
                }
            }
        } catch (error: any) {
            console.error('Error:', error);
            const errorMsg = error.response?.data?.detail || 'Error al importar Excel.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleImportQuotesExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedAsset) {
            toast.error('Por favor, selecciona un activo primero.');
            e.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(
                `/quotes/import/excel/${selectedAsset}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const result = response.data;

            if (result.success) {
                toast.success(result.message, { autoClose: 5000 });

                if (result.errors && result.errors.length > 0) {
                    console.group('📋 Detalle de errores en importación de cotizaciones:');
                    console.table(result.errors);
                    console.groupEnd();
                    toast.info(`ℹ️ Hubo algunos errores menores. Ver consola.`);
                }
            }
        } catch (error: any) {
            console.error('Error:', error);
            const errorMsg = error.response?.data?.detail || 'Error al importar cotizaciones.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <Layout>
            <div className="h-full overflow-y-auto p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Compact Header */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            📥 Importación de Datos
                        </h1>
                        <div className="flex gap-2">
                            {loading && (
                                <div className="flex items-center gap-2 text-xs text-dark-muted">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                    Procesando...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-none">
                        {/* Importar Históricos Card */}
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Histórico de Cotizaciones</h2>
                                <p className="text-xs text-dark-muted mb-4">
                                    Importa el historial completo para activos nuevos.
                                </p>
                            </div>
                            <button
                                onClick={handleImportHistorical}
                                disabled={loading}
                                className="w-full bg-dark-bg hover:bg-primary/20 border border-dark-border hover:border-primary text-white text-xs py-2 rounded transition-all font-medium disabled:opacity-50"
                            >
                                {loading ? 'Importando...' : 'Iniciar Importación'}
                            </button>
                        </div>

                        {/* Actualizar Últimas Card */}
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Últimas Cotizaciones</h2>
                                <p className="text-xs text-dark-muted mb-4">
                                    Actualiza precios actuales de todos los activos.
                                </p>
                            </div>
                            <button
                                onClick={handleImportLatest}
                                disabled={loading}
                                className="w-full bg-dark-bg hover:bg-green-500/20 border border-dark-border hover:border-green-500 text-white text-xs py-2 rounded transition-all font-medium disabled:opacity-50"
                            >
                                {loading ? 'Actualizando...' : 'Actualizar Precios'}
                            </button>
                        </div>
                    </div>

                    {/* Importar Excel Section - Primary focus */}
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Importar Transacciones (Excel)</h2>
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] text-dark-muted uppercase font-semibold">Cartera Destino:</span>
                                <select
                                    value={selectedPortfolio}
                                    onChange={(e) => setSelectedPortfolio(e.target.value)}
                                    className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary min-w-[150px]"
                                    disabled={loading}
                                >
                                    <option value="">Seleccionar cartera...</option>
                                    {portfolios.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
                            <div className="space-y-4">
                                <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
                                    <h3 className="text-[10px] text-dark-muted uppercase font-bold mb-2">Formato de Archivo Requerido</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left text-[10px]">
                                            <thead className="text-dark-muted border-b border-dark-border">
                                                <tr>
                                                    <th className="pb-1 pr-2">Fecha</th>
                                                    <th className="pb-1 pr-2">Valor</th>
                                                    <th className="pb-1 pr-2">Operación</th>
                                                    <th className="pb-1 pr-2">Títulos</th>
                                                    <th className="pb-1 pr-2">Precio</th>
                                                    <th className="pb-1">Gastos</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-dark-text pt-1">
                                                <tr>
                                                    <td className="py-1 pr-2 text-white">20/11/2025</td>
                                                    <td className="py-1 pr-2">TESLA (TSLA)</td>
                                                    <td className="py-1 pr-2">COMPRA</td>
                                                    <td className="py-1 pr-2">10</td>
                                                    <td className="py-1 pr-2">419.00</td>
                                                    <td className="py-1">23.01</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="border border-dashed border-dark-border rounded-lg p-6 flex flex-col items-center justify-center bg-dark-bg/30">
                                    <input
                                        type="file"
                                        id="excel-upload"
                                        accept=".xlsx,.xls"
                                        onChange={handleImportExcel}
                                        disabled={loading || !selectedPortfolio}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="excel-upload"
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${loading || !selectedPortfolio
                                            ? 'bg-dark-border text-dark-muted cursor-not-allowed'
                                            : 'bg-primary hover:bg-primary-dark text-white'
                                            }`}
                                    >
                                        {loading ? 'Procesando Archivo...' : 'Seleccionar Archivo Excel'}
                                    </label>
                                    <p className="mt-2 text-[10px] text-dark-muted">Soporta formatos .xlsx y .xls</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-dark-bg/50 border border-dark-border rounded-lg p-3">
                                    <h3 className="text-[10px] text-blue-400 uppercase font-bold mb-2 flex items-center gap-1">
                                        <span className="text-xs">ℹ️</span> Instrucciones de Importación
                                    </h3>
                                    <ul className="text-[10px] text-dark-muted space-y-2">
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Operaciones:</strong> "COMPRA ACCIONES", "VENTA ACCIONES", DIVIDENDOS, SPLITS.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Automatización:</strong> Los activos nuevos se crearán automáticamente.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Símbolos:</strong> Asegúrate de usar el símbolo correcto (ej: TSLA, AAPL).</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Fechas:</strong> Formato estándar DD/MM/YYYY.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                                    <h3 className="text-[10px] text-orange-400 uppercase font-bold mb-1 flex items-center gap-1">
                                        <span className="text-xs">⚠️</span> Límites de API (Alpha Vantage)
                                    </h3>
                                    <p className="text-[10px] text-dark-muted leading-relaxed">
                                        El plan gratuito limita a 5 peticiones/minuto y 500/día. La importación puede pausarse automáticamente para respetar estos límites.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Importar Cotizaciones Section */}
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Importar Cotizaciones (Excel)</h2>
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] text-dark-muted uppercase font-semibold">Activo:</span>
                                <select
                                    value={selectedAsset}
                                    onChange={(e) => setSelectedAsset(e.target.value)}
                                    className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary min-w-[200px]"
                                    disabled={loading}
                                >
                                    <option value="">Seleccionar activo...</option>
                                    {assets.map((a) => (
                                        <option key={a.id} value={a.id}>{a.symbol} - {a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
                            <div className="space-y-4">
                                <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
                                    <h3 className="text-[10px] text-dark-muted uppercase font-bold mb-2">Formato de Archivo Requerido</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left text-[10px]">
                                            <thead className="text-dark-muted border-b border-dark-border">
                                                <tr>
                                                    <th className="pb-1 pr-2">Fecha</th>
                                                    <th className="pb-1 pr-2">Último</th>
                                                    <th className="pb-1 pr-2">Apertura</th>
                                                    <th className="pb-1 pr-2">Máximo</th>
                                                    <th className="pb-1 pr-2">Mínimo</th>
                                                    <th className="pb-1">Vol.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-dark-text pt-1">
                                                <tr>
                                                    <td className="py-1 pr-2 text-white">18/12/2025</td>
                                                    <td className="py-1 pr-2">175,28</td>
                                                    <td className="py-1 pr-2">174,4</td>
                                                    <td className="py-1 pr-2">176,13</td>
                                                    <td className="py-1 pr-2">171,82</td>
                                                    <td className="py-1">103,34M</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="border border-dashed border-dark-border rounded-lg p-6 flex flex-col items-center justify-center bg-dark-bg/30">
                                    <input
                                        type="file"
                                        id="quotes-upload"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleImportQuotesExcel}
                                        disabled={loading || !selectedAsset}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="quotes-upload"
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${loading || !selectedAsset
                                            ? 'bg-dark-border text-dark-muted cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                    >
                                        {loading ? 'Procesando Cotizaciones...' : 'Seleccionar Archivo de Cotizaciones'}
                                    </label>
                                    <p className="mt-2 text-[10px] text-dark-muted">Soporta .xlsx, .xls y .csv</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-dark-bg/50 border border-dark-border rounded-lg p-3">
                                    <h3 className="text-[10px] text-blue-400 uppercase font-bold mb-2 flex items-center gap-1">
                                        <span className="text-xs">ℹ️</span> Notas sobre Formato
                                    </h3>
                                    <ul className="text-[10px] text-dark-muted space-y-2">
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Decimales:</strong> Usa coma (,) para decimales.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Volumen:</strong> Acepta sufijos como M (millones) o K (miles).</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white font-bold">•</span>
                                            <span><strong>Duplicados:</strong> Si una cotización ya existe para esa fecha y activo, se omitirá automáticamente.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Cobertura */}
            {showCoverageModal && coverageData && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-surface border border-dark-border rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-dark-border flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Estado de Cotizaciones</h2>
                                <p className="text-xs text-dark-muted mt-1">
                                    {coverageData.stats.total_assets} activos • {coverageData.stats.no_data} sin datos • {coverageData.stats.incomplete_data} incompletos • {coverageData.stats.complete} completos
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCoverageModal(false)}
                                className="text-dark-muted hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Botones de Acción */}
                        <div className="p-4 border-b border-dark-border flex gap-3">
                            <button
                                onClick={() => handleStartBulkImport(false)}
                                disabled={importingBulk || coverageData.stats.no_data + coverageData.stats.incomplete_data + coverageData.stats.outdated === 0}
                                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importingBulk ? 'Importando...' : `Importar Faltantes (${coverageData.stats.no_data + coverageData.stats.incomplete_data + coverageData.stats.outdated})`}
                            </button>
                            <button
                                onClick={() => handleStartBulkImport(true)}
                                disabled={importingBulk}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium disabled:opacity-50"
                            >
                                {importingBulk ? 'Importando...' : 'Forzar Reimportar Todo'}
                            </button>
                            <div className="flex-1"></div>
                            <button
                                onClick={() => handleImportHistorical()}
                                disabled={importingBulk}
                                className="px-4 py-2 bg-dark-bg hover:bg-dark-border text-white rounded text-sm font-medium"
                            >
                                🔄 Refrescar
                            </button>
                        </div>

                        {/* Tabla de Cobertura */}
                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-dark-surface">
                                    <tr className="border-b border-dark-border">
                                        <th className="text-left py-2 px-3 text-dark-muted font-semibold">Símbolo</th>
                                        <th className="text-left py-2 px-3 text-dark-muted font-semibold">Nombre</th>
                                        <th className="text-right py-2 px-3 text-dark-muted font-semibold">Cotizaciones</th>
                                        <th className="text-center py-2 px-3 text-dark-muted font-semibold">Primera</th>
                                        <th className="text-center py-2 px-3 text-dark-muted font-semibold">Última</th>
                                        <th className="text-center py-2 px-3 text-dark-muted font-semibold">Días</th>
                                        <th className="text-center py-2 px-3 text-dark-muted font-semibold">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coverageData.assets.map((asset: any) => {
                                        const statusConfig = {
                                            'no_data': { color: 'text-red-400', bg: 'bg-red-500/20', icon: '🔴', label: 'Sin datos' },
                                            'incomplete_data': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '🟡', label: 'Incompleto' },
                                            'outdated': { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '🟠', label: 'Desactualizado' },
                                            'complete': { color: 'text-green-400', bg: 'bg-green-500/20', icon: '🟢', label: 'Completo' }
                                        };
                                        
                                        const status = statusConfig[asset.reason as keyof typeof statusConfig] || statusConfig['no_data'];
                                        
                                        return (
                                            <tr key={asset.asset_id} className="border-b border-dark-border/50 hover:bg-dark-border/30">
                                                <td className="py-2 px-3 font-mono text-white">{asset.symbol}</td>
                                                <td className="py-2 px-3 text-dark-muted">{asset.name}</td>
                                                <td className="py-2 px-3 text-right text-white font-semibold">
                                                    {asset.coverage.total_quotes || 0}
                                                </td>
                                                <td className="py-2 px-3 text-center text-dark-muted">
                                                    {asset.coverage.first_date || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-center text-dark-muted">
                                                    {asset.coverage.last_date || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-center text-dark-muted">
                                                    {asset.coverage.days_since_last_update !== null ? asset.coverage.days_since_last_update : '-'}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className={`${status.bg} ${status.color} px-2 py-1 rounded text-[10px] font-semibold`}>
                                                        {status.icon} {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer con notas */}
                        <div className="p-4 border-t border-dark-border bg-dark-bg/50">
                            <div className="text-[10px] text-dark-muted space-y-1">
                                <p>• <strong className="text-white">Completo:</strong> ≥400 cotizaciones (aprox. 1.5 años de datos)</p>
                                <p>• <strong className="text-white">Desactualizado:</strong> Más de 7 días sin actualizar</p>
                                <p>• <strong className="text-white">Importación:</strong> Usa Polygon.io (hasta 500 días) con rate limit de 5 req/min</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

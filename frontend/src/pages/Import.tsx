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

    const handleImportHistorical = async () => {
        setLoading(true);
        try {
            // TODO: Implementar importación masiva de históricos
            toast.info('Funcionalidad en desarrollo');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al importar. Por favor, inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleImportLatest = async () => {
        setLoading(true);
        try {
            // TODO: Implementar actualización de últimas cotizaciones
            toast.info('Funcionalidad en desarrollo');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar. Por favor, inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPortfolios();
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

    return (
        <Layout>
            <div className="space-y-6 max-w-4xl">
                <h1 className="text-3xl font-bold">Importación de Datos</h1>

                {/* Importar Históricos */}
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">Importar Cotizaciones Históricas</h2>
                    <p className="text-dark-muted text-sm mb-4">
                        Importa el historial completo de cotizaciones para todos los activos nuevos
                        que no tengan datos en la base de datos.
                    </p>
                    <button
                        onClick={handleImportHistorical}
                        disabled={loading}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? 'Importando...' : 'Importar Históricos'}
                    </button>
                </div>

                {/* Actualizar Últimas */}
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">Actualizar Últimas Cotizaciones</h2>
                    <p className="text-dark-muted text-sm mb-4">
                        Actualiza las cotizaciones más recientes para todos los activos registrados.
                    </p>
                    <button
                        onClick={handleImportLatest}
                        disabled={loading}
                        className="bg-success hover:bg-success/80 text-white px-6 py-3 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? 'Actualizando...' : 'Actualizar Cotizaciones'}
                    </button>
                </div>

                {/* Importar Excel */}
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">Importar Transacciones desde Excel</h2>
                    <p className="text-dark-muted text-sm mb-4">
                        Importa múltiples transacciones desde un archivo Excel con el siguiente formato:
                    </p>
                    
                    <div className="bg-dark-bg border border-dark-border rounded p-3 mb-4 text-xs font-mono overflow-x-auto">
                        <table className="text-left">
                            <thead className="text-dark-muted">
                                <tr>
                                    <th className="pr-4">Fecha</th>
                                    <th className="pr-4">Valor</th>
                                    <th className="pr-4">Tipo de Operación</th>
                                    <th className="pr-4">Títulos</th>
                                    <th className="pr-4">Precio</th>
                                    <th className="pr-4">Gastos</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="pr-4">20/11/2025</td>
                                    <td className="pr-4">TESLA MOTORS<br/>TSLA</td>
                                    <td className="pr-4">COMPRA ACCIONES</td>
                                    <td className="pr-4">10</td>
                                    <td className="pr-4">419</td>
                                    <td className="pr-4">23.01</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Seleccionar Cartera *</label>
                        <select
                            value={selectedPortfolio}
                            onChange={(e) => setSelectedPortfolio(e.target.value)}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                            disabled={loading}
                        >
                            <option value="">Seleccionar cartera...</option>
                            {portfolios.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Archivo Excel *</label>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleImportExcel}
                            disabled={loading || !selectedPortfolio}
                            className="block w-full text-sm text-dark-text
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary file:text-white
                         hover:file:bg-primary-dark
                         file:cursor-pointer cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="bg-info/10 border border-info rounded p-3 text-sm">
                        <strong className="text-info">ℹ️ Tipos de operaciones soportadas:</strong>
                        <ul className="mt-2 space-y-1 text-dark-muted">
                            <li>• <strong>Compra/Venta:</strong> "COMPRA ACCIONES" o "VENTA ACCIONES"</li>
                            <li>• <strong>Operaciones corporativas (informativas):</strong> SPLIT, DIVIDENDO, CAMBIO DE CODIGO ISIN, etc.</li>
                            <li>• Si un activo no existe, se registrará automáticamente</li>
                            <li>• El símbolo debe estar en mayúsculas (ej: TSLA, AAPL)</li>
                            <li>• La fecha debe estar en formato DD/MM/YYYY</li>
                        </ul>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-warning/10 border border-warning rounded-lg p-4">
                    <h3 className="font-semibold text-warning mb-2">⚠️ Límites de API</h3>
                    <p className="text-sm text-dark-muted">
                        Alpha Vantage (plan gratuito) permite 5 peticiones por minuto y 500 por día.
                        Las importaciones masivas pueden tardar varios minutos.
                    </p>
                </div>
            </div>
        </Layout>
    );
}

/**
 * Página de Importación de Datos
 */
import { useState } from 'react';
import Layout from '../components/Layout';

export default function Import() {
    const [loading, setLoading] = useState(false);

    const handleImportHistorical = async () => {
        setLoading(true);
        try {
            // TODO: Implementar importación masiva de históricos
            alert('Funcionalidad en desarrollo');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al importar');
        } finally {
            setLoading(false);
        }
    };

    const handleImportLatest = async () => {
        setLoading(true);
        try {
            // TODO: Implementar actualización de últimas cotizaciones
            alert('Funcionalidad en desarrollo');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            // TODO: Implementar importación desde Excel
            alert('Funcionalidad en desarrollo');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al importar Excel');
        } finally {
            setLoading(false);
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
                        Importa múltiples transacciones de una cartera desde un archivo Excel.
                        El archivo debe tener las columnas: Fecha, Activo, Tipo (C/V), Cantidad, Precio.
                    </p>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportExcel}
                        disabled={loading}
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

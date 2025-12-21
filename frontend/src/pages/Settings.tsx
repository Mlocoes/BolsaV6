/**
 * Página de Configuración de Usuario
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useUser } from '../context/UserContext';

const SUPPORTED_CURRENCIES = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
    { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
    { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
    { code: 'CHF', name: 'Franco suizo', symbol: 'CHF' },
    { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$' },
];

export default function Settings() {
    const { user, loading, updateBaseCurrency } = useUser();
    const [selectedCurrency, setSelectedCurrency] = useState(user?.base_currency || 'EUR');
    const [saving, setSaving] = useState(false);

    // Actualizar selectedCurrency cuando el usuario se cargue
    useEffect(() => {
        if (user?.base_currency) {
            setSelectedCurrency(user.base_currency);
        }
    }, [user?.base_currency]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateBaseCurrency(selectedCurrency);
            toast.success('Moneda base actualizada correctamente');
        } catch (error) {
            console.error('Error updating currency:', error);
            toast.error('Error al actualizar la moneda base');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="text-center py-20">Cargando...</div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <p className="text-red-500">Error al cargar datos del usuario</p>
                    <button 
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Ir al login
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Configuración</h1>
                    <p className="text-dark-muted mt-1">
                        Ajusta tus preferencias personales
                    </p>
                </div>

                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                    {/* Sección de información del usuario */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4">Información Personal</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-dark-muted mb-1">
                                    Usuario
                                </label>
                                <div className="text-white bg-dark-bg border border-dark-border rounded px-3 py-2">
                                    {user.username}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-muted mb-1">
                                    Email
                                </label>
                                <div className="text-white bg-dark-bg border border-dark-border rounded px-3 py-2">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección de moneda base */}
                    <div className="border-t border-dark-border pt-8">
                        <h2 className="text-lg font-semibold text-white mb-4">Preferencias de Moneda</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                Moneda Base
                            </label>
                            <p className="text-xs text-dark-muted mb-4">
                                Todos los valores del dashboard se convertirán a esta moneda automáticamente
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                    <button
                                        key={currency.code}
                                        onClick={() => setSelectedCurrency(currency.code)}
                                        className={`
                                            flex items-center justify-between p-4 rounded-lg border-2 transition-colors
                                            ${selectedCurrency === currency.code
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-dark-border bg-dark-bg hover:border-dark-muted'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{currency.symbol}</span>
                                            <div className="text-left">
                                                <div className="text-white font-medium">{currency.code}</div>
                                                <div className="text-xs text-dark-muted">{currency.name}</div>
                                            </div>
                                        </div>
                                        {selectedCurrency === currency.code && (
                                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedCurrency(user.base_currency)}
                                disabled={selectedCurrency === user.base_currency || saving}
                                className="px-4 py-2 text-dark-muted hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={selectedCurrency === user.base_currency || saving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-200">
                            <p className="font-medium mb-1">Nota sobre conversión de monedas</p>
                            <p className="text-blue-300">
                                Los valores se convierten usando tasas de cambio de Yahoo Finance. 
                                Los costos originales de tus inversiones no se modifican, solo la visualización.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

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
                <div className="h-full flex items-center justify-center bg-dark-bg text-dark-muted">
                    Cargando configuración...
                </div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div className="h-full flex flex-col items-center justify-center bg-dark-bg text-dark-muted">
                    <p className="text-red-400 mb-4">Error al cargar datos del usuario</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                    >
                        Ir al login
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-4xl mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Action inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                ⚙️ Configuración
                            </h1>
                            <p className="text-xs text-dark-muted mt-1 hidden sm:block">
                                Ajusta tus preferencias personales y de visualización
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={selectedCurrency === user.base_currency || saving}
                            className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-xs transition-colors font-medium border border-primary shadow-sm"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    {/* Content Container with Scroll */}
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">

                        {/* Sección de Información Personal */}
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-dark-border">
                                Información Personal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">
                                        Usuario
                                    </label>
                                    <div className="text-sm text-white bg-dark-bg border border-dark-border rounded px-3 py-2 font-mono">
                                        {user.username}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">
                                        Email
                                    </label>
                                    <div className="text-sm text-white bg-dark-bg border border-dark-border rounded px-3 py-2 font-mono">
                                        {user.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección de Preferencias de Moneda */}
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-dark-border">
                                Visualización de Moneda
                            </h2>

                            <div className="mb-4">
                                <p className="text-xs text-dark-muted mb-3 leading-relaxed">
                                    Selecciona tu moneda base principal. Todos los valores y totales en el dashboard se convertirán automáticamente a esta moneda para ofrecerte una visión unificada de tu patrimonio.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {SUPPORTED_CURRENCIES.map((currency) => (
                                        <button
                                            key={currency.code}
                                            onClick={() => setSelectedCurrency(currency.code)}
                                            className={`
                                                relative flex items-center p-3 rounded-lg border transition-all duration-200 text-left group
                                                ${selectedCurrency === currency.code
                                                    ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                                                    : 'border-dark-border bg-dark-bg hover:border-dark-muted hover:bg-dark-bg/80'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                flex items-center justify-center w-8 h-8 rounded-full mr-3 text-lg font-bold
                                                ${selectedCurrency === currency.code ? 'bg-primary text-white' : 'bg-dark-surface text-dark-muted group-hover:text-white'}
                                            `}>
                                                {currency.symbol}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${selectedCurrency === currency.code ? 'text-primary-light' : 'text-white'}`}>
                                                    {currency.code}
                                                </div>
                                                <div className="text-[10px] text-dark-muted uppercase tracking-wide">
                                                    {currency.name}
                                                </div>
                                            </div>
                                            {selectedCurrency === currency.code && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Nota informativa */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
                            <div className="text-blue-400 mt-0.5">ℹ️</div>
                            <div className="text-xs text-blue-200">
                                <p className="font-semibold mb-0.5">Sobre las conversiones</p>
                                <p className="opacity-80 leading-relaxed">
                                    Las conversiones se realizan utilizando tasas de cambio en tiempo real proporcionadas por Yahoo Finance.
                                    Los costos e importes originales de tus transacciones se mantienen intactos en la base de datos; esta configuración solo afecta a cómo se visualizan los totales agregados.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}

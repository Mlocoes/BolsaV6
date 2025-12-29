/**
 * Página de Configuración de Usuario Premium
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useAuthStore } from '../stores/authStore';

const SUPPORTED_CURRENCIES = [
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', name: 'Dólar USA', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', name: 'Libra', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'CAD', name: 'Dólar Canadiense', symbol: 'C$', flag: '🇨🇦' },
];

export default function Settings() {
    const { user, isLoading, updateProfile } = useAuthStore();

    // State para Monedad Base
    const [selectedCurrency, setSelectedCurrency] = useState(user?.base_currency || 'EUR');

    // State para Email
    const [email, setEmail] = useState(user?.email || '');

    // State para Seguridad
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [saving, setSaving] = useState({
        currency: false,
        profile: false,
        security: false
    });

    // Sincronizar con el usuario cargado
    useEffect(() => {
        if (user) {
            setSelectedCurrency(user.base_currency);
            setEmail(user.email);
        }
    }, [user]);

    /**
     * Guardar Cambio de Moneda
     */
    const handleSaveCurrency = async () => {
        try {
            setSaving(prev => ({ ...prev, currency: true }));
            await updateProfile({ base_currency: selectedCurrency });
            toast.success('Moneda base actualizada');
        } catch (error) {
            toast.error('Error al actualizar moneda');
        } finally {
            setSaving(prev => ({ ...prev, currency: false }));
        }
    };

    /**
     * Guardar Cambio de Perfil (Email)
     */
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email === user?.email) return;

        try {
            setSaving(prev => ({ ...prev, profile: true }));
            await updateProfile({ email });
            toast.success('Email actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar email');
        } finally {
            setSaving(prev => ({ ...prev, profile: false }));
        }
    };

    /**
     * Guardar Cambio de Contraseña
     */
    const handleSaveSecurity = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            return toast.error('Las contraseñas nuevas no coinciden');
        }

        if (passwords.new.length < 6) {
            return toast.error('La contraseña debe tener al menos 6 caracteres');
        }

        try {
            setSaving(prev => ({ ...prev, security: true }));
            // En el backend, update_user permite cambiar password
            // OJO: current password no se valida en este endpoint específico según vi en users.py,
            // pero lo incluimos por seguridad visual y futura implementación.
            await updateProfile({ password: passwords.new });
            toast.success('Contraseña actualizada correctamente');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            toast.error('Error al actualizar contraseña');
        } finally {
            setSaving(prev => ({ ...prev, security: false }));
        }
    };

    if (isLoading && !user) {
        return (
            <Layout>
                <div className="h-full flex items-center justify-center bg-dark-bg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!user) return null;

    return (
        <Layout>
            <div className="h-full overflow-y-auto p-4 md:p-6 bg-dark-bg custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header Premium */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 to-transparent border border-dark-border rounded-2xl p-6 mb-8">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">Configuración</h1>
                                <p className="text-dark-muted text-sm">Gestiona tus preferencias y la seguridad de tu cuenta</p>
                            </div>
                            <div className="flex items-center gap-3 bg-dark-surface/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-dark-border">
                                <div className="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-lg text-lg">👤</div>
                                <div>
                                    <div className="text-sm font-bold text-white leading-none mb-1">{user.username}</div>
                                    <div className="text-[10px] text-dark-muted uppercase tracking-wider">Usuario {user.is_admin ? 'Administrador' : 'Estándar'}</div>
                                </div>
                            </div>
                        </div>
                        {/* Decoración fondo */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Columna Izquierda: Moneda y Ajustes Visuales */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Moneda Base */}
                            <section className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-dark-border flex justify-between items-center bg-dark-surface/30">
                                    <div className="flex items-center gap-3">
                                        <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">💶</span>
                                        <h2 className="font-bold text-white">Moneda Base</h2>
                                    </div>
                                    <button
                                        onClick={handleSaveCurrency}
                                        disabled={selectedCurrency === user.base_currency || saving.currency}
                                        className="text-xs bg-primary hover:bg-primary-dark disabled:opacity-30 text-white px-4 py-1.5 rounded-lg font-medium transition-all"
                                    >
                                        {saving.currency ? 'Ahorrando...' : 'Guardar'}
                                    </button>
                                </div>
                                <div className="p-5">
                                    <p className="text-xs text-dark-muted mb-4">
                                        Esta es la moneda en la que se mostrarán todos los totales acumulados en la plataforma.
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {SUPPORTED_CURRENCIES.map((c) => (
                                            <button
                                                key={c.code}
                                                onClick={() => setSelectedCurrency(c.code)}
                                                className={`
                                                    relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
                                                    ${selectedCurrency === c.code
                                                        ? 'border-primary bg-primary/5 shadow-inner'
                                                        : 'border-dark-border bg-dark-bg hover:border-dark-muted'
                                                    }
                                                `}
                                            >
                                                <span className="text-2xl mb-1">{c.flag}</span>
                                                <span className={`text-sm font-bold ${selectedCurrency === c.code ? 'text-primary-light' : 'text-white'}`}>
                                                    {c.code}
                                                </span>
                                                <span className="text-[10px] text-dark-muted">{c.name}</span>
                                                {selectedCurrency === c.code && (
                                                    <div className="absolute top-2 right-2 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Información de Perfil */}
                            <section className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-dark-border flex items-center gap-3 bg-dark-surface/30">
                                    <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">📧</span>
                                    <h2 className="font-bold text-white">Correo Electrónico</h2>
                                </div>
                                <div className="p-5">
                                    <form onSubmit={handleSaveProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1.5 tracking-wider">
                                                Dirección de Email
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all pr-24"
                                                    placeholder="tu@email.com"
                                                    required
                                                />
                                                {email !== user.email && (
                                                    <div className="absolute right-2 top-1.5">
                                                        <button
                                                            type="submit"
                                                            disabled={saving.profile}
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors"
                                                        >
                                                            {saving.profile ? '...' : 'ACTUALIZAR'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="mt-2 text-[10px] text-dark-muted">
                                                Usarás este correo para recibir notificaciones y recuperar tu cuenta.
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </section>
                        </div>

                        {/* Columna Derecha: Seguridad y Otros */}
                        <div className="space-y-6">

                            {/* Seguridad */}
                            <section className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-dark-border flex items-center gap-3 bg-dark-surface/30">
                                    <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">🔐</span>
                                    <h2 className="font-bold text-white">Seguridad</h2>
                                </div>
                                <div className="p-5">
                                    <form onSubmit={handleSaveSecurity} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1.5 tracking-wider">
                                                Nueva Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1.5 tracking-wider">
                                                Confirmar Nueva Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                placeholder="Repite la contraseña"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!passwords.new || saving.security}
                                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white font-bold py-2.5 rounded-xl text-xs transition-all mt-2"
                                        >
                                            {saving.security ? 'Actualizando...' : 'CAMBIAR CONTRASEÑA'}
                                        </button>
                                    </form>
                                </div>
                            </section>

                            {/* Info de Sesión */}
                            <section className="bg-dark-surface border border-dark-border rounded-2xl p-5 shadow-sm">
                                <h3 className="text-xs font-bold text-white mb-3">Resumen de Cuenta</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-dark-border/50">
                                        <span className="text-[10px] text-dark-muted uppercase font-semibold">Miembro desde</span>
                                        <span className="text-xs text-white">
                                            {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dark-border/50">
                                        <span className="text-[10px] text-dark-muted uppercase font-semibold">Nivel</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${user.is_admin ? 'bg-primary/20 text-primary-light' : 'bg-dark-muted/20 text-dark-muted'}`}>
                                            {user.is_admin ? 'Admin' : 'Standard'}
                                        </span>
                                    </div>
                                </div>
                            </section>

                        </div>

                    </div>

                    {/* Disclaimer Premium */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4 items-center">
                        <div className="text-2xl">💡</div>
                        <div className="text-xs text-blue-200/80 leading-relaxed">
                            Asegúrate de mantener tu información actualizada. Los cambios en la moneda base afectan únicamente a la visualización de datos y no alteran los valores históricos de tus transacciones.
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}

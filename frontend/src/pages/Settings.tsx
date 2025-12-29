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
            <div className="h-full overflow-y-auto p-4 bg-dark-bg custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-4">

                    {/* Header Compacto */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 to-transparent border border-dark-border rounded-xl p-4">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-white leading-none mb-1">Configuración</h1>
                                <p className="text-dark-muted text-[10px] uppercase tracking-wider">Ajustes de cuenta y preferencias</p>
                            </div>
                            <div className="flex items-center gap-3 bg-dark-surface/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-dark-border">
                                <span className="text-xl">👤</span>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-white leading-none mb-0.5">{user.username}</div>
                                    <div className="text-[9px] text-dark-muted font-medium uppercase">{user.is_admin ? 'Admin' : 'Estándar'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Columna Izquierda (3/5): Ajustes de Perfil y Moneda */}
                        <div className="lg:col-span-3 space-y-4">
                            <section className="bg-dark-surface border border-dark-border rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-dark-border bg-dark-surface/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400">🌍</span>
                                        <h2 className="text-sm font-bold text-white">Preferencia de Moneda</h2>
                                    </div>
                                    <button
                                        onClick={handleSaveCurrency}
                                        disabled={selectedCurrency === user.base_currency || saving.currency}
                                        className="text-[10px] bg-primary hover:bg-primary-dark disabled:opacity-30 text-white px-3 py-1 rounded-md font-bold transition-all uppercase tracking-wider"
                                    >
                                        {saving.currency ? 'Guardando...' : 'Aplicar'}
                                    </button>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                                        {SUPPORTED_CURRENCIES.map((c) => (
                                            <button
                                                key={c.code}
                                                onClick={() => setSelectedCurrency(c.code)}
                                                className={`
                                                    flex flex-col items-center justify-center py-2 rounded-lg border transition-all
                                                    ${selectedCurrency === c.code
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-dark-border bg-dark-bg/50 hover:border-dark-muted'
                                                    }
                                                `}
                                                title={c.name}
                                            >
                                                <span className="text-lg mb-0.5">{c.flag}</span>
                                                <span className={`text-[10px] font-bold ${selectedCurrency === c.code ? 'text-primary-light' : 'text-dark-muted'}`}>
                                                    {c.code}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-dark-muted italic">
                                        * Los totales de la plataforma se convertirán automáticamente a esta moneda.
                                    </p>
                                </div>

                                <div className="p-4 border-t border-dark-border bg-dark-surface/10">
                                    <form onSubmit={handleSaveProfile} className="flex flex-col sm:flex-row items-end gap-3">
                                        <div className="flex-1 w-full">
                                            <label className="block text-[9px] uppercase font-bold text-dark-muted mb-1 tracking-wider">
                                                Correo Electrónico
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={email === user.email || saving.profile}
                                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white text-[9px] font-bold py-2 px-4 rounded-lg transition-colors uppercase whitespace-nowrap"
                                        >
                                            {saving.profile ? '...' : 'Actualizar Email'}
                                        </button>
                                    </form>
                                </div>
                            </section>

                            {/* Aviso */}
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-start">
                                <span className="text-sm">💡</span>
                                <p className="text-[10px] text-blue-200/60 leading-normal">
                                    Mantén tus datos al día para asegurar el acceso a tu cuenta. El cambio de moneda es visual y no afecta a tus registros históricos.
                                </p>
                            </div>
                        </div>

                        {/* Columna Derecha (2/5): Seguridad y Resumen */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Seguridad */}
                            <section className="bg-dark-surface border border-dark-border rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-dark-border bg-dark-surface/30 flex items-center gap-2">
                                    <span className="text-amber-400">🔐</span>
                                    <h2 className="text-sm font-bold text-white">Seguridad</h2>
                                </div>
                                <div className="p-4 space-y-3">
                                    <form onSubmit={handleSaveSecurity} className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] uppercase font-bold text-dark-muted mb-1 tracking-wider">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] uppercase font-bold text-dark-muted mb-1 tracking-wider">Confirmar</label>
                                            <input
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!passwords.new || saving.security}
                                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white font-bold py-2 rounded-lg text-[10px] uppercase transition-all"
                                        >
                                            {saving.security ? 'Actualizando...' : 'Cambiar Contraseña'}
                                        </button>
                                    </form>
                                </div>
                            </section>

                            {/* Cuenta */}
                            <section className="bg-dark-surface border border-dark-border rounded-xl p-4 shadow-sm">
                                <h3 className="text-[10px] font-bold text-dark-muted uppercase tracking-widest mb-3 border-b border-dark-border pb-2 flex items-center gap-2">
                                    <span>📊</span> Resumen de Cuenta
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-dark-muted uppercase font-semibold">Registro</span>
                                        <span className="text-xs text-white font-medium">
                                            {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-dark-muted uppercase font-semibold">Estado</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ring-1 ring-inset ${user.is_admin ? 'bg-primary/10 text-primary-light ring-primary/20' : 'bg-dark-muted/10 text-dark-muted ring-dark-border'}`}>
                                            {user.is_admin ? 'Admin' : 'Personal'}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>

                    </div>

                </div>
            </div>
        </Layout>
    );
}

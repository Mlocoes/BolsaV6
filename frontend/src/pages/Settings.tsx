/**
 * Página de Configuración de Usuario Premium
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import UserManagement from '../components/UserManagement';

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
    const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');

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
            <div className="h-full overflow-hidden p-4 bg-dark-bg flex flex-col space-y-4">

                {/* Header Integrado con Tabs */}
                <div className="bg-dark-surface border border-dark-border rounded-xl p-1 flex-none">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border/50 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xl border border-primary/30">
                                ⚙️
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-none mb-1">Configuración</h1>
                                <p className="text-[9px] text-dark-muted uppercase font-bold tracking-widest">
                                    {activeTab === 'profile' ? 'Ajustes de Cuenta' : 'Panel de Administración'}
                                </p>
                            </div>
                        </div>

                        {/* User Summary Desktop */}
                        <div className="hidden sm:flex items-center gap-3 bg-dark-bg/50 px-3 py-1.5 rounded-lg border border-dark-border">
                            <div className="text-right">
                                <div className="text-xs font-bold text-white leading-none mb-0.5">{user.username}</div>
                                <div className="text-[9px] text-dark-muted font-bold uppercase">{user.is_admin ? '🛡️ Admin' : '👤 Personal'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1 p-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'profile'
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'text-dark-muted hover:bg-dark-bg hover:text-white'
                                }`}
                        >
                            🆔 Mi Perfil
                        </button>
                        {user.is_admin && (
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'users'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-dark-muted hover:bg-dark-bg hover:text-white'
                                    }`}
                            >
                                👥 Usuarios
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {activeTab === 'profile' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-2">
                            {/* Personal Config */}
                            <div className="lg:col-span-3 space-y-4">
                                <section className="bg-dark-surface border border-dark-border rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-dark-border bg-dark-surface/30 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-400">🌍</span>
                                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Moneda Base</h2>
                                        </div>
                                        <button
                                            onClick={handleSaveCurrency}
                                            disabled={selectedCurrency === user.base_currency || saving.currency}
                                            className="text-[10px] bg-primary hover:bg-primary-dark disabled:opacity-30 text-white px-3 py-1 rounded-md font-bold transition-all uppercase tracking-wider"
                                        >
                                            {saving.currency ? '...' : 'Aplicar'}
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {SUPPORTED_CURRENCIES.map((c) => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => setSelectedCurrency(c.code)}
                                                    className={`
                                                        flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all
                                                        ${selectedCurrency === c.code
                                                            ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                            : 'border-dark-border bg-dark-bg/20 hover:border-dark-muted'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-xl mb-1">{c.flag}</span>
                                                    <span className={`text-[10px] font-bold ${selectedCurrency === c.code ? 'text-primary-light' : 'text-dark-muted'}`}>
                                                        {c.code}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-dark-border bg-dark-surface/10">
                                        <form onSubmit={handleSaveProfile} className="flex flex-col sm:flex-row items-end gap-3">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[9px] uppercase font-bold text-dark-muted mb-1 tracking-widest">Email de Contacto</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={email === user.email || saving.profile}
                                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white text-[10px] font-bold py-2.5 px-6 rounded-lg transition-colors uppercase"
                                            >
                                                Actualizar
                                            </button>
                                        </form>
                                    </div>
                                </section>

                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-center">
                                    <span className="text-lg">💡</span>
                                    <p className="text-[10px] text-blue-200/60 leading-normal font-medium flex-1">
                                        El cambio de moneda ajustará automáticamente todos los cálculos de valor de tu cartera en el Dashboard y Posiciones.
                                    </p>
                                </div>
                            </div>

                            {/* Security & Summary */}
                            <div className="lg:col-span-2 space-y-4">
                                <section className="bg-dark-surface border border-dark-border rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-dark-border bg-dark-surface/30 flex items-center gap-2">
                                        <span className="text-amber-400">🔐</span>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Seguridad</h2>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <form onSubmit={handleSaveSecurity} className="space-y-4">
                                            <div>
                                                <label className="block text-[9px] uppercase font-bold text-dark-muted mb-1 tracking-widest">Nueva Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={passwords.new}
                                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all"
                                                    placeholder="Mínimo 8 caracteres"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] uppercase font-bold text-dark-muted mb-1 tracking-widest">Confirmar Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!passwords.new || saving.security}
                                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white font-bold py-2.5 rounded-lg text-[10px] uppercase transition-all shadow-md active:scale-[0.98]"
                                            >
                                                {saving.security ? 'Actualizando...' : 'Cambiar Contraseña'}
                                            </button>
                                        </form>
                                    </div>
                                </section>

                                <section className="bg-dark-surface border border-dark-border rounded-xl p-4 shadow-sm border-l-4 border-l-primary/40">
                                    <h3 className="text-[10px] font-bold text-dark-muted uppercase tracking-widest mb-4 border-b border-dark-border pb-2">
                                        📈 Resumen de Cuenta
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-dark-muted uppercase font-bold">Desde</span>
                                            <span className="text-xs text-white font-mono">
                                                {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-dark-muted uppercase font-bold">Jerarquía</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ring-1 ring-inset ${user.is_admin ? 'bg-primary/20 text-primary-light ring-primary/30' : 'bg-dark-bg text-dark-muted ring-dark-border'}`}>
                                                {user.is_admin ? 'ADMINISTRADOR' : 'USUARIO'}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full animate-in fade-in slide-in-from-right-2">
                            <UserManagement />
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}

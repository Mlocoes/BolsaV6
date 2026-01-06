import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

interface SystemSetting {
    key: string;
    value: string;
    description: string;
    type: string;
    updated_at: string;
}

export function SystemSettingsTab() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/settings/system/');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Error al cargar las configuraciones del sistema');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdate = async (key: string, value: string) => {
        try {
            setSaving(prev => ({ ...prev, [key]: true }));
            await axios.put(`/api/settings/system/${key}`, { value });
            toast.success(`Configuración "${key}" actualizada`);
            fetchSettings();
        } catch (error) {
            console.error('Error updating setting:', error);
            toast.error('Error al actualizar la configuración');
        } finally {
            setSaving(prev => ({ ...prev, [key]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Agrupar configuraciones por tipo o prefijo si fuera necesario, 
    // pero de momento las mostraremos todas ordenadas por descripción.

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <section className="bg-dark-surface border border-dark-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-dark-border bg-dark-surface/30 flex items-center gap-2">
                    <span className="text-primary-light">⚙️</span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Parámetros del Sistema</h2>
                </div>

                <div className="divide-y divide-dark-border">
                    {settings.map((setting) => (
                        <div key={setting.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                            <div className="flex-1">
                                <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-1">
                                    {setting.key.replace(/_/g, ' ')}
                                </h3>
                                <p className="text-[10px] text-dark-muted leading-relaxed">
                                    {setting.description}
                                </p>
                                <p className="text-[8px] text-dark-muted/50 mt-1 uppercase font-mono">
                                    Última actualización: {new Date(setting.updated_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type={setting.type === 'int' ? 'number' : 'text'}
                                    defaultValue={setting.value}
                                    onBlur={(e) => {
                                        if (e.target.value !== setting.value) {
                                            handleUpdate(setting.key, e.target.value);
                                        }
                                    }}
                                    disabled={saving[setting.key]}
                                    className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-all w-24 text-right"
                                />
                                {saving[setting.key] && (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                )}
                            </div>
                        </div>
                    ))}

                    {settings.length === 0 && (
                        <div className="p-8 text-center text-dark-muted text-xs">
                            No se encontraron configuraciones del sistema.
                        </div>
                    )}
                </div>
            </section>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-center">
                <span className="text-lg">⚠️</span>
                <p className="text-[10px] text-amber-200/60 leading-normal font-medium flex-1">
                    Los cambios en los parámetros del sistema pueden afectar a todos los usuarios y procesos en segundo plano inmediatamente.
                </p>
            </div>
        </div>
    );
}

// Comentario explicativo: Componente para gestionar los parámetros globales del sistema desde la pantalla de configuración.

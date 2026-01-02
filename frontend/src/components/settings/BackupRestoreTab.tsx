import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { backupService } from '../../services/backupService';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CircleStackIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export const BackupRestoreTab: React.FC = () => {
    const { portfolios } = usePortfolioStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(portfolios[0]?.id || '');

    // Helper para manejar descargas
    const handleDownload = async (type: string, action: () => Promise<void>) => {
        try {
            setLoading(type);
            await action();
            toast.success('Descarga iniciada correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al descargar el backup');
        } finally {
            setLoading(null);
        }
    };

    // Helper para manejar subidas
    const handleUpload = async (type: string, file: File, action: (f: File) => Promise<void>) => {
        if (!file) return;
        
        if (!window.confirm('¿Estás seguro? Esta acción podría sobrescribir datos existentes.')) {
            return;
        }

        try {
            setLoading(type);
            await action(file);
            toast.success('Restauración completada correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al restaurar el backup');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-dark-card rounded-xl border border-dark-border p-6">
                <h3 className="text-lg font-medium text-dark-text mb-4 flex items-center gap-2">
                    <CircleStackIcon className="w-5 h-5 text-primary" />
                    Backup Completo
                </h3>
                <p className="text-dark-muted text-sm mb-6">
                    Realiza una copia de seguridad completa de toda la base de datos (usuarios, carteras, transacciones, cotizaciones).
                    Al restaurar, se borrarán todos los datos actuales.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => handleDownload('full_download', backupService.downloadFullBackup)}
                        disabled={loading !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {loading === 'full_download' ? 'Descargando...' : (
                            <>
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Descargar Backup Completo
                            </>
                        )}
                    </button>

                    <div className="relative">
                        <input
                            type="file"
                            id="full-restore"
                            className="hidden"
                            accept=".dump"
                            onChange={(e) => e.target.files?.[0] && handleUpload('full_restore', e.target.files[0], backupService.restoreFullBackup)}
                            disabled={loading !== null}
                        />
                        <label
                            htmlFor="full-restore"
                            className={`flex items-center justify-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border text-dark-text rounded-lg hover:bg-dark-hover transition-colors cursor-pointer ${loading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading === 'full_restore' ? 'Restaurando...' : (
                                <>
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    Restaurar Backup Completo
                                </>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-dark-card rounded-xl border border-dark-border p-6">
                <h3 className="text-lg font-medium text-dark-text mb-4 flex items-center gap-2">
                    <TableCellsIcon className="w-5 h-5 text-green-500" />
                    Backup de Cotizaciones
                </h3>
                <p className="text-dark-muted text-sm mb-6">
                    Respalda únicamente la tabla de cotizaciones históricas. Útil si necesitas migrar datos de precios sin afectar usuarios o carteras.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => handleDownload('quotes_download', backupService.downloadQuotesBackup)}
                        disabled={loading !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border text-dark-text rounded-lg hover:bg-dark-hover transition-colors disabled:opacity-50"
                    >
                        {loading === 'quotes_download' ? 'Descargando...' : (
                            <>
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Descargar Cotizaciones
                            </>
                        )}
                    </button>

                    <div className="relative">
                        <input
                            type="file"
                            id="quotes-restore"
                            className="hidden"
                            accept=".dump"
                            onChange={(e) => e.target.files?.[0] && handleUpload('quotes_restore', e.target.files[0], backupService.restoreQuotesBackup)}
                            disabled={loading !== null}
                        />
                        <label
                            htmlFor="quotes-restore"
                            className={`flex items-center justify-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border text-dark-text rounded-lg hover:bg-dark-hover transition-colors cursor-pointer ${loading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading === 'quotes_restore' ? 'Restaurando...' : (
                                <>
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    Restaurar Cotizaciones
                                </>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-dark-card rounded-xl border border-dark-border p-6">
                <h3 className="text-lg font-medium text-dark-text mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                    Backup de Transacciones
                </h3>
                <p className="text-dark-muted text-sm mb-6">
                    Exporta e importa transacciones de una cartera específica en formato JSON. Al restaurar, se reemplazarán las transacciones existentes de la cartera seleccionada.
                </p>
                
                <div className="flex flex-col gap-4">
                    <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-dark-muted mb-1">Seleccionar Cartera</label>
                        <select
                            value={selectedPortfolioId}
                            onChange={(e) => setSelectedPortfolioId(e.target.value)}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {portfolios.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => selectedPortfolioId && handleDownload('trans_download', () => backupService.downloadTransactionsBackup(selectedPortfolioId))}
                            disabled={loading !== null || !selectedPortfolioId}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border text-dark-text rounded-lg hover:bg-dark-hover transition-colors disabled:opacity-50"
                        >
                            {loading === 'trans_download' ? 'Descargando...' : (
                                <>
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Descargar Transacciones
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <input
                                type="file"
                                id="trans-restore"
                                className="hidden"
                                accept=".json"
                                onChange={(e) => e.target.files?.[0] && selectedPortfolioId && handleUpload('trans_restore', e.target.files[0], (f) => backupService.restoreTransactionsBackup(selectedPortfolioId, f))}
                                disabled={loading !== null || !selectedPortfolioId}
                            />
                            <label
                                htmlFor="trans-restore"
                                className={`flex items-center justify-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border text-dark-text rounded-lg hover:bg-dark-hover transition-colors cursor-pointer ${loading !== null || !selectedPortfolioId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading === 'trans_restore' ? 'Restaurando...' : (
                                    <>
                                        <ArrowUpTrayIcon className="w-5 h-5" />
                                        Restaurar Transacciones
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

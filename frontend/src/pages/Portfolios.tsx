/**
 * Página de Gestión de Carteras
 */
import { useEffect, useState, useMemo } from 'react';
import { useHandsontable } from '../hooks/useHandsontable';

import { toast } from 'react-toastify';
import { getActionRenderer } from '../utils/handsontableUtils';
import Layout from '../components/Layout';
import api from '../services/api';
import { usePortfolioStore } from '../stores/portfolioStore';



export default function Portfolios() {

    const { portfolios, loadPortfolios } = usePortfolioStore();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    /**
     * Calcular estadísticas de carteras
     */
    const stats = {
        totalPortfolios: portfolios.length,
        newestPortfolio: portfolios.length > 0
            ? new Date(Math.max(...portfolios.map(p => new Date(p.created_at).getTime()))).toLocaleDateString()
            : '-'
    };



    useEffect(() => {
        loadPortfolios();
    }, []);

    // Inicializar Handsontable
    // Memoized table data
    const tableData = useMemo(() => portfolios, [portfolios]);

    // Use the custom hook for Handsontable
    const { containerRef } = useHandsontable({
        data: tableData,
        colHeaders: ['Nombre', 'Descripción', 'Creada', 'Acciones'],
        columns: [
            { data: 'name', readOnly: true, width: 250, className: 'htLeft' },
            { data: 'description', readOnly: true, width: 350, className: 'htLeft' },
            {
                data: 'created_at',
                readOnly: true,
                width: 150,
                className: 'htRight',
                renderer: (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) => {
                    if (value) {
                        td.textContent = new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
                    } else {
                        td.textContent = '';
                    }
                    td.style.textAlign = 'right';
                    return td;
                }
            },
            {
                data: 'id',
                readOnly: true,
                width: 70,
                className: 'htCenter htMiddle',
                renderer: getActionRenderer([
                    { name: 'delete', tooltip: 'Eliminar Cartera' }
                ])
            }
        ],
        onDelete: (id) => handleDelete(id)
    });

    /**
     * Procesa el envío del formulario de nueva cartera
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/portfolios', formData);
            setShowForm(false);
            setFormData({ name: '', description: '' });
            toast.success('Cartera creada correctamente');
            loadPortfolios();
        } catch (error) {
            console.error('Error creating portfolio:', error);
            toast.error('Error al crear cartera. Por favor, verifique los datos.');
        }
    };

    /**
     * Elimina una cartera tras confirmación
     */
    /**
     * Elimina una cartera tras confirmación
     */
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta cartera?')) return;

        try {
            await api.delete(`/portfolios/${id}`);
            toast.success('Cartera eliminada correctamente');
            loadPortfolios();
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            toast.error('Error al eliminar cartera. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Action inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border flex-none">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            📁 Mis Carteras
                        </h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-1 rounded text-xs transition-colors font-medium"
                        >
                            + Nueva Cartera
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-dark-surface p-4 rounded-lg border border-dark-border mb-0 flex-none animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-wider">Nueva Cartera</h2>
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-dark-muted mb-1">Descripción</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="bg-dark-border hover:bg-dark-border/80 text-white px-3 py-1 rounded text-xs transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs transition-colors font-medium">
                                        Crear
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Summary Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-none">
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Total Carteras</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.totalPortfolios}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Carteras Activas</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.totalPortfolios}
                            </div>
                        </div>
                        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                            <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Última Creación</h3>
                            <div className="text-lg font-bold text-white leading-tight">
                                {stats.newestPortfolio}
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div ref={containerRef} className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden handsontable-dark"></div>
                </div>
            </div>
        </Layout>
    );
}

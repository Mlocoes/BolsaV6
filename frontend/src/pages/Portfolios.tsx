/**
 * Página de Gestión de Carteras
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

interface Portfolio {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export default function Portfolios() {
    const gridRef = useRef<AgGridReact>(null);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
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

    const columnDefs: ColDef[] = [
        { field: 'name', headerName: 'Nombre', flex: 1 },
        { field: 'description', headerName: 'Descripción', flex: 2 },
        {
            field: 'created_at',
            headerName: 'Creada',
            width: 150,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : ''
        },
        {
            headerName: 'Acciones',
            width: 150,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleDelete(params.data.id)}
                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm"
                    >
                        Eliminar
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadPortfolios();
    }, []);

    /**
     * Carga las carteras desde la API
     */
    const loadPortfolios = async () => {
        try {
            const response = await api.get('/portfolios');
            setPortfolios(response.data);
        } catch (error) {
            console.error('Error loading portfolios:', error);
            toast.error('Error al cargar las carteras. Por favor, inténtelo de nuevo.');
        }
    };

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
                    <div className="ag-theme-quartz-dark rounded-lg border border-dark-border flex-1 min-h-[300px]">
                        <AgGridReact
                            ref={gridRef}
                            rowData={portfolios}
                            columnDefs={columnDefs}
                            defaultColDef={{
                                sortable: true,
                                resizable: true,
                                filter: true,
                            }}
                            enableRangeSelection={true}
                            enableRangeHandle={true}
                            enableFillHandle={true}
                            suppressCellFocus={false}
                            copyHeadersToClipboard={true}
                            animateRows={true}
                            onGridReady={(params) => {
                                params.api.sizeColumnsToFit();
                            }}
                            domLayout='normal'
                            containerStyle={{ height: '100%', width: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}

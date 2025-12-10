/**
 * Página de Gestión de Carteras
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
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

    const columnDefs: ColDef[] = [
        { field: 'name', headerName: 'Nombre', flex: 1 },
        { field: 'description', headerName: 'Descripción', flex: 2 },
        {
            field: 'created_at',
            headerName: 'Creada',
            width: 150,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
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

    const loadPortfolios = async () => {
        try {
            const response = await api.get('/portfolios');
            setPortfolios(response.data);
        } catch (error) {
            console.error('Error loading portfolios:', error);
            toast.error('Error al cargar las carteras. Por favor, inténtelo de nuevo.');
        }
    };

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
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Mis Carteras</h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                    >
                        + Nueva Cartera
                    </button>
                </div>

                {showForm && (
                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border mb-4">
                        <h2 className="text-xl font-bold mb-4">Nueva Cartera</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg"
                                    rows={3}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                                    Crear
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="bg-dark-border hover:bg-dark-border/80 text-white px-4 py-2 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="ag-theme-quartz-dark rounded-lg border border-dark-border" style={{ height: '600px', width: '100%', flex: '1 1 auto', minHeight: 0 }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={portfolios}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                            filter: true,
                        }}
                        animateRows={true}
                        suppressCellFocus={true}
                        domLayout='normal'
                    />
                </div>
            </div>
        </Layout>
    );
}

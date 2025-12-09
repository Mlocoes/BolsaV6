/**
 * Página de Gestión de Carteras
 */
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface Portfolio {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export default function Portfolios() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPortfolios();
    }, []);

    const loadPortfolios = async () => {
        try {
            const response = await api.get('/portfolios');
            setPortfolios(response.data);
        } catch (error) {
            console.error('Error loading portfolios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/portfolios', formData);
            setShowModal(false);
            setFormData({ name: '', description: '' });
            loadPortfolios();
        } catch (error) {
            console.error('Error creating portfolio:', error);
            alert('Error al crear cartera');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta cartera?')) return;

        try {
            await api.delete(`/portfolios/${id}`);
            loadPortfolios();
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            alert('Error al eliminar cartera');
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Gestión de Carteras</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                    >
                        + Nueva Cartera
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-dark-muted">Cargando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {portfolios.map((portfolio) => (
                            <div
                                key={portfolio.id}
                                className="bg-dark-surface border border-dark-border rounded-lg p-6"
                            >
                                <h3 className="text-xl font-semibold mb-2">{portfolio.name}</h3>
                                {portfolio.description && (
                                    <p className="text-dark-muted text-sm mb-4">{portfolio.description}</p>
                                )}
                                <div className="text-xs text-dark-muted mb-4">
                                    Creada: {new Date(portfolio.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleDelete(portfolio.id)}
                                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-dark-surface rounded-lg p-6 max-w-md w-full border border-dark-border">
                            <h2 className="text-2xl font-semibold mb-4">Nueva Cartera</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Descripción</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                                    >
                                        Crear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-dark-bg hover:bg-dark-border text-dark-text px-4 py-2 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

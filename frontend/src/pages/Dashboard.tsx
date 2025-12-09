/**
 * Página de Dashboard
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

interface Portfolio {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export default function Dashboard() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
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
            toast.error('Error al cargar las carteras. Por favor, inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <Link
                        to="/portfolios"
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg
                     transition-colors font-medium"
                    >
                        + Nueva Cartera
                    </Link>
                </div>

                {/* Portfolios Grid */}
                {loading ? (
                    <div className="text-center py-12 text-dark-muted">Cargando...</div>
                ) : portfolios.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-dark-muted mb-4">No tienes carteras creadas</p>
                        <Link
                            to="/portfolios"
                            className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg
                       transition-colors font-medium"
                        >
                            Crear mi primera cartera
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((portfolio) => (
                            <Link
                                key={portfolio.id}
                                to={`/positions?portfolio=${portfolio.id}`}
                                className="bg-dark-surface border border-dark-border rounded-lg p-6 
                         hover:border-primary transition-colors group"
                            >
                                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                    {portfolio.name}
                                </h3>
                                {portfolio.description && (
                                    <p className="text-dark-muted text-sm mb-4">{portfolio.description}</p>
                                )}
                                <div className="text-xs text-dark-muted">
                                    Creada: {new Date(portfolio.created_at).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-8">
                    <h2 className="text-xl font-semibold mb-4">Bienvenido a BolsaV6</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="font-medium text-primary mb-2">Gestión de Carteras</h3>
                            <p className="text-dark-muted">
                                Crea y administra múltiples carteras de inversión. Registra tus operaciones
                                de compra y venta para llevar un control detallado.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium text-primary mb-2">Cotizaciones en Tiempo Real</h3>
                            <p className="text-dark-muted">
                                Importa cotizaciones históricas y actuales desde Alpha Vantage. Mantén
                                tus activos actualizados automáticamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

/**
 * Layout principal con navegación
 */
import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/positions', label: 'Posiciones', icon: '💼' },
        { path: '/assets', label: 'Activos', icon: '📈' },
        { path: '/portfolios', label: 'Carteras', icon: '🗂️' },
        { path: '/transactions', label: 'Transacciones', icon: '💰' },
        { path: '/quotes', label: 'Cotizaciones', icon: '📉' },
        { path: '/import', label: 'Importar', icon: '📥' },
    ];

    if (user?.is_admin) {
        navItems.push({ path: '/users', label: 'Usuarios', icon: '👥' });
    }

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col">
            {/* Header fijo */}
            <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-primary">BolsaV6</h1>
                        </div>

                        {/* User info */}
                        <div className="flex items-center space-x-4">
                            <span className="text-dark-muted text-sm hidden sm:block">
                                {user?.username}
                                {user?.is_admin && <span className="ml-2 text-warning">(Admin)</span>}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-danger hover:bg-danger/80 text-white px-4 py-2 rounded-lg 
                         transition-colors text-sm font-medium"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navegación horizontal fija */}
            <nav className="bg-dark-surface border-b border-dark-border sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap
                          transition-colors text-sm font-medium
                          ${location.pathname === item.path
                                        ? 'bg-primary text-white'
                                        : 'text-dark-muted hover:bg-dark-bg hover:text-dark-text'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span className="hidden sm:inline">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

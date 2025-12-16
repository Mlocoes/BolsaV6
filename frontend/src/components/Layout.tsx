/**
 * Layout principal con navegación
 */
import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
    children: ReactNode;
}

interface NavLinkProps {
    to: string;
    icon: string;
    label: string;
}

function NavLink({ to, icon, label }: NavLinkProps) {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap
                transition-colors text-sm font-medium
                ${isActive
                    ? 'bg-primary text-white'
                    : 'text-dark-muted hover:bg-dark-bg hover:text-dark-text'
                }`}
        >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

export default function Layout({ children }: LayoutProps) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col">
            {/* Header */}
            <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-primary">BolsaV6</h1>

                        <div className="flex items-center space-x-4">
                            {user && (
                                <>
                                    <span className="text-sm">
                                        {user.username}
                                        {user.is_admin && <span className="text-warning ml-1">(Admin)</span>}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-danger hover:bg-danger/80 text-white px-4 py-2 rounded-lg text-sm"
                                    >
                                        Salir
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-6 pb-3">
                    <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                        <NavLink to="/" icon="📊" label="Dashboard" />
                        <NavLink to="/positions" icon="📈" label="Posiciones" />
                        <NavLink to="/assets" icon="💼" label="Activos" />
                        <NavLink to="/portfolios" icon="📁" label="Carteras" />
                        <NavLink to="/transactions" icon="💸" label="Transacciones" />
                        <NavLink to="/quotes" icon="📉" label="Cotizaciones" />
                        <NavLink to="/fiscal" icon="⚖️" label="Informe Fiscal" />
                        <NavLink to="/import" icon="📥" label="Importar" />
                        {user?.is_admin && <NavLink to="/users" icon="👥" label="Usuarios" />}
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}

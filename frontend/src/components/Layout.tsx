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
        <div className="h-screen w-screen bg-dark-bg text-dark-text flex flex-col overflow-hidden">
            {/* Header Compacto */}
            <header className="bg-dark-surface border-b border-dark-border flex-none z-50 h-14">
                <div className="h-full px-4 flex items-center justify-between">
                    {/* Left: Logo & Nav */}
                    <div className="flex items-center space-x-6 overflow-hidden">
                        <h1 className="text-xl font-bold text-primary whitespace-nowrap hidden md:block">BolsaV6</h1>

                        {/* Navigation */}
                        <nav className="flex space-x-1 overflow-x-auto no-scrollbar">
                            <NavLink to="/" icon="📊" label="Dashboard" />
                            <NavLink to="/positions" icon="📈" label="Posiciones" />
                            <NavLink to="/assets" icon="💼" label="Activos" />
                            <NavLink to="/portfolios" icon="📁" label="Carteras" />
                            <NavLink to="/transactions" icon="💸" label="Transacciones" />
                            <NavLink to="/quotes" icon="📉" label="Cotizaciones" />
                            <NavLink to="/fiscal" icon="⚖️" label="Fiscal" />
                            <NavLink to="/import" icon="📥" label="Importar" />
                            {user?.is_admin && <NavLink to="/administration" icon="🏛️" label="Administración" />}
                            {user?.is_admin && <NavLink to="/users" icon="👥" label="Usuarios" />}
                        </nav>
                    </div>

                    {/* Right: User */}
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                        {user && (
                            <>
                                <span className="text-xs md:text-sm hidden md:inline-block text-dark-muted">
                                    {user.username}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-dark-muted hover:text-danger p-1 rounded transition-colors"
                                    title="Salir"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </main>
        </div>
    );
}

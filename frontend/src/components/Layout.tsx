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
            className={`flex items-center space-x-2 px-2 py-2 rounded-lg whitespace-nowrap
                transition-colors text-sm font-medium
                ${isActive
                    ? 'bg-primary text-white'
                    : 'text-dark-muted hover:bg-dark-bg hover:text-dark-text'
                }`}
        >
            <span>{icon}</span>
            <span className="hidden md:inline">{label}</span>
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
                            {user?.is_admin && <NavLink to="/administration" icon="🏛️" label="Admin" />}
                        </nav>
                    </div>

                    {/* Right: User */}
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                        {user && (
                            <>
                                <Link
                                    to="/settings"
                                    className="text-dark-muted hover:text-white p-1 rounded transition-colors"
                                    title="Configuración"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </Link>
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

/**
 * Página de Login
 */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            // Error manejado por el store
        }
    };

    return (
        <div className="h-screen w-screen overflow-y-auto flex items-center justify-center bg-dark-bg px-4">
            <div className="max-w-md w-full space-y-8">
                {/* Logo/Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary mb-2">BolsaV6</h1>
                    <p className="text-dark-muted">Sistema de Gestión de Carteras</p>
                </div>

                {/* Form */}
                <div className="bg-dark-surface rounded-lg shadow-xl p-8 border border-dark-border">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Iniciar Sesión</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-2">
                                Usuario
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         text-dark-text placeholder-dark-muted"
                                placeholder="Ingresa tu usuario"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         text-dark-text placeholder-dark-muted"
                                placeholder="Ingresa tu contraseña"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold 
                       py-3 px-4 rounded-lg transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 text-center text-sm text-dark-muted">
                        {/* <p>Usuario por defecto: <span className="text-primary">admin</span></p> */}
                        {/* <p>Contraseña: <span className="text-primary">admin123</span></p> */}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * App principal con rutas completas
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading de páginas
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Positions = lazy(() => import('./pages/Positions'));
const Assets = lazy(() => import('./pages/Assets'));
const Portfolios = lazy(() => import('./pages/Portfolios'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Quotes = lazy(() => import('./pages/Quotes'));
const Import = lazy(() => import('./pages/Import'));
const FiscalReport = lazy(() => import('./pages/FiscalReport'));
const Administration = lazy(() => import('./pages/Administration'));
const Settings = lazy(() => import('./pages/Settings'));

import './styles/index.css';

// Componente de carga
const Loading = () => <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-white">Cargando...</div>;

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <UserProvider>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/positions"
                        element={
                            <ProtectedRoute>
                                <Positions />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/assets"
                        element={
                            <ProtectedRoute>
                                <Assets />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/portfolios"
                        element={
                            <ProtectedRoute>
                                <Portfolios />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/transactions"
                        element={
                            <ProtectedRoute>
                                <Transactions />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/quotes"
                        element={
                            <ProtectedRoute>
                                <Quotes />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/import"
                        element={
                            <ProtectedRoute>
                                <Import />
                            </ProtectedRoute>
                        }
                    />


                    <Route
                        path="/fiscal"
                        element={
                            <ProtectedRoute>
                                <FiscalReport />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/administration"
                        element={
                            <ProtectedRoute>
                                <Administration />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;

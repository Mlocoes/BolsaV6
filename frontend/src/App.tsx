/**
 * App principal con rutas completas
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Positions from './pages/Positions';
import Assets from './pages/Assets';
import Portfolios from './pages/Portfolios';
import Transactions from './pages/Transactions';
import Quotes from './pages/Quotes';
import Import from './pages/Import';
import Users from './pages/Users';
import './styles/index.css';

function App() {
    return (
        <BrowserRouter>
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
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <Users />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

/**
 * Configuración de Axios para API
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Importante para cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Sesión expirada o no autenticado
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

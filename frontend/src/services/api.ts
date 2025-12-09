/**
 * Configuración de Axios para API
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Debug: Mostrar la URL que se está usando
console.log('🔗 API URL configurada:', API_URL);
console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL);

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

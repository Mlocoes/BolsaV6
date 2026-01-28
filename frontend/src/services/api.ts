/**
 * Configuración de Axios para API
 * @version 7.0.0 - Simplified after fixing backend HTTPS redirect issue
 */
import axios from 'axios';

// BaseURL relativo - funciona correctamente ahora que el backend
// genera redirects con el protocolo correcto (HTTPS)
const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // No redirigir si estamos verificando la sesión actual
            if (!error.config?.url?.includes('/auth/me')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const api = axiosInstance;
export default api;

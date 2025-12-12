/**
 * Configuración de Axios para API
 */
import axios from 'axios';

/**
 * Determina la URL base de la API de forma inteligente:
 * 1. Si hay VITE_API_URL definida, la usa (producción/custom)
 * 2. Si no, detecta automáticamente según el origen del navegador
 */
function getApiUrl(): string {
    // Si hay variable de entorno, usarla (producción o configuración manual)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Detección automática basada en el origen del navegador
    const { protocol, hostname } = window.location;
    
    // Construir URL del backend en el mismo host, puerto 8000
    const apiUrl = `${protocol}//${hostname}:8000/api`;
    
    return apiUrl;
}

const API_URL = getApiUrl();

// Debug: Mostrar la URL que se está usando
console.log('🔗 API URL configurada:', API_URL);
console.log('🔗 Origen del navegador:', window.location.origin);
console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL || '(no definida - modo automático)');

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

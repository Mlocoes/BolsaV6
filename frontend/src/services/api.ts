/**
 * Configuración de Axios para API
 */
import axios from 'axios';

/**
 * Determina la URL base de la API de forma inteligente:
 * 1. Si hay VITE_API_URL definida, la usa (producción/custom)
 * 2. Detecta automáticamente usando el mismo hostname que el navegador
 */
function getApiUrl(): string {
    // Debug
    console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('Window Protocol:', window.location.protocol);

    const { protocol, hostname } = window.location;

    // DEBUG EXTREMO
    console.log('🔍 API Config Debug:', {
        protocol,
        hostname,
        envUrl: import.meta.env.VITE_API_URL
    });

    // 1. Si estamos en el dominio de producción (kronos), FORZAR ruta relativa
    if (hostname.includes('kronos.cloudns.ph')) {
        console.log('🌍 Dominio Kronos detectado: Forzando /api');
        return '/api';
    }

    // 2. Si el protocolo es HTTPS, FORZAR ruta relativa
    if (protocol === 'https:') {
        console.log('🔒 HTTPS detectado: Forzando /api');
        return '/api';
    }

    // 3. Si hay variable de entorno y NO estamos en los casos anteriores
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Detección automática para desarrollo local (HTTP)
    const apiUrl = `${protocol}//${hostname}:8000/api`;
    return apiUrl;
}

const API_URL = getApiUrl();

// Debug: Mostrar configuración (solo en desarrollo)
if (import.meta.env.DEV) {
    console.log('✓ API URL configurada:', API_URL);
}

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
            // No redirigir si es el endpoint /auth/me (carga inicial)
            if (!error.config?.url?.includes('/auth/me')) {
                // Sesión expirada o no autenticado en otras llamadas
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

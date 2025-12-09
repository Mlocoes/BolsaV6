/**
 * Servicio de autenticación
 */
import api from './api';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}

export interface LoginResponse {
    user: User;
    message: string;
}

export const authService = {
    /**
     * Login de usuario
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        return response.data;
    },

    /**
     * Logout de usuario
     */
    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    /**
     * Obtener usuario actual
     */
    async me(): Promise<User> {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },
};

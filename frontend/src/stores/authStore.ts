/**
 * Store de autenticación con Zustand
 */
import { create } from 'zustand';
import { authService, User } from '../services/authService';
import api from '../services/api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.login({ username, password });
            set({ user: response.user, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al iniciar sesión',
                isLoading: false
            });
            throw error;
        }
    },

    logout: async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            set({ user: null });
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const user = await authService.me();
            set({ user, isLoading: false });
        } catch (error) {
            set({ user: null, isLoading: false });
        }
    },

    updateProfile: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
            const currentUser = useAuthStore.getState().user;
            if (!currentUser) throw new Error('No user logged in');

            const response = await api.patch(`/users/${currentUser.id}`, data);
            set({ user: response.data, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al actualizar perfil',
                isLoading: false
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

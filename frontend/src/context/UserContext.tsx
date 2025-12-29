/**
 * Contexto para gestionar la información del usuario autenticado
 * Refactorizado para usar authStore internamente y evitar redundancia de estado.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface User {
    id: string;
    username: string;
    email: string;
    base_currency: string;
    is_admin: boolean;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    updateBaseCurrency: (currency: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isLoading, checkAuth, updateProfile } = useAuthStore();

    const refreshUser = async () => {
        await checkAuth();
    };

    const updateBaseCurrency = async (currency: string) => {
        await updateProfile({ base_currency: currency });
    };

    // Mapear el usuario del store al formato esperado por el contexto (si es necesario)
    const contextUser = user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        base_currency: user.base_currency,
        is_admin: user.is_admin
    } : null;

    return (
        <UserContext.Provider value={{
            user: contextUser,
            loading: isLoading,
            refreshUser,
            updateBaseCurrency
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

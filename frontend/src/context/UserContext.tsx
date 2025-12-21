/**
 * Contexto para gestionar la información del usuario autenticado
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

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
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            setLoading(true);
            // No verificar localStorage - la autenticación usa cookies
            // El backend validará automáticamente con la cookie session_id
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const updateBaseCurrency = async (currency: string) => {
        try {
            const response = await api.patch('/users/me/preferences', { base_currency: currency });
            setUser(response.data);
        } catch (error) {
            console.error('Error updating base currency:', error);
            throw error;
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser, updateBaseCurrency }}>
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

'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getUser, getToken, setToken, setUser, clearAuth } from '@/lib/auth';
import api from '@/lib/api';

export const useAuth = () => {
    const [user, setUserState] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = getUser();
        const token = getToken();
        if (storedUser && token) {
            setUserState(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data.data;
        setToken(token);
        setUser(user);
        setUserState(user);
        return user;
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        role: 'PASSENGER' | 'DRIVER'
    ) => {
        const response = await api.post('/auth/register', {
            name,
            email,
            password,
            role,
        });
        const { token, user } = response.data.data;
        setToken(token);
        setUser(user);
        setUserState(user);
        return user;
    };

    const logout = () => {
        clearAuth();
        setUserState(null);
        window.location.href = '/login';
    };

    return { user, loading, login, register, logout };
};
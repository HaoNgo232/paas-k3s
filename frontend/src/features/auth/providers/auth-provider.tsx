'use client';

import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../hooks/use-auth';
import { AuthContextType, User } from '../types';

/**
 * Auth Provider Component
 * Quản lý trạng thái xác thực cho toàn bộ ứng dụng
 */
export function AuthProvider({
    children,
}: Readonly<{ children: ReactNode }>) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra xem người dùng có token không
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // Gọi API /auth/me để lấy thông tin người dùng
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                const response = await fetch(`${apiUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.data);
                } else {
                    localStorage.removeItem('accessToken');
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const value: AuthContextType = useMemo(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            async login(email: string, password: string) {
                // Implement login logic khi có form login
                console.log('Login with:', email, password);
            },
            async logout() {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                    await fetch(`${apiUrl}/auth/logout`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                        },
                    });
                    localStorage.removeItem('accessToken');
                    setUser(null);
                } catch (error) {
                    console.error('Logout failed:', error);
                    throw error;
                }
            },
            async checkAuth() {
                try {
                    const token = localStorage.getItem('accessToken');
                    if (!token) {
                        setUser(null);
                        return;
                    }

                    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                    const response = await fetch(`${apiUrl}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.data);
                    } else {
                        localStorage.removeItem('accessToken');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    setUser(null);
                }
            },
        }),
        [user, isLoading],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    // Apply theme to document - memoized để tránh re-create
    const applyTheme = useCallback((newTheme: Theme) => {
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, []);

    // Initialize theme from localStorage or default to light
    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        const initialTheme = stored || 'light';
        setThemeState(initialTheme);
        applyTheme(initialTheme);
        setMounted(true);
    }, [applyTheme]);

    // Memoized setTheme function
    const setTheme = useCallback(
        (newTheme: Theme) => {
            setThemeState(newTheme);
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        },
        [applyTheme]
    );

    // Memoized toggleTheme function
    const toggleTheme = useCallback(() => {
        setThemeState((prevTheme) => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
            return newTheme;
        });
    }, [applyTheme]);

    // Memoized context value để tránh re-render không cần thiết
    const contextValue = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
        }),
        [theme, setTheme, toggleTheme]
    );

    // Prevent flash of wrong theme
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}


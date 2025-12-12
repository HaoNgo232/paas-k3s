'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial theme from localStorage synchronously to prevent flash
function getInitialTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'light';
    }
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'light';
}

// Apply theme to document immediately
function applyTheme(newTheme: Theme) {
    if (typeof document === 'undefined') {
        return;
    }
    const root = document.documentElement;
    if (newTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Initialize theme from localStorage synchronously to prevent flash
    const [theme, setThemeState] = useState<Theme>(() => {
        const initialTheme = getInitialTheme();
        // Apply theme immediately before first render
        applyTheme(initialTheme);
        return initialTheme;
    });

    // Sync theme changes to localStorage and document
    useEffect(() => {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // Always render Provider to ensure useTheme() works
    // Theme is initialized synchronously, so no flash occurs
    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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

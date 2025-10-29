import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) {
            setTheme(stored);
        }
    }, []);

    return { theme };
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import * as Tone from 'tone';
import type { ContentData } from '@/lib/LoadContent';

type Theme = 'light' | 'dark';

interface AppState {
    // Content
    content: ContentData;

    // Theme
    theme: Theme;
    toggleTheme: () => void;

    // Audio
    isMuted: boolean;
    toggleMute: () => void;

    // Animation
    portfolioFrameRate: number;
    setPortfolioFrameRate: (rate: number) => void;

    // Navigation
    selectedProjectId: string | null;
    setSelectedProjectId: (id: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children, content }: { children: React.ReactNode; content: ContentData }) {
    // Theme State
    const [theme, setTheme] = useState<Theme>('light');
    const [_mounted, setMounted] = useState(false);

    // Audio State
    const [isMuted, setIsMuted] = useState(false);

    // Frame Rate State
    const [portfolioFrameRate, setPortfolioFrameRateState] = useState(60);

    // Navigation State
    const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);

    // Initialize Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);

        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        setMounted(true);
    }, []);

    // Initialize Audio Mute State
    useEffect(() => {
        // Apply initial mute state to Tone.js
        Tone.Destination.mute = isMuted;
    }, [isMuted]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleMute = () => {
        setIsMuted((prev) => !prev);
    };

    const setPortfolioFrameRate = (rate: number) => {
        setPortfolioFrameRateState(rate);
    };

    return (
        <AppContext.Provider
            value={{
                content,
                theme,
                toggleTheme,
                isMuted,
                toggleMute,
                portfolioFrameRate,
                setPortfolioFrameRate,
                selectedProjectId,
                setSelectedProjectId: setSelectedProjectIdState,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

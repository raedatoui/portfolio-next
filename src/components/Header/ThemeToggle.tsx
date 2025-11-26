'use client';

import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { CDN_URL } from '@/lib/constants';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useApp();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="hover:text-red transition-colors w-[24px] h-[24px]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <Image
                src={isDark ? `${CDN_URL}/assets/images/header/sun.svg` : `${CDN_URL}/assets/images/header/moon.svg`}
                alt={isDark ? 'Light Mode' : 'Dark Mode'}
                width={24}
                height={24}
                className="w-full h-full object-contain"
                style={{ filter: 'var(--invert-filter)' }}
            />
        </button>
    );
}

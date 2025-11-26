'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';

interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    onChange?: (value: number) => void;
}

export default function RangeSlider({ min, max, step, defaultValue, onChange }: RangeSliderProps) {
    const [value, setValue] = useState(defaultValue);
    const { theme } = useApp();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number.parseInt(event.target.value, 10);
        setValue(newValue);
        onChange?.(newValue);
    };

    useEffect(() => {
        if (!inputRef.current) return;

        const baseColor = theme === 'dark' ? '#ffffff' : '#000000';
        const thumbColor = theme === 'dark' ? '#000000' : '#ffffff';
        // Made light mode track background darker to match the visual weight of dark mode
        const trackBg = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';
        const hoverColor = '#EE4938';

        const percentage = ((value - min) / (max - min)) * 100;

        const style = document.createElement('style');
        style.textContent = `
            .horizontal-slider-${theme}::-webkit-slider-runnable-track {
                width: 100%;
                height: 20px;
                background: linear-gradient(to right, ${baseColor} 0%, ${baseColor} ${percentage}%, ${trackBg} ${percentage}%, ${trackBg} 100%);
                border: 2px solid ${baseColor};
                box-shadow: inset 1px 1px 0px ${baseColor}, inset -1px -1px 0px ${baseColor};
            }
            .horizontal-slider-${theme}::-webkit-slider-thumb {
                appearance: none;
                width: 10px;
                height: 10px;
                background: ${thumbColor};
                border: 2px solid ${baseColor};
                margin-top: 3px; /* (20px track - 4px border - 10px thumb) / 2 = 3px */
                transition: background-color 150ms, border-color 150ms;
            }
            .horizontal-slider-${theme}::-webkit-slider-thumb:hover {
                background: ${hoverColor};
                border-color: ${hoverColor};
            }
            .horizontal-slider-${theme}::-webkit-slider-thumb:active {
                background: ${hoverColor};
                border-color: ${hoverColor};
            }
            .horizontal-slider-${theme}::-moz-range-track {
                width: 100%;
                height: 20px;
                background: linear-gradient(to right, ${baseColor} 0%, ${baseColor} ${percentage}%, ${trackBg} ${percentage}%, ${trackBg} 100%);
                border: 2px solid ${baseColor};
                box-shadow: inset 1px 1px 0px ${baseColor}, inset -1px -1px 0px ${baseColor};
            }
            .horizontal-slider-${theme}::-moz-range-thumb {
                width: 10px;
                height: 10px;
                background: ${thumbColor};
                border: 2px solid ${baseColor};
                margin-top: 3px;
                transition: background-color 150ms, border-color 150ms;
            }
            .horizontal-slider-${theme}::-moz-range-thumb:hover {
                background: ${hoverColor};
                border-color: ${hoverColor};
            }
            .horizontal-slider-${theme}::-moz-range-thumb:active {
                background: ${hoverColor};
                border-color: ${hoverColor};
            }
        `;

        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, [theme, value, min, max]);

    return (
        <div className="flex items-center justify-center">
            <input
                ref={inputRef}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                className={`horizontal-slider-${theme} w-24 h-6 cursor-pointer appearance-none outline-none p-0 m-0 bg-transparent`}
            />
        </div>
    );
}

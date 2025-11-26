'use client';

import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import type { HeaderData } from '@/lib/LoadContent';
import RangeSlider from './RangeSlider';
import SocialLink from './SocialLink';
import ThemeToggle from './ThemeToggle';
import { CDN_URL } from '@/lib/constants';
import { SOCIAL_NETWORKS } from './SocialIcons';

interface HeaderProps {
    data: HeaderData;
}

export default function Header({ data }: HeaderProps) {
    const { isMuted, toggleMute, portfolioFrameRate, setPortfolioFrameRate, selectedProjectId, setSelectedProjectId } = useApp();

    const handleFrameRateChange = (value: number) => {
        setPortfolioFrameRate(value);
    };

    return (
        <header
            id="header"
            className="
                sticky top-0 z-50 w-full
                backdrop-blur-md bg-white/80
                dark:bg-white/10
            "
        >
            {/* Row 1: Title and Social Links */}
            <div className="border-b border-lightGrey dark:border-grey">
                <div className="mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Raed Atoui</h1>

                    <ul className="flex flex-wrap justify-end gap-3 md:gap-4 list-none p-0 m-0">
                        {SOCIAL_NETWORKS.map((net) => (
                            <SocialLink key={`social-${net.name}`} network={net} muted={isMuted} />
                        ))}
                    </ul>
                </div>
            </div>

            {/* Row 2: Controls */}
            <div>
                <div className="mx-auto px-4 py-2 flex flex-wrap justify-start min-[525px]:justify-end items-center gap-4 md:gap-6 text-sm">
                    {/* FPS Control */}
                    <div className="hidden sm:flex items-center gap-2">
                        <RangeSlider min={1} max={100} step={1} defaultValue={portfolioFrameRate} onChange={handleFrameRateChange} />
                        <span className="text-xs font-mono w-6">{portfolioFrameRate} FPS</span>
                    </div>

                    {/* Mute Control */}
                    <button
                        onClick={toggleMute}
                        className="hover:text-red transition-colors w-[20px] h-[20px] md:w-[24px] md:h-[24px]"
                        type="button"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        <Image
                            src={isMuted ? `${CDN_URL}/assets/images/header/speaker_off.svg` : `${CDN_URL}/assets/images/header/speaker_on.svg`}
                            alt={isMuted ? 'Muted' : 'Sound On'}
                            width={24}
                            height={24}
                            className="w-full h-full"
                            style={{ filter: 'var(--invert-filter)' }}
                        />
                    </button>

                    {/* Theme Toggle */}
                    <div className="w-[20px] md:w-[24px] flex justify-center">
                        <ThemeToggle />
                    </div>

                    {/* View Source */}
                    <a
                        href={data.viewsource}
                        target="_blank"
                        rel="noreferrer"
                        className="
                            inline-block px-2 py-1 md:px-3
                            font-bold uppercase tracking-wider text-[10px] md:text-xs
                            border-2 border-[var(--color-grey)] bg-[var(--color-white)] text-[var(--color-grey)]
                            shadow-[2px_2px_0_0_var(--color-grey)]
                            hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--color-grey)]
                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                            transition-all duration-100
                        "
                    >
                        view source
                    </a>

                    {/* Close Project Button */}
                    {selectedProjectId && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedProjectId(null);
                                window.history.pushState(null, '', '/');
                            }}
                            className="
                                inline-block px-2 py-1 md:px-3
                                font-bold uppercase tracking-wider text-[10px] md:text-xs
                                border-2 border-[var(--color-grey)] bg-[var(--color-white)] text-[var(--color-grey)]
                                shadow-[2px_2px_0_0_var(--color-grey)]
                                hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--color-grey)]
                                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                                transition-all duration-100
                            "
                        >
                            CLOSE X
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

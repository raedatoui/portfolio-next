'use client';

import { useEffect, useRef } from 'react';
import { CDN_URL } from '@/lib/constants';
import type { SocialNetwork } from './SocialIcons';

interface SocialLinkProps {
    network: SocialNetwork;
    muted: boolean;
}

export default function SocialLink({ network, muted }: SocialLinkProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { Icon, link, audio } = network;

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : 1;
        }
    }, [muted]);

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Ignore autoplay errors
            });
        }
    };

    return (
        <li
            className="
        group mx-0.5 transition-transform duration-250
        hover:[transform:rotateY(-180deg)]
        will-change-transform
        h-[20px]
        md:h-[22px]
        lg:h-[24px]
      "
            onMouseEnter={playSound}
            onFocus={playSound}
            onBlur={playSound}
        >
            {/* biome-ignore lint/a11y/useMediaCaption: Sound effect */}
            <audio ref={audioRef} preload="auto">
                <source src={`${CDN_URL}/assets/audio/${audio}`} type="audio/ogg" />
            </audio>
            <a href={link} target="_blank" rel="noreferrer" className="block h-full">
                <Icon className="h-full w-auto" />
            </a>
        </li>
    );
}

'use client';

import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import useNervousHover from '@/hooks/useNervousHover';

interface EmployerLogoProps {
    src: string;
    name: string;
    logoStyle?: 'default' | 'invert' | 'theme' | 'theme-svg';
    voiceIndex: number;
}

export default function EmployerLogo({ src, name, logoStyle, voiceIndex }: EmployerLogoProps) {
    const { theme, portfolioFrameRate: frameRate } = useApp();
    const isDark = theme === 'dark';

    const { canvasRef, imgRef, showPixels, handleMouseEnter, handleMouseLeave, syncCanvasToImage } = useNervousHover({
        voiceIndex,
        frameRate,
        enabled: true,
    });

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        // Use natural dimensions to avoid distortion and match the source image
        syncCanvasToImage(img, img.naturalWidth, img.naturalHeight);
    };

    // Determine CSS filters based on logo style and theme
    const getFilterStyle = () => {
        if (logoStyle === 'theme') {
            return isDark ? 'brightness(0) invert(1)' : 'brightness(0)';
        }
        if (logoStyle === 'invert' && isDark) {
            return 'invert(1)';
        }
        if (logoStyle === 'theme-svg' && isDark) {
            return 'invert(1) hue-rotate(180deg)';
        }
        return 'none';
    };

    const filterStyle = getFilterStyle();

    return (
        <figure className="relative w-full h-full flex items-center justify-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Image
                ref={imgRef}
                src={src}
                alt={name}
                fill
                className="object-contain"
                onLoad={handleImageLoad}
                style={{
                    visibility: showPixels ? 'hidden' : 'visible',
                    filter: filterStyle,
                }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    imageRendering: 'pixelated',
                    filter: filterStyle,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                }}
                className={`absolute top-0 left-0 w-full h-full ${showPixels ? 'block' : 'hidden'}`}
            />
        </figure>
    );
}

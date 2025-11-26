'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import Nervous, { type NervousPoint } from '@/lib/Nervous';

interface EmployerLogoProps {
    src: string;
    name: string;
    logoStyle?: 'default' | 'invert' | 'theme' | 'theme-svg';
    detune: number;
}

export default function EmployerLogo({ src, name, logoStyle, detune }: EmployerLogoProps) {
    const { theme, portfolioFrameRate: frameRate } = useApp();
    const isDark = theme === 'dark';

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [showPixels, setShowPixels] = useState(false);
    const nervousRef = useRef<Nervous | null>(null);
    const playRef = useRef(false);

    // Animation refs
    const stepRef = useRef(1);
    const counterRef = useRef(0);
    const rafRef = useRef<number>(0);
    const prevRef = useRef(Date.now());
    const fpsIntervalRef = useRef(1000 / 5);

    // Initialize Nervous
    useEffect(() => {
        if (typeof window !== 'undefined' && !nervousRef.current) {
            nervousRef.current = new Nervous(detune);
        }
    }, [detune]);

    const pixelate = useCallback((v = 6) => {
        if (!canvasRef.current || !imgRef.current) return;

        const canvas = canvasRef.current;
        const img = imgRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        if (!tempCanvasRef.current) {
            tempCanvasRef.current = document.createElement('canvas');
        }
        const size = v * 0.01;
        const tempCanvas = tempCanvasRef.current;
        const w = Math.max(1, canvas.width * size);
        const h = Math.max(1, canvas.height * size);
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.clearRect(0, 0, w, h);
            // Draw the image
            tempCtx.drawImage(img, 0, 0, w, h);

            // Apply filters to the main canvas after drawing the pixelated version
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
    }, []);

    const nervousPlay = useCallback(() => {
        if (!nervousRef.current) return;

        const nervous = nervousRef.current;
        const counter = counterRef.current;
        const step = stepRef.current;

        if (counter < 0 || counter >= nervous.notes.length) {
            counterRef.current = 0;
            return;
        }

        const note: NervousPoint = nervous.notes[counter];
        if (!note) return;

        nervous.play(note.midi);
        pixelate(note.pixelation);

        if (counter % Math.floor(nervous.notes.length / 4) === 0) {
            fpsIntervalRef.current = 1000 / (Math.random() * frameRate + 1);
        }

        counterRef.current += step;

        if (counterRef.current <= 0 || counterRef.current >= nervous.notes.length - 1) {
            stepRef.current = -step;
        }
    }, [pixelate, frameRate]);

    const animate = useCallback(() => {
        if (!playRef.current) {
            nervousRef.current?.stop();
            return;
        }

        rafRef.current = window.requestAnimationFrame(animate);

        const now = Date.now();
        const elapsed = now - prevRef.current;

        if (elapsed > fpsIntervalRef.current) {
            prevRef.current = now - (elapsed % fpsIntervalRef.current);
            nervousPlay();
        }
    }, [nervousPlay]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;

        // Use natural dimensions to avoid distortion and match the source image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    };

    const handleMouseOver = () => {
        setShowPixels(true);
        if (!playRef.current) {
            playRef.current = true;
            animate();
        }
    };

    const handleMouseOut = () => {
        setShowPixels(false);
        playRef.current = false;
        nervousRef.current?.stop();
    };

    useEffect(() => {
        fpsIntervalRef.current = 1000 / frameRate;
    }, [frameRate]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current);
            }
            nervousRef.current?.stop();
        };
    }, []);

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
        <figure className="relative w-full h-full flex items-center justify-center" onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
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

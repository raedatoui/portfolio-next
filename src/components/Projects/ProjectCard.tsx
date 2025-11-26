'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkItemData } from '@/lib/LoadContent';
import Nervous, { type NervousPoint } from '@/lib/Nervous';

interface ProjectCardProps {
    project: WorkItemData;
    projectId: string;
    detune: number;
    frameRate: number;
    onSelect: (projectId: string) => void;
    isSelected: boolean;
    isDisabled?: boolean;
}

export default function ProjectCard({ project, projectId, detune, frameRate, onSelect, isSelected, isDisabled }: ProjectCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [showPixels, setShowPixels] = useState(false);
    const nervousRef = useRef<Nervous | null>(null);

    const playRef = useRef(false);
    const stepRef = useRef(1);
    const counterRef = useRef(0);
    const rafRef = useRef<number>(0);
    const prevRef = useRef(Date.now());
    const fpsIntervalRef = useRef(1000 / 5);

    const imgSrc = project.thumb.image;
    const filterStyle = project.thumb.invert ? 'var(--invert-filter)' : 'none';

    // Initialize Nervous only on client side
    useEffect(() => {
        if (typeof window !== 'undefined' && !nervousRef.current) {
            nervousRef.current = new Nervous(detune);
        }
    }, [detune]);

    // ... (keep existing pixelate, nervousPlay, animate, handleImageLoad functions) ...

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
            tempCtx.drawImage(img, 0, 0, w, h);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
    }, []);

    const nervousPlay = useCallback(() => {
        if (!nervousRef.current) return;

        const nervous = nervousRef.current;
        const counter = counterRef.current;
        const step = stepRef.current;

        // Bounds checking
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

    const handleImageLoad = () => {
        if (!canvasRef.current || !imgRef.current) return;

        const canvas = canvasRef.current;
        const img = imgRef.current;

        // Set canvas dimensions to match the natural image size
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            // Draw the full image initially (no pixelation)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    };

    const handleMouseOver = () => {
        if (isDisabled || isSelected) return;
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

    return (
        <button
            type="button"
            className={`cursor-pointer outline-none transition-all duration-300 ${isDisabled ? 'grayscale opacity-20 pointer-events-none' : ''}`}
            onClick={() => !isDisabled && onSelect(projectId)}
            onMouseEnter={handleMouseOver}
            onMouseLeave={handleMouseOut}
        >
            <div className="relative w-full">
                {/* biome-ignore lint/performance/noImgElement: Needed for canvas pixelation effect */}
                <img
                    ref={imgRef}
                    src={imgSrc}
                    alt={project.title}
                    className="w-full h-auto block"
                    onLoad={handleImageLoad}
                    style={{
                        visibility: showPixels && !isSelected ? 'hidden' : 'inherit',
                        filter: filterStyle,
                    }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        imageRendering: 'pixelated',
                        filter: filterStyle,
                    }}
                    className={`absolute top-0 left-0 w-full h-full ${showPixels && !isSelected ? 'block' : 'hidden'}`}
                />
            </div>

            <h5
                className={`
          text-center text-base md:text-lg border-t border-lightGrey
          mt-2 pt-2 mb-0
          transition-opacity
          ${showPixels && !isSelected ? 'opacity-100' : 'opacity-0'}
        `}
            >
                {project.title}
            </h5>
        </button>
    );
}

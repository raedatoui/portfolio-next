'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { start as startAudio } from 'tone';
import Nervous from '@/lib/Nervous';

/** How long a held hover takes to climb from START_INTENSITY to full. */
const RAMP_MS = 2500;
/** Hovers open here rather than at zero, so the first step already sounds. */
const START_INTENSITY = 0.25;
/** Fraction of the slider's rate a hover opens at, before the ramp walks it up to the full value. */
const MIN_RATE_FACTOR = 0.35;

/** Steps per second for the current slider value and hover intensity. */
function stepRate(frameRate: number, intensity: number): number {
    return Math.max(0.5, frameRate * (MIN_RATE_FACTOR + intensity * (1 - MIN_RATE_FACTOR)));
}

interface UseNervousHoverOptions {
    voiceIndex: number;
    frameRate: number;
    enabled: boolean;
}

/**
 * Drives the shared hover behaviour for project cards and employer logos: a
 * throttled RAF loop that walks a Nervous sequence, pixelating the canvas and
 * playing a note from the same point so the two stay in step.
 *
 * All loop state lives in refs, deliberately, to keep it out of React's render cycle.
 */
export default function useNervousHover({ voiceIndex, frameRate, enabled }: UseNervousHoverOptions) {
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
    const hoverStartRef = useRef(0);
    const fpsIntervalRef = useRef(1000 / 5);
    const frameRateRef = useRef(frameRate);

    useEffect(() => {
        frameRateRef.current = frameRate;
    }, [frameRate]);

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

            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
    }, []);

    const nervousPlay = useCallback(() => {
        const nervous = nervousRef.current;
        if (!nervous) return;

        const point = nervous.notes[counterRef.current];
        if (!point) return;

        const elapsed = Date.now() - hoverStartRef.current;
        const intensity = Math.min(1, START_INTENSITY + (elapsed / RAMP_MS) * (1 - START_INTENSITY));

        // The slider is the target rate outright; intensity scales it rather than sitting on top of it.
        const rate = stepRate(frameRateRef.current, intensity);
        fpsIntervalRef.current = 1000 / (rate * (0.7 + Math.random() * 0.6));

        // Notes are sized to the gap between steps, so a fast slider reads as fast
        // instead of piling overlapping voices into the same mush.
        // Rests hold the current frame — repixelating against silence is what read
        // as the image and the audio drifting out of sync.
        if (nervous.play(point, intensity, 1 / rate)) {
            pixelate(point.pixelation);
        }

        // Wrap rather than bounce, so the sequence reads as a loop. Crossing the
        // start of the array is the lap marker: re-roll the tone there.
        const len = nervous.notes.length;
        counterRef.current = (counterRef.current + stepRef.current + len) % len;

        if (counterRef.current === 0) {
            nervous.reshape();
        }
    }, [pixelate]);

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

    const handleMouseEnter = useCallback(() => {
        if (!enabled) return;
        setShowPixels(true);

        if (!nervousRef.current) {
            nervousRef.current = new Nervous(voiceIndex);
        }
        // Unlock the audio context on the gesture itself rather than inside the RAF callback.
        startAudio().catch(() => {});
        // New effect per hover. A re-hover during the previous tail clips that voice,
        // but the shared bus sits downstream of the swap so its reverb carries through.
        nervousRef.current.rollEffect();

        if (!playRef.current) {
            hoverStartRef.current = Date.now();
            // Enter the walk somewhere new each hover, travelling either direction.
            counterRef.current = Math.floor(Math.random() * nervousRef.current.notes.length);
            stepRef.current = Math.random() < 0.5 ? 1 : -1;
            fpsIntervalRef.current = 1000 / stepRate(frameRateRef.current, START_INTENSITY);
            // Zeroed so the throttle is already overdue and the first frame sounds.
            prevRef.current = 0;
            playRef.current = true;
            animate();
        }
    }, [enabled, voiceIndex, animate]);

    const handleMouseLeave = useCallback(() => {
        setShowPixels(false);
        playRef.current = false;
        nervousRef.current?.stop();
    }, []);

    const syncCanvasToImage = useCallback((img: HTMLImageElement, width: number, height: number) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }, []);

    // A card that gets selected or disabled mid-hover should not keep playing.
    useEffect(() => {
        if (enabled) return;
        playRef.current = false;
        nervousRef.current?.stop();
        setShowPixels(false);
    }, [enabled]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current);
            }
            nervousRef.current?.dispose();
            nervousRef.current = null;
        };
    }, []);

    return { canvasRef, imgRef, showPixels, handleMouseEnter, handleMouseLeave, syncCanvasToImage };
}

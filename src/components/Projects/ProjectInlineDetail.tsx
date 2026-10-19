'use client';

import { useState, useRef, useEffect, type PointerEvent } from 'react';
import type { WorkItemData } from '@/lib/LoadContent';
import Image from 'next/image';
type GalleryItem = NonNullable<WorkItemData['gallery']>[number];

interface ProjectInlineDetailProps {
    project: WorkItemData;
}

export default function ProjectInlineDetail({ project }: ProjectInlineDetailProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dragOffset, setDragOffset] = useState<number | null>(null);
    const dragStart = useRef(0);
    const gallery = project.gallery || [];
    const hasGallery = gallery.length > 0;
    const currentIsImage = gallery[currentSlide]?.type === 'image';

    useEffect(() => {
        if (containerRef.current) {
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    const changeSlide = (direction: 1 | -1) => {
        if (gallery.length > 1) {
            setCurrentSlide((prev) => (prev + direction + gallery.length) % gallery.length);
        }
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (!currentIsImage || gallery.length < 2 || !event.isPrimary || event.button !== 0) return;
        if ((event.target as HTMLElement).closest('button')) return;
        dragStart.current = event.clientX;
        setDragOffset(0);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (dragOffset !== null) setDragOffset(event.clientX - dragStart.current);
    };

    const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (dragOffset === null) return;
        const offset = event.clientX - dragStart.current;
        if (Math.abs(offset) > 50) changeSlide(offset < 0 ? 1 : -1);
        setDragOffset(null);
    };

    const renderGalleryItem = (item: GalleryItem) => {
        if (item.type === 'image') {
            return (
                <div className="relative w-full h-full">
                    <Image
                        src={item.image}
                        alt={project.title}
                        fill
                        className="object-contain"
                        onError={() => {
                            console.warn(`Failed to load image: ${item.image}`);
                        }}
                        unoptimized // content images might be external or raw URLs
                    />
                </div>
            );
        }
        if (item.type === 'video') {
            console.log('Rendering video item:', item.image);
            // const style = item.width && item.height ? ({ aspectRatio: `${item.width} / ${item.height}` } as React.CSSProperties) : undefined;
            return (
                // biome-ignore lint/a11y/useMediaCaption: Video content provided by external source without captions
                <video
                    src={item.asset}
                    poster={item.image}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    // style={style}
                >
                    Your browser does not support the video tag.
                </video>
            );
        }
        if (item.type === 'youtube') {
            return (
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${item.asset}`}
                    title={project.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                />
            );
        }
        if (item.type === 'vimeo') {
            return (
                <iframe
                    src={`https://player.vimeo.com/video/${item.asset}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={project.title}
                    className="w-full h-full"
                />
            );
        }
        return null;
    };

    return (
        <div
            ref={containerRef}
            className="scroll-mt-32 w-full col-span-full mt-2 mb-6 bg-[var(--color-white)]  border-b border-[var(--color-grey)] p-4 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300"
        >
            <div className="relative max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 border-b border-[var(--color-light-grey)] pb-4 pr-10">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2 text-[var(--color-grey)]">{project.title}</h2>
                    <div className="text-sm md:text-base text-[var(--color-grey)] opacity-80 space-y-1 mb-4">
                        {project.year && (
                            <p>
                                <strong>Year:</strong> {project.year}
                            </p>
                        )}
                        {project.agency && (
                            <p>
                                <strong>Agency:</strong> {project.agency}
                            </p>
                        )}
                        {project.role && (
                            <p>
                                <strong>Role:</strong> {project.role}
                            </p>
                        )}
                        {project.tech && (
                            <p>
                                <strong>Tech:</strong> {project.tech}
                            </p>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-none">
                    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted content */}
                    <div className="text-lg leading-relaxed mb-8 retro-link" dangerouslySetInnerHTML={{ __html: project.description }} />

                    {/* Links */}
                    {project.links && project.links.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-8">
                            {project.links.map((link, _idx) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-3 py-1 font-bold uppercase tracking-wider border-2 border-[var(--color-grey)] bg-[var(--color-white)] text-[var(--color-grey)] shadow-[2px_2px_0_0_var(--color-grey)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--color-grey)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 text-xs no-underline"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Gallery Slider */}
                    {hasGallery && (
                        <figure
                            className="w-full mb-12"
                            aria-label={`${project.title} gallery`}
                            onKeyDown={(event) => {
                                if ((event.target as HTMLElement).closest('video, iframe')) return;
                                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                                    event.preventDefault();
                                    changeSlide(event.key === 'ArrowLeft' ? -1 : 1);
                                }
                            }}
                        >
                            <div
                                className={`relative aspect-video w-full overflow-hidden bg-[var(--color-light-grey)]/20 border border-[var(--color-light-grey)] ${
                                    currentIsImage && gallery.length > 1 ? 'cursor-grab active:cursor-grabbing touch-pan-y select-none' : ''
                                }`}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={() => setDragOffset(null)}
                                onLostPointerCapture={() => setDragOffset(null)}
                            >
                                <div
                                    className={`flex h-full ${
                                        dragOffset === null
                                            ? 'transition-transform duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none'
                                            : ''
                                    }`}
                                    style={{ transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset ?? 0}px))` }}
                                >
                                    {gallery.map((item, idx) => (
                                        <div
                                            // biome-ignore lint/suspicious/noArrayIndexKey: Slides follow the static gallery order
                                            key={idx}
                                            aria-hidden={idx !== currentSlide}
                                            inert={idx !== currentSlide}
                                            className={`relative w-full h-full shrink-0 flex items-center justify-center ${
                                                item.type === 'image' ? 'pointer-events-none' : ''
                                            }`}
                                        >
                                            {(item.type === 'image' || idx === currentSlide) && renderGalleryItem(item)}
                                        </div>
                                    ))}
                                </div>

                                {gallery.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => changeSlide(-1)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-[#fff] backdrop-blur-sm hover:bg-black/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff]"
                                            aria-label="Previous slide"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path
                                                    d="M10 3L5 8L10 13"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => changeSlide(1)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-[#fff] backdrop-blur-sm hover:bg-black/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff]"
                                            aria-label="Next slide"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path
                                                    d="M6 3L11 8L6 13"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Slider Controls */}
                            {gallery.length > 1 && (
                                <>
                                    <div className="flex flex-wrap items-center justify-center mt-3">
                                        {gallery.map((_, idx) => (
                                            <button
                                                type="button"
                                                // biome-ignore lint/suspicious/noArrayIndexKey: Dots correspond to array indices
                                                key={idx}
                                                onClick={() => setCurrentSlide(idx)}
                                                className="group flex h-6 items-center justify-center px-1.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-grey)]"
                                                aria-label={`Go to slide ${idx + 1}`}
                                                aria-current={idx === currentSlide ? 'true' : undefined}
                                            >
                                                <span
                                                    className={`h-1.5 rounded-full bg-[var(--color-grey)] transition-all duration-300 motion-reduce:transition-none ${
                                                        idx === currentSlide ? 'w-3' : 'w-1.5 opacity-40 group-hover:opacity-70'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-xs text-[var(--color-grey)] opacity-60 mt-1" aria-live="polite" aria-atomic="true">
                                        {currentSlide + 1} / {gallery.length}
                                    </p>
                                </>
                            )}
                        </figure>
                    )}

                    {/* Sub Projects */}
                    {project.sub && (
                        <div className="mt-12 space-y-12 border-t border-[var(--color-light-grey)] pt-8">
                            {project.sub.map((sub, idx) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: Sub-projects are static list
                                <div key={idx} className="space-y-4">
                                    <h3 className="text-xl font-bold text-[var(--color-grey)]">{sub.title}</h3>
                                    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted content */}
                                    <div className="retro-link" dangerouslySetInnerHTML={{ __html: sub.description }} />
                                    {sub.tech && (
                                        <p className="text-sm text-[var(--color-grey)] opacity-80">
                                            <strong>Tech:</strong> {sub.tech}
                                        </p>
                                    )}
                                    {sub.video && (
                                        <div className="mt-4">
                                            {/* biome-ignore lint/a11y/useMediaCaption: No captions available for demo videos */}
                                            <video controls className="w-full max-h-[600px] bg-[var(--color-white)]">
                                                <source src={sub.video} />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

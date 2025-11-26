'use client';

import { useState, useRef, useEffect } from 'react';
import type { WorkItemData } from '@/lib/LoadContent';
import Image from 'next/image';
type GalleryItem = NonNullable<WorkItemData['gallery']>[number];

interface ProjectInlineDetailProps {
    project: WorkItemData;
}

export default function ProjectInlineDetail({ project }: ProjectInlineDetailProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const gallery = project.gallery || [];
    const hasGallery = gallery.length > 0;

    useEffect(() => {
        if (containerRef.current) {
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % gallery.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + gallery.length) % gallery.length);
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
                        <div className="w-full mb-12">
                            <div className="relative w-full bg-[var(--color-light-grey)]/20 border border-[var(--color-light-grey)]">
                                <div className="relative aspect-video w-full overflow-hidden flex items-center justify-center">
                                    {renderGalleryItem(gallery[currentSlide])}
                                </div>
                            </div>

                            {/* Slider Controls */}
                            {gallery.length > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={prevSlide}
                                        className="
                                            inline-flex items-center justify-center px-2 py-1 md:px-3
                                            font-bold text-[10px] md:text-xs
                                            border-2 border-[var(--color-grey)] bg-[var(--color-white)] text-[var(--color-grey)]
                                            shadow-[2px_2px_0_0_var(--color-grey)]
                                            hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--color-grey)]
                                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                                            transition-all duration-100
                                        "
                                        aria-label="Previous image"
                                    >
                                        &#x25C4;
                                    </button>

                                    <div className="flex gap-2">
                                        {gallery.map((_, idx) => (
                                            <button
                                                type="button"
                                                // biome-ignore lint/suspicious/noArrayIndexKey: Dots correspond to array indices
                                                key={idx}
                                                onClick={() => setCurrentSlide(idx)}
                                                className={`w-2 h-2 transition-colors ${
                                                    idx === currentSlide
                                                        ? 'bg-[var(--color-grey)]'
                                                        : 'bg-[var(--color-grey)]/40 hover:bg-[var(--color-grey)]/70'
                                                }`}
                                                aria-label={`Go to slide ${idx + 1}`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextSlide}
                                        className="
                                            inline-flex items-center justify-center px-2 py-1 md:px-3
                                            font-bold text-[10px] md:text-xs
                                            border-2 border-[var(--color-grey)] bg-[var(--color-white)] text-[var(--color-grey)]
                                            shadow-[2px_2px_0_0_var(--color-grey)]
                                            hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_var(--color-grey)]
                                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                                            transition-all duration-100
                                        "
                                        aria-label="Next image"
                                    >
                                        &#x25BA;
                                    </button>
                                </div>
                            )}
                        </div>
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

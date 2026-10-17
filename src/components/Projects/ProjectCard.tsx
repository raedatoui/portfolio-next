'use client';

import useNervousHover from '@/hooks/useNervousHover';
import type { WorkItemData } from '@/lib/LoadContent';

interface ProjectCardProps {
    project: WorkItemData;
    projectId: string;
    voiceIndex: number;
    frameRate: number;
    onSelect: (projectId: string) => void;
    isSelected: boolean;
    isDisabled?: boolean;
}

export default function ProjectCard({ project, projectId, voiceIndex, frameRate, onSelect, isSelected, isDisabled }: ProjectCardProps) {
    const { canvasRef, imgRef, showPixels, handleMouseEnter, handleMouseLeave, syncCanvasToImage } = useNervousHover({
        voiceIndex,
        frameRate,
        enabled: !isDisabled && !isSelected,
    });

    const imgSrc = project.thumb.image;
    const filterStyle = project.thumb.invert ? 'var(--invert-filter)' : 'none';

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        syncCanvasToImage(img, img.width, img.height);
    };

    return (
        <button
            type="button"
            className={`cursor-pointer outline-none transition-all duration-300 ${isDisabled ? 'grayscale opacity-20 pointer-events-none' : ''}`}
            onClick={() => !isDisabled && onSelect(projectId)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="relative w-full"
                style={{
                    maskImage: projectId === 'jejunemoon' ? 'radial-gradient(ellipse closest-side, #000 85%, transparent 100%)' : undefined,
                }}
            >
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

'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import type { WorkData, WorkSectionData } from '@/lib/LoadContent';
import ProjectCard from './ProjectCard';
import ProjectInlineDetail from './ProjectInlineDetail';
import { useProjectColumns } from '@/hooks/useProjectColumns';

interface ProjectsGridProps {
    workData: WorkData;
    initialProject?: string;
}

export default function ProjectsGrid({ workData, initialProject }: ProjectsGridProps) {
    const { portfolioFrameRate, selectedProjectId, setSelectedProjectId } = useApp();
    const columns = useProjectColumns();
    const isFirstMount = useRef(true);

    useEffect(() => {
        // Sync prop to context
        setSelectedProjectId(initialProject || null);
    }, [initialProject, setSelectedProjectId]);

    useEffect(() => {
        if (initialProject) {
            // Give a small delay for the layout to settle (especially with the expanding grid)
            const timer = setTimeout(() => {
                const element = document.getElementById(`project-${initialProject}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [initialProject]);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        let pageTitle = '';
        const pagePath = selectedProjectId ? `/projects/${selectedProjectId}` : '/';

        if (selectedProjectId) {
            const section = Object.values(workData).find((s) => s.work[selectedProjectId]);
            if (section) {
                pageTitle = section.work[selectedProjectId].title;
            }
        }

        // Update document title
        document.title = `Raed Atoui | ${pageTitle}`;

        // biome-ignore lint/suspicious/noExplicitAny: DataLayer is dynamic
        const w = window as unknown as Window & { dataLayer: any[] };
        w.dataLayer = w.dataLayer || [];

        w.dataLayer.push({
            event: 'page_view',
            page_path: pagePath,
            page_location: window.location.href,
            page_title: pageTitle,
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('GTM page_view event pushed:', {
                page_path: pagePath,
                page_location: window.location.href,
                page_title: pageTitle,
            });
        }
    }, [selectedProjectId, workData]);

    useEffect(() => {
        const handlePopState = () => {
            const match = window.location.pathname.match(/\/projects\/([^/]+)/);
            if (match?.[1]) {
                setSelectedProjectId(match[1]);
            } else {
                setSelectedProjectId(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [setSelectedProjectId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && selectedProjectId) {
                setSelectedProjectId(null);
                window.history.pushState(null, '', '/');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProjectId, setSelectedProjectId]);

    const handleProjectSelect = (projectId: string) => {
        if (selectedProjectId === projectId) {
            setSelectedProjectId(null);
            window.history.pushState(null, '', '/');
        } else {
            setSelectedProjectId(projectId);
            window.history.pushState(null, '', `/projects/${projectId}`);
            // Optional: scroll to project?
        }
    };

    let counter = 0;

    return (
        <>
            {Object.entries(workData).map(([workId, section]: [string, WorkSectionData]) => {
                const projectEntries = Object.entries(section.work);
                const rows = [];
                for (let i = 0; i < projectEntries.length; i += columns) {
                    rows.push(projectEntries.slice(i, i + columns));
                }

                return (
                    <Section key={workId} id={workId}>
                        <SectionHeading>{section.label}</SectionHeading>
                        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted content */}
                        <div className="mb-6 leading-relaxed text-base md:text-lg" dangerouslySetInnerHTML={{ __html: section.description }} />

                        <div className="grid gap-x-4 gap-y-8 md:gap-8 lg:gap-12 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {rows.map((row, rowIndex) => {
                                const rowHasSelected = row.some(([id]) => id === selectedProjectId);

                                return (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: Layout rows are stable
                                    <div key={rowIndex} className="contents">
                                        {row.map(([projectId, project]) => {
                                            counter++;
                                            const isSelected = selectedProjectId === projectId;
                                            const isDisabled = selectedProjectId !== null && !isSelected;

                                            return (
                                                <div key={projectId} id={`project-${projectId}`} className="contents">
                                                    <ProjectCard
                                                        projectId={projectId}
                                                        project={project}
                                                        voiceIndex={counter}
                                                        frameRate={portfolioFrameRate}
                                                        onSelect={handleProjectSelect}
                                                        isSelected={isSelected}
                                                        isDisabled={isDisabled}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {rowHasSelected && selectedProjectId && section.work[selectedProjectId] && (
                                            <ProjectInlineDetail project={section.work[selectedProjectId]} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                );
            })}
        </>
    );
}

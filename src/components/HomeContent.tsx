'use client';

import Bio from '@/components/Bio';
import Employers from '@/components/Employers';
import ProjectsGrid from '@/components/Projects';
import StuffList from '@/components/StuffList';
import { useApp } from '@/context/AppContext';

interface HomeContentProps {
    initialProject?: string;
}

export default function HomeContent({ initialProject }: HomeContentProps) {
    const { content } = useApp();
    const { bio, languages, tech, employers, work } = content;

    return (
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Bio data={bio} />

            <Employers data={employers} />

            <StuffList title="Languages" items={languages} type="language" />

            <StuffList title="Tech" items={tech} type="tech" />

            <ProjectsGrid workData={work} initialProject={initialProject} />
        </main>
    );
}

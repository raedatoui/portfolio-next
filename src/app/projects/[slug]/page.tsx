import HomeContent from '@/components/HomeContent';
import { loadContent } from '@/lib/LoadContent';

export function generateStaticParams() {
    const { work } = loadContent();
    const paths = [];

    // Iterate through all work sections (work, agency, etc.)
    for (const sectionKey in work) {
        // @ts-expect-error - we know the structure
        const section = work[sectionKey];
        for (const projectId in section.work) {
            paths.push({ slug: projectId });
        }
    }
    return paths;
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <HomeContent initialProject={slug} />;
}

'use client';

import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import type { LanguageData, TechData } from '@/lib/LoadContent';

type Language = LanguageData[number];
type Tech = TechData[number];

type Item = Language | Tech;

interface StuffListProps {
    title: string;
    items: Item[];
    type: 'language' | 'tech';
}

export default function StuffList({ title, items, type }: StuffListProps) {
    return (
        <Section id={title.toLowerCase()}>
            <SectionHeading>{title}</SectionHeading>
            <div className="flex flex-wrap gap-x-6 gap-y-4 md:gap-x-8 md:gap-y-6 text-lg md:text-xl">
                {items.map((item, _index) => (
                    <div key={`${type}-${item.name}`}>
                        <span className="text-grey">{item.name}</span>
                    </div>
                ))}
            </div>
        </Section>
    );
}

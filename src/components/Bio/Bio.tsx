'use client';

import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import type { BioData } from '@/lib/LoadContent';
import { CDN_URL } from '@/lib/constants';

interface BioProps {
    data: BioData;
}

export default function Bio({ data }: BioProps) {
    const playRandomFarts = () => {
        // Pick 3 random fart sounds
        const fartSounds = [
            Math.floor(Math.random() * 7) + 1,
            Math.floor(Math.random() * 7) + 1,
            Math.floor(Math.random() * 7) + 1,
            Math.floor(Math.random() * 7) + 1,
            Math.floor(Math.random() * 7) + 1,
            Math.floor(Math.random() * 7) + 1,
            Math.floor(Math.random() * 7) + 1,
        ];

        let cumulativeDelay = 0;

        fartSounds.forEach((fartNumber) => {
            // Random delay between 50-150ms for confetti effect
            const delay = Math.random() * 250 + 50;
            cumulativeDelay += delay;

            setTimeout(() => {
                const audio = new Audio(`${CDN_URL}/assets/audio/fart${fartNumber}.ogg`);
                audio.play().catch(() => {
                    // Ignore autoplay errors
                });
            }, cumulativeDelay);
        });
    };

    return (
        <Section id="about">
            <SectionHeading>About</SectionHeading>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Content comes from trusted local JSON */}
            <div className="mb-4 leading-relaxed text-base md:text-lg" dangerouslySetInnerHTML={{ __html: data.content }} />
            <a
                href={data.link}
                target="_blank"
                rel="noreferrer"
                onClick={playRandomFarts}
                className="inline-block px-5 py-2 font-bold uppercase tracking-wider border-2 border-grey bg-white text-grey shadow-[4px_4px_0_0_var(--color-grey)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-grey)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 text-base md:text-lg"
            >
                View Resume
            </a>
        </Section>
    );
}

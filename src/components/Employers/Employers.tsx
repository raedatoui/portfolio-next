'use client';

import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import type { EmployerData } from '@/lib/LoadContent';
import EmployerLogo from './EmployerLogo';

interface EmployersProps {
    data: EmployerData;
}

export default function Employers({ data }: EmployersProps) {
    let detuneCounter = 0;

    return (
        <Section id="employers">
            <SectionHeading>Employers</SectionHeading>

            <div className="flex flex-col gap-12">
                {data.map((section) => (
                    <div key={section.section}>
                        <h3 className="text-2xl font-medium mb-6 pb-1.5x">{section.title}</h3>

                        <div className="grid grid-cols-2 justify-items-center gap-x-8 gap-y-8 md:flex md:flex-wrap md:justify-start md:gap-x-10 md:gap-y-12 items-start">
                            {section.experience.map((item, idx) => {
                                detuneCounter++;
                                const content = (
                                    <div className="w-40 flex flex-col items-center group">
                                        <div className="w-full h-20 flex items-center justify-center relative">
                                            <EmployerLogo src={item.logo} name={item.name} logoStyle={item.logo_style} detune={detuneCounter} />
                                        </div>

                                        {/* Info below with hairline */}
                                        <div className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-t border-lightGrey mt-2 pt-2 text-center">
                                            <div className="font-bold text-sm leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-grey mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.dates}</div>
                                        </div>
                                    </div>
                                );

                                return (
                                    <div key={`${section.section}-${idx}`}>
                                        {item.link ? (
                                            <a href={item.link} target="_blank" rel="noreferrer" className="block">
                                                {content}
                                            </a>
                                        ) : (
                                            <div className="block">{content}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

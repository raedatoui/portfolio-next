interface SectionProps {
    id?: string;
    children: React.ReactNode;
}

export default function Section({ id, children }: SectionProps) {
    return (
        <section id={id} className="pb-16 md:pb-20">
            {children}
        </section>
    );
}

interface SectionHeadingProps {
    children: React.ReactNode;
}

export default function SectionHeading({ children }: SectionHeadingProps) {
    return <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">{children}</h2>;
}

import { useState, useEffect } from 'react';

export function useProjectColumns() {
    const [columns, setColumns] = useState(2); // Default to mobile (2 cols)

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1024) {
                setColumns(4); // lg
            } else if (width >= 768) {
                setColumns(3); // md
            } else {
                setColumns(2); // default/sm
            }
        };

        // Initial call
        updateColumns();

        // Debounce could be added here if needed, but for simple resize logic this is usually fine
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    return columns;
}

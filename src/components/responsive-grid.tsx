import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
    children: React.ReactNode;
    cols?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: number;
    className?: string;
}

export function ResponsiveGrid({
    children,
    cols = { default: 1, sm: 1, md: 2, lg: 3 },
    gap = 4,
    className
}: ResponsiveGridProps) {
    const gridClasses = cn(
        'grid',
        `gap-${gap}`,
        cols.default && `grid-cols-${cols.default}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        className
    );

    return <div className={gridClasses}>{children}</div>;
}

interface ResponsiveCardGridProps extends ResponsiveGridProps {
    minCardWidth?: string;
}

export function ResponsiveCardGrid({
    children,
    minCardWidth = '280px',
    gap = 4,
    className
}: ResponsiveCardGridProps) {
    return (
        <div
            className={cn('grid gap-4', className)}
            style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(min(${minCardWidth}, 100%), 1fr))`
            }}
        >
            {children}
        </div>
    );
}

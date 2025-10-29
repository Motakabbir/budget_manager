import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('mb-6 md:mb-8', className)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground md:text-base">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

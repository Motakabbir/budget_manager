import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    Target,
    Wallet,
    Calculator,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Quick Access Component
 * 
 * Provides fast shortcuts to most-used features in the top bar
 * Features:
 * - Quick Add (Income/Expense)
 * - Most Used Pages
 * - Smart Shortcuts
 */

interface QuickAction {
    name: string;
    description: string;
    icon: React.ElementType;
    href?: string;
    onClick?: () => void;
    badge?: string;
    shortcut?: string;
}

const quickAddActions: QuickAction[] = [
    {
        name: 'Add Income',
        description: 'Record income transaction',
        icon: TrendingUp,
        href: '/income',
        shortcut: 'Ctrl+I',
    },
    {
        name: 'Add Expense',
        description: 'Record expense transaction',
        icon: TrendingDown,
        href: '/expenses',
        shortcut: 'Ctrl+E',
    },
    {
        name: 'Create Budget',
        description: 'Set up a new budget',
        icon: PieChart,
        href: '/budgets',
        shortcut: 'Ctrl+B',
    },
    {
        name: 'Add Goal',
        description: 'Create financial goal',
        icon: Target,
        href: '/goals',
        shortcut: 'Ctrl+G',
    },
];

const mostUsedPages: QuickAction[] = [
    {
        name: 'Dashboard',
        description: 'Overview of your finances',
        icon: Wallet,
        href: '/dashboard',
    },
    {
        name: 'Budgets',
        description: 'Budget tracking & alerts',
        icon: PieChart,
        href: '/budgets',
        badge: 'Hot',
    },
    {
        name: 'Reports',
        description: 'Financial reports & analytics',
        icon: BarChart3,
        href: '/reports',
    },
    {
        name: 'Goals',
        description: 'Track financial goals',
        icon: Target,
        href: '/goals',
    },
    {
        name: 'Forecasting',
        description: 'Budget forecasting',
        icon: Calculator,
        href: '/forecasting',
    },
];

interface QuickAccessProps {
    className?: string;
}

export function QuickAccess({ className }: QuickAccessProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Quick Add Button */}
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        data-tour="quick-add"
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Quick Add</span>
                        <Zap className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Quick Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {quickAddActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <DropdownMenuItem key={action.name} asChild>
                                <Link
                                    to={action.href || '#'}
                                    className="flex items-start gap-3 py-3 cursor-pointer group"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">
                                            {action.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {action.description}
                                        </div>
                                    </div>
                                    {action.shortcut && (
                                        <kbd className="hidden lg:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground">
                                            {action.shortcut}
                                        </kbd>
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Most Used
                    </DropdownMenuLabel>

                    {mostUsedPages.slice(0, 3).map((page) => {
                        const Icon = page.icon;
                        return (
                            <DropdownMenuItem key={page.name} asChild>
                                <Link
                                    to={page.href || '#'}
                                    className="flex items-center gap-3 py-2 cursor-pointer"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1 text-sm">{page.name}</span>
                                    {page.badge && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs px-1.5 py-0"
                                        >
                                            {page.badge}
                                        </Badge>
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop: Direct shortcuts for most used */}
            <div className="hidden xl:flex items-center gap-1">
                {mostUsedPages.slice(0, 3).map((page) => {
                    const Icon = page.icon;
                    return (
                        <Button
                            key={page.name}
                            variant="ghost"
                            size="sm"
                            asChild
                            className="gap-2 hover:bg-accent"
                        >
                            <Link to={page.href || '#'}>
                                <Icon className="h-4 w-4" />
                                <span className="text-xs">{page.name}</span>
                                {page.badge && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs px-1.5 py-0 ml-1"
                                    >
                                        {page.badge}
                                    </Badge>
                                )}
                            </Link>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

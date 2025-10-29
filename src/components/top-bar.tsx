import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface TopBarProps {
    onMenuClick: () => void;
    className?: string;
}

const pageNames: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/categories': 'Categories',
    '/income': 'Income',
    '/expenses': 'Expenses',
    '/settings': 'Settings',
};

export function TopBar({ onMenuClick, className }: TopBarProps) {
    const location = useLocation();
    const currentPage = pageNames[location.pathname] || 'Budget Manager';

    return (
        <header
            className={cn(
                'sticky top-0 left-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-lg border-b shadow-sm  transition-all duration-300',
                className
            )}
        >
            <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Left: Mobile menu button & Page Title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden shrink-0 hover:bg-accent"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>

                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                            {currentPage}
                        </h1>
                    </div>
                </div>

                {/* Center: Search (hidden on mobile) */}
                <div className="hidden lg:flex items-center flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search transactions..."
                            className="w-full h-9 pl-10 pr-4 rounded-lg border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    {/* Mobile search button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden hover:bg-accent"
                    >
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Search</span>
                    </Button>

                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative hover:bg-accent"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card animate-pulse" />
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* Theme toggle */}
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

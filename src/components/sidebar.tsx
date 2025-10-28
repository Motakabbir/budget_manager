import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Tag,
    TrendingUp,
    TrendingDown,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const location = useLocation();
    const pathname = location.pathname;
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
    };

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 ease-in-out shadow-lg',
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-6 bg-linear-to-r from-blue-600/10 to-purple-600/10">
                        <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Budget Manager</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sign out button */}
                    <div className="border-t p-3 bg-muted/30">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

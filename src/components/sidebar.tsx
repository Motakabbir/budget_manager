import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Tag,
    TrendingUp,
    TrendingDown,
    Settings,
    LogOut,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const pathname = location.pathname;

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose();
    }, [pathname]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
    };

    return (
        <>
            {/* Overlay for mobile - with smooth fade in/out */}
            <div
                className={cn(
                    'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-all duration-300 ease-in-out',
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar - with smooth slide animation */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r shadow-2xl transition-all duration-300 ease-in-out md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo & Close Button */}
                    <div className="flex h-16 items-center justify-between border-b px-6 bg-linear-to-r from-blue-600/10 to-purple-600/10">
                        <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Budget Manager
                        </h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden hover:bg-accent"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close menu</span>
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                        {navigation.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-[1.02]',
                                        isActive
                                            ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                                    )}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                    }}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sign out button */}
                    <div className="border-t p-3 bg-muted/30">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}

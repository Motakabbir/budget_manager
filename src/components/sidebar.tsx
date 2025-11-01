import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Tag,
    TrendingUp,
    TrendingDown,
    Bell,
    Settings,
    LogOut,
    X,
    Building2,
    CreditCard,
    HandCoins,
    RefreshCw,
    PieChart,
    Wallet,
    Briefcase,
    BarChart3,
    Shield,
    Calculator,
    TrendingUpDown,
    Target,
    ChevronDown,
    ChevronRight,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BudgetAlertBadge } from '@/components/budgets';

// Grouped navigation for better organization
const navigationGroups = [
    {
        id: 'overview',
        name: 'Overview',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
        ],
    },
    {
        id: 'financial',
        name: 'Financial Accounts',
        collapsible: true,
        items: [
            { name: 'Bank Accounts', href: '/bank-accounts', icon: Building2, tourId: 'nav-accounts' },
            { name: 'Payment Cards', href: '/cards', icon: CreditCard },
            { name: 'Loans', href: '/loans', icon: HandCoins },
            { name: 'Investments', href: '/investments', icon: Wallet },
            { name: 'Assets', href: '/assets', icon: Briefcase },
        ],
    },
    {
        id: 'transactions',
        name: 'Transactions',
        collapsible: true,
        items: [
            { name: 'Income', href: '/income', icon: TrendingUp },
            { name: 'Expenses', href: '/expenses', icon: TrendingDown },
            { name: 'Recurring', href: '/recurring', icon: RefreshCw },
            { name: 'Categories', href: '/categories', icon: Tag },
        ],
    },
    {
        id: 'planning',
        name: 'Planning & Goals',
        collapsible: true,
        items: [
            { name: 'Budgets', href: '/budgets', icon: PieChart, showBadge: true, tourId: 'nav-budgets' },
            { name: 'Advanced Budgeting', href: '/budgets-advanced', icon: Calculator },
            { name: 'Forecasting', href: '/forecasting', icon: TrendingUpDown },
            { name: 'Financial Goals', href: '/goals', icon: Target, tourId: 'nav-goals' },
        ],
    },
    {
        id: 'analytics',
        name: 'Reports & Analytics',
        collapsible: true,
        items: [
            { name: 'Reports', href: '/reports', icon: BarChart3, tourId: 'nav-reports' },
            { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        ],
    },
    {
        id: 'settings',
        name: 'Settings',
        collapsible: true,
        items: [
            { name: 'Profile', href: '/profile', icon: User },
            { name: 'Notifications', href: '/notifications', icon: Bell },
            { name: 'Preferences', href: '/notification-preferences', icon: Bell },
            { name: 'Security', href: '/security', icon: Shield },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const pathname = location.pathname;
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Toggle group collapse
    const toggleGroup = (groupId: string) => {
        const newCollapsed = new Set(collapsedGroups);
        if (newCollapsed.has(groupId)) {
            newCollapsed.delete(groupId);
        } else {
            newCollapsed.add(groupId);
        }
        setCollapsedGroups(newCollapsed);
    };

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
                    <nav className="flex-1 space-y-3 px-3 py-4 overflow-y-auto custom-scrollbar">
                        {navigationGroups.map((group) => {
                            const isCollapsed = collapsedGroups.has(group.id);
                            const hasActiveItem = group.items.some(item => pathname === item.href);

                            return (
                                <div key={group.id} className="space-y-1">
                                    {/* Group Header */}
                                    {group.collapsible ? (
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <span>{group.name}</span>
                                            {isCollapsed ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </button>
                                    ) : (
                                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                                            {group.name}
                                        </div>
                                    )}

                                    {/* Group Items */}
                                    {!isCollapsed && (
                                        <div className="space-y-1">
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = pathname === item.href;

                                                return (
                                                    <Link
                                                        key={item.name}
                                                        to={item.href}
                                                        data-tour={item.tourId}
                                                        className={cn(
                                                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 transform hover:scale-[1.02]',
                                                            isActive
                                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                                                        )}
                                                    >
                                                        <Icon className="h-4 w-4 shrink-0" />
                                                        <span className="flex-1">{item.name}</span>
                                                        {'showBadge' in item && item.showBadge && <BudgetAlertBadge />}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
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

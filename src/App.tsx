import { useEffect, lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/loading/LoadingSkeletons';
import { scheduledNotificationProcessor } from '@/lib/services/scheduled-notification-processor';
import { PINLockScreen } from '@/components/security/PINLockScreen';
import { useSecuritySettings } from '@/lib/hooks/use-security';

// Eager load auth and layout (needed immediately)
import AuthPage from '@/pages/AuthPage';
import DashboardLayout from '@/pages/DashboardLayout';

// Lazy load pages (loaded on demand)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const BankAccountsPage = lazy(() => import('@/pages/BankAccountsPage'));
const CardsPage = lazy(() => import('@/pages/CardsPage'));
const LoansPage = lazy(() => import('@/pages/LoansPage'));
const RecurringTransactionsPage = lazy(() => import('@/pages/RecurringTransactionsPage'));
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage'));
const InvestmentsPage = lazy(() => import('@/pages/InvestmentsPage'));
const AssetsPage = lazy(() => import('@/pages/AssetsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const IncomePage = lazy(() => import('@/pages/IncomePage'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SecuritySettingsPage = lazy(() => import('@/pages/SecuritySettingsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/NotificationPreferencesPage'));

function App() {
    const navigate = useNavigate();
    const [isLocked, setIsLocked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { data: settings } = useSecuritySettings();

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);

            if (!session && window.location.pathname !== '/auth') {
                navigate('/auth');
            } else if (session && window.location.pathname === '/') {
                navigate('/dashboard');
            }

            // Check if PIN is required on launch
            if (session && settings?.require_pin_on_launch && settings.pin_enabled) {
                setIsLocked(true);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);

            if (!session) {
                setIsLocked(false);
                navigate('/auth');
            }
        });

        // Listen for lock events from security service
        const handleShowLock = () => setIsLocked(true);
        window.addEventListener('show-pin-lock', handleShowLock);

        // Initialize scheduled notification processor
        // This will start processing scheduled notifications in development mode
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const processor = scheduledNotificationProcessor;

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('show-pin-lock', handleShowLock);
        };
    }, [navigate, settings]);

    // Show PIN lock screen if locked and authenticated
    if (isLocked && isAuthenticated) {
        return <PINLockScreen onUnlock={() => setIsLocked(false)} />;
    }

    return (
        <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<DashboardLayout />}>
                <Route
                    path="dashboard"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <DashboardPage />
                        </Suspense>
                    }
                />
                <Route
                    path="bank-accounts"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <BankAccountsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="cards"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <CardsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="loans"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <LoansPage />
                        </Suspense>
                    }
                />
                <Route
                    path="recurring"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <RecurringTransactionsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="budgets"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <BudgetsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="investments"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <InvestmentsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="assets"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <AssetsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="analytics"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <AnalyticsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="reports"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <ReportsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="income"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <IncomePage />
                        </Suspense>
                    }
                />
                <Route
                    path="expenses"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <ExpensesPage />
                        </Suspense>
                    }
                />
                <Route
                    path="categories"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <CategoriesPage />
                        </Suspense>
                    }
                />
                <Route
                    path="notifications"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <NotificationsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="notification-preferences"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <NotificationPreferencesPage />
                        </Suspense>
                    }
                />
                <Route
                    path="settings"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <SettingsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="security"
                    element={
                        <Suspense fallback={<DashboardSkeleton />}>
                            <SecuritySettingsPage />
                        </Suspense>
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/loading/LoadingSkeletons';
import { scheduledNotificationProcessor } from '@/lib/services/scheduled-notification-processor';

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
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/NotificationPreferencesPage'));

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session && window.location.pathname !== '/auth') {
                navigate('/auth');
            } else if (session && window.location.pathname === '/') {
                navigate('/dashboard');
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/auth');
            }
        });

        // Initialize scheduled notification processor
        // This will start processing scheduled notifications in development mode
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const processor = scheduledNotificationProcessor;

        return () => subscription.unsubscribe();
    }, [navigate]);

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
            </Route>
        </Routes>
    );
}

export default App;

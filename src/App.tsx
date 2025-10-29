import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/loading/LoadingSkeletons';

// Eager load auth and layout (needed immediately)
import AuthPage from '@/pages/AuthPage';
import DashboardLayout from '@/pages/DashboardLayout';

// Lazy load pages (loaded on demand)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const IncomePage = lazy(() => import('@/pages/IncomePage'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

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

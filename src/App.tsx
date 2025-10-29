import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

// Pages
import AuthPage from '@/pages/AuthPage';
import DashboardLayout from '@/pages/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import IncomePage from '@/pages/IncomePage';
import ExpensesPage from '@/pages/ExpensesPage';
import CategoriesPage from '@/pages/CategoriesPage';
import SettingsPage from '@/pages/SettingsPage';
import NotificationsPage from '@/pages/NotificationsPage';

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
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="income" element={<IncomePage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    );
}

export default App;

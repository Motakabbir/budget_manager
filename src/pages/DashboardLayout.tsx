import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 bg-background">
                <Outlet />
            </main>
        </div>
    );
}

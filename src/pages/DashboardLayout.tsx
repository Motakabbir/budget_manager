import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 md:ml-64 w-full">
                <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { Footer } from '@/components/footer';
import { useRecurringAutoProcess } from '@/lib/hooks/use-recurring-auto-process';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Auto-process recurring transactions on app load
    useRecurringAutoProcess();

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-col flex-1 md:ml-72 w-full min-h-screen">
                <TopBar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
                        <Outlet />
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

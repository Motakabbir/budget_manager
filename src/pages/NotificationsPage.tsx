import React from 'react';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-2 mb-6">
                <Bell className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            <p>Notifications page coming soon...</p>
        </div>
    );
}
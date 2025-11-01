/* eslint-disable no-console */

import { notificationService } from './notification-service';

/**
 * Scheduled notification processor for client-side applications
 * In production, this would be replaced with server-side cron jobs
 */
export class ScheduledNotificationProcessor {
    private static instance: ScheduledNotificationProcessor;
    private isProcessing = false;
    private intervalId: number | null = null;

    constructor() {
        // Check for scheduled notifications every 5 minutes in development
        // In production, this would be handled by server-side cron jobs
        if (import.meta.env.DEV) {
            this.startPeriodicProcessing();
        }
    }

    public static getInstance(): ScheduledNotificationProcessor {
        if (!ScheduledNotificationProcessor.instance) {
            ScheduledNotificationProcessor.instance = new ScheduledNotificationProcessor();
        }
        return ScheduledNotificationProcessor.instance;
    }

    /**
     * Process all pending scheduled notifications
     */
    async processScheduledNotifications(): Promise<{
        processed: number;
        sent: number;
        failed: number;
        cancelled: number;
    }> {
        if (this.isProcessing) {
            return { processed: 0, sent: 0, failed: 0, cancelled: 0 };
        }

        this.isProcessing = true;

        try {
            // Get count before processing
            const stats = await this.getScheduledNotificationStats();

            // Process notifications
            await notificationService.processScheduledNotifications();

            // Get count after processing to calculate differences
            const newStats = await this.getScheduledNotificationStats();

            return {
                processed: stats.total - newStats.total,
                sent: newStats.sent - stats.sent,
                failed: newStats.failed - stats.failed,
                cancelled: newStats.cancelled - stats.cancelled,
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Start periodic processing (development only)
     */
    private startPeriodicProcessing(): void {
        // Process every 5 minutes in development
        const intervalMs = 5 * 60 * 1000;

        this.intervalId = window.setInterval(async () => {
            try {
                const result = await this.processScheduledNotifications();
                if (result.processed > 0) {
                    console.log(`Processed ${result.processed} scheduled notifications: ${result.sent} sent, ${result.failed} failed, ${result.cancelled} cancelled`);
                }
            } catch (error) {
                console.error('Error in periodic scheduled notification processing:', error);
            }
        }, intervalMs);

        console.log('Scheduled notification processor started (development mode)');
    }

    /**
     * Stop periodic processing
     */
    stopPeriodicProcessing(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Scheduled notification processor stopped');
        }
    }

    /**
     * Get statistics about scheduled notifications
     */
    private async getScheduledNotificationStats(): Promise<{
        total: number;
        sent: number;
        failed: number;
        cancelled: number;
    }> {
        try {
            // This would need to be implemented with proper database queries
            // For now, return mock data
            return {
                total: 0,
                sent: 0,
                failed: 0,
                cancelled: 0,
            };
        } catch {
            return {
                total: 0,
                sent: 0,
                failed: 0,
                cancelled: 0,
            };
        }
    }

    /**
     * Manually trigger processing (useful for testing or admin functions)
     */
    async triggerProcessing(): Promise<{
        processed: number;
        sent: number;
        failed: number;
        cancelled: number;
    }> {
        return await this.processScheduledNotifications();
    }
}

export const scheduledNotificationProcessor = ScheduledNotificationProcessor.getInstance();
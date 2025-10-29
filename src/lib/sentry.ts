import * as Sentry from '@sentry/react';

export function initSentry() {
    // Only initialize Sentry in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,

            // Set the environment
            environment: import.meta.env.MODE,

            // Performance Monitoring
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true,
                }),
            ],

            // Performance monitoring sample rate (10% of transactions)
            tracesSampleRate: 0.1,

            // Session Replay sample rate
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0, // 100% on errors

            // Ignore certain errors
            ignoreErrors: [
                // Browser extensions
                'top.GLOBALS',
                'chrome-extension://',
                'moz-extension://',
                // Network errors (handled by app)
                'NetworkError',
                'Failed to fetch',
                // Random plugins/extensions
                'Object Not Found Matching Id',
            ],

            // Filter out sensitive data
            beforeSend(event, hint) {
                // Don't send events in development
                if (import.meta.env.DEV) {
                    return null;
                }

                // Remove sensitive data from event
                if (event.request) {
                    delete event.request.cookies;
                }

                // Remove PII from breadcrumbs
                if (event.breadcrumbs) {
                    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                        if (breadcrumb.data?.email) {
                            breadcrumb.data.email = '[Filtered]';
                        }
                        return breadcrumb;
                    });
                }

                return event;
            },
        });
    }
}

// Export Sentry for manual error logging
export { Sentry };

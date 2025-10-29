import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon-192x192.png', 'icon-384x384.png', 'icon-512x512.png'],
            manifest: {
                name: 'Budget Manager',
                short_name: 'Budget',
                description: 'Manage your finances with ease - Track income, expenses, and budget goals',
                theme_color: '#3b82f6',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                icons: [
                    {
                        src: '/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png'
                    },
                    {
                        src: '/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'query-vendor': ['@tanstack/react-query'],
                    'charts': ['recharts'],
                    'date-utils': ['date-fns'],
                    'supabase': ['@supabase/supabase-js'],
                    // UI components chunk
                    'ui-components': [
                        '@/components/ui/card',
                        '@/components/ui/button',
                        '@/components/ui/input',
                        '@/components/ui/label',
                        '@/components/ui/select',
                        '@/components/ui/dialog',
                        '@/components/ui/table',
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 1000, // Increase to 1000kb to reduce warnings for intentionally large chunks
    },
});

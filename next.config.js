const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        // Cache map tiles with CacheFirst (large, rarely change)
        {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'osm-tiles',
                expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
        },
        {
            urlPattern: /^https:\/\/[a-c]\.tile\.opentopomap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'topo-tiles',
                expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
        },
        {
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'satellite-tiles',
                expiration: { maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
        },
        // Cache APRS symbol sprites
        {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/hessu\/aprs-symbols.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'aprs-symbols',
                expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
        },
        // Cache Leaflet marker icons
        {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'leaflet-assets',
                expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
        },
        // Cache Google Fonts
        {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
        },
    ],
});

/** @type {import('next').NextConfig} */
const path = require('path');
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7531';
const backend = (() => {
    try {
        return new URL(backendUrl);
    } catch {
        return null;
    }
})();

const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    turbopack: {
        // Use an absolute path for turbopack.root to avoid the warning
        root: path.resolve(__dirname),
    },
    // Configure Next Image to allow loading avatars directly from the backend host
    images: backend
        ? {
              remotePatterns: [
                  {
                      protocol: backend.protocol.replace(':', ''),
                      hostname: backend.hostname,
                      port: backend.port || undefined,
                      pathname: '/**',
                  },
              ],
          }
        : undefined,
};

module.exports = withPWA(nextConfig);

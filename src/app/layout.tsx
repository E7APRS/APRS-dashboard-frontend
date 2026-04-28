import type {Metadata} from 'next';
import {Rajdhani, Roboto} from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import {AuthProvider} from '@/components/AuthProvider';
import {ThemeProvider} from '@/components/ThemeProvider';
import React from "react";

const rajdhani = Rajdhani({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-rajdhani',
});

const roboto = Roboto({
    subsets: ['latin'],
    weight: ['300', '400', '500'],
    variable: '--font-roboto',
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://e7aprs.ba'),
    title: 'E7APRS Tracker',
    description: 'Real-time GPS tracking — DMR & APRS Network',
    openGraph: {
        title: 'E7APRS Tracker',
        description: 'Real-time GPS tracking — DMR & APRS Network',
        images: ['/e7aprs.png'],
    },
    twitter: {
        card: 'summary',
        title: 'E7APRS Tracker',
        description: 'Real-time GPS tracking — DMR & APRS Network',
        images: ['/e7aprs.png'],
    },
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        // `dark` class applied by default; ThemeProvider hydrates the correct value client-side
        <html lang="en" className="dark" suppressHydrationWarning>
        <head>
            <link rel="icon" href="/e7aprs.ico" sizes="any"/>
            <link rel="icon" type="image/png" href="/e7aprs.png"/>
            <link rel="apple-touch-icon" href="/e7aprs.png"/>
            <link rel="manifest" href="/manifest.json"/>
            <meta name="color-scheme" content="dark light"/>
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FF6600"/>
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1A1A1A"/>
            {/* OG and Twitter meta tags are handled by the Next.js metadata export */}
        </head>
        <body
            className={`${rajdhani.variable} ${roboto.variable} font-roboto bg-gray-50 dark:bg-brand-onyx text-brand-onyx dark:text-white antialiased`}>
        <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}

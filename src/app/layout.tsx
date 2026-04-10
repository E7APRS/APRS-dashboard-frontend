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
    title: 'E7APRS Tracker',
    description: 'Real-time GPS tracking — DMR & APRS Network',
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        // `dark` class applied by default; ThemeProvider hydrates the correct value client-side
        <html lang="en" className="dark" suppressHydrationWarning>
        <head>
            <link rel="icon" href="/e7aprs.ico" sizes="any"/>
            <link rel="icon" type="image/png" href="/e7aprs.png"/>
            <link rel="apple-touch-icon" href="/e7aprs.png"/>
            <meta name="color-scheme" content="dark light"/>
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FF6600"/>
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1A1A1A"/>
            <meta property="og:type" content="website"/>
            <meta property="og:title" content="E7APRS Tracker"/>
            <meta property="og:description" content="Real-time GPS tracking — DMR & APRS Network"/>
            <meta property="og:image" content="/e7aprs.png"/>
            <meta property="og:image:alt" content="E7APRS logo"/>
            <meta name="twitter:card" content="summary"/>
            <meta name="twitter:title" content="E7APRS Tracker"/>
            <meta name="twitter:description" content="Real-time GPS tracking — DMR & APRS Network"/>
            <meta name="twitter:image" content="/e7aprs.png"/>
            <meta name="twitter:image:alt" content="E7APRS logo"/>
            <title>E7APRS Tracker</title>
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

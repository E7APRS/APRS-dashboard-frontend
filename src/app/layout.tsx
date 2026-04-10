import type { Metadata } from 'next';
import { Rajdhani, Roboto } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` class applied by default; ThemeProvider hydrates the correct value client-side
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${rajdhani.variable} ${roboto.variable} font-roboto bg-gray-50 dark:bg-brand-onyx text-brand-onyx dark:text-white antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

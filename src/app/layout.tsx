import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'APRS Tracker',
  description: 'Real-time GPS tracking for DMR/APRS radios',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-800 text-white antialiased">{children}</body>
    </html>
  );
}

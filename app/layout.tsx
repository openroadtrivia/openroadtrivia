import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Open Road Trivia - The Exploration Learning Game',
  description: 'A trivia road trip across America. Route 66 Edition. 2,448 miles from Chicago to Santa Monica.',
  openGraph: {
    title: 'Open Road Trivia',
    description: 'The Exploration Learning Game. Route 66 Edition.',
    url: 'https://openroadtrivia.com',
    siteName: 'Open Road Trivia',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8f9fa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-gray-900 min-h-screen">
        <div className="max-w-2xl mx-auto min-h-screen bg-gray-50 shadow-2xl md:my-4 md:rounded-2xl md:min-h-0 md:border md:border-gray-700 relative">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}

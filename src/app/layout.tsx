import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ZenFuel — Brain Reset',
  description: 'Private, local-first tracker for reducing compulsive dopamine-seeking behaviors',
  icons: {
    icon: '/images/zenfuel-logo.png',
    apple: '/images/zenfuel-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const s = JSON.parse(localStorage.getItem('mt_settings') || '{}');
              if (s.theme !== 'light') document.documentElement.classList.add('dark');
            } catch {}
          `
        }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

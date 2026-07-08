import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const APP_URL = 'https://zenfuel.app';
const OG_IMAGE = `${APP_URL}/images/zenfuel-logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ZenFuel — Brain Reset',
    template: '%s | ZenFuel',
  },
  description:
    'Free brain reset app. Break the doom-scroll habit and rebuild real focus in 30 days. No downloads needed — just open and start.',
  verification: {
    google: 'LX94JUsB9K98en8siDYe4LRrcQDgbg67if0RN7lNPCw',
  },
  keywords: [
    'dopamine detox', 'brain reset', 'doom scroll', 'digital detox',
    'habit tracker', 'screen time', 'social media detox', 'focus app',
    'productivity', 'self improvement', 'addiction tracker',
  ],
  authors: [{ name: 'ZenFuel' }],
  creator: 'ZenFuel',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: 'ZenFuel',
    title: 'ZenFuel — Brain Reset',
    description:
      'Free brain reset app. Break the doom-scroll habit and rebuild real focus in 30 days. No downloads needed — just open and start.',
    images: [{ url: OG_IMAGE, width: 2000, height: 2000, alt: 'ZenFuel — Brain Reset', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@zenfuelapp',
    creator: '@zenfuelapp',
    title: 'ZenFuel — Brain Reset',
    description: 'Free brain reset app. Break the doom-scroll habit and rebuild real focus in 30 days.',
    images: [OG_IMAGE],
  },
  icons: {
    icon: '/images/zenfuel-logo.png',
    apple: '/images/zenfuel-logo.png',
    shortcut: '/images/zenfuel-logo.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: APP_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          ── Google Analytics 4 ─────────────────────────────────────────────────
          Placed FIRST so it loads before anything else (theme script, SW, etc).
          Using raw lowercase <script> + dangerouslySetInnerHTML so Next.js
          server-renders these into the HTML — they are visible in view-source
          and fire on every page, including static routes.
        */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-GX4S7NMKDC"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: [
              'window.dataLayer = window.dataLayer || [];',
              'function gtag(){dataLayer.push(arguments);}',
              "gtag('js', new Date());",
              "gtag('config', 'G-GX4S7NMKDC');",
            ].join('\n'),
          }}
        />

        {/* Theme — sets dark class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var s=JSON.parse(localStorage.getItem('mt_settings')||'{}');if(s.theme!=='light')document.documentElement.classList.add('dark');}catch(e){}",
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

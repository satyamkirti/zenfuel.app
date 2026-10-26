import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// zenfuel.app permanently redirects (308) to www.zenfuel.app, so www is the canonical host.
const APP_URL = 'https://www.zenfuel.app';
const OG_IMAGE = `${APP_URL}/images/zenfuel-logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ZenFuel — Screen Time & Habit Tracker',
    template: '%s | ZenFuel',
  },
  description:
    'Track your screen time, understand app usage, and build better habits with ZenFuel. Private, local-first tracking for everyday digital wellbeing.',
  verification: {
    google: 'LX94JUsB9K98en8siDYe4LRrcQDgbg67if0RN7lNPCw',
  },
  keywords: [
    'screen time tracker', 'app usage tracker', 'habit tracker', 'daily habit tracker',
    'screen time limits', 'digital wellbeing', 'focus tracking', 'habit goals',
  ],
  authors: [{ name: 'ZenFuel' }],
  creator: 'ZenFuel',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: 'ZenFuel',
    title: 'ZenFuel — Screen Time & Habit Tracker',
    description:
      'Track your screen time, understand app usage, and build better habits with ZenFuel. Private, local-first tracking for everyday digital wellbeing.',
    images: [{ url: OG_IMAGE, width: 2000, height: 2000, alt: 'ZenFuel — Screen Time & Habit Tracker', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@zenfuelapp',
    creator: '@zenfuelapp',
    title: 'ZenFuel — Screen Time & Habit Tracker',
    description: 'Track your screen time and build better habits with ZenFuel.',
    images: [OG_IMAGE],
  },
  icons: {
    icon: '/images/zenfuel-app-icon.svg',
    apple: '/images/zenfuel-icon-192.png',
    shortcut: '/images/zenfuel-app-icon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: APP_URL },
};

// viewport-fit=cover lets the layout pad for the notch and home indicator (env(safe-area-inset-*)).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1769F5',
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
          src="https://www.googletagmanager.com/gtag/js?id=G-9D9NYY6P6K"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: [
              'window.dataLayer = window.dataLayer || [];',
              'function gtag(){dataLayer.push(arguments);}',
              "gtag('js', new Date());",
              "gtag('config', 'G-9D9NYY6P6K');",
            ].join('\n'),
          }}
        />

        {/*
          Before first paint: theme class, and the Hidden Mode flag so the brand is hidden
          (CSS: html[data-discreet] [data-brand]) and the tab title is neutral until React takes over.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var d=document.documentElement,s=JSON.parse(localStorage.getItem('mt_settings')||'{}');if(s.theme!=='light')d.classList.add('dark');if(s.hiddenMode){d.setAttribute('data-discreet','');var t=String(s.hiddenTitle||'').trim()||'Personal Space';document.title=t;document.addEventListener('DOMContentLoaded',function(){document.title=t;});}}catch(e){}",
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

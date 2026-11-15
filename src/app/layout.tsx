import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';
import { EXISTING_DATA_KEYS, LOCALE_PREFS_KEY } from '@/i18n/prefs';

// Before any app code runs: note whether ZenFuel already has data here (existing users never see
// onboarding), and keep the page hidden for one frame unless the saved language is English, so
// nobody sees English flash before their language (or onboarding) is applied. A timer always
// reveals the page, even if the app fails to start.
const BOOT_SCRIPT = "try{var d=document.documentElement,ks=" + JSON.stringify(EXISTING_DATA_KEYS) + ",ex=false;for(var i=0;i<ks.length;i++){if(localStorage.getItem(ks[i])!==null){ex=true;break;}}window.__zfBoot={existing:ex};var p=JSON.parse(localStorage.getItem(" + JSON.stringify(LOCALE_PREFS_KEY) + ")||'null');if(p&&p.language)d.lang=p.language;if(!p||p.language!=='en'){d.setAttribute('data-i18n-wait','');setTimeout(function(){d.removeAttribute('data-i18n-wait');},2000);}}catch(e){}";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// Headings and large numbers.
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display' });

// zenfuel.app permanently redirects (308) to www.zenfuel.app, so www is the canonical host.
const APP_URL = 'https://www.zenfuel.app';
const OG_IMAGE = `${APP_URL}/brand/zenfuel-og.png`;
// Set at build time by next.config.mjs (`npm run build:android`).
const IS_ANDROID_APP = process.env.NEXT_PUBLIC_ZENFUEL_TARGET === 'android';

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
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'ZenFuel — Screen time & habit tracker', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@zenfuelapp',
    creator: '@zenfuelapp',
    title: 'ZenFuel — Brain Reset',
    description: 'Free brain reset app. Break the doom-scroll habit and rebuild real focus in 30 days.',
    images: [OG_IMAGE],
  },
  // The approved blue clock-and-leaf icon (public/images/zenfuel-app-icon.svg); the PNG and ICO
  // sizes are rendered from that same file.
  icons: {
    icon: [
      { url: '/images/zenfuel-app-icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    shortcut: '/favicon.ico',
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
        {/* Website only. The Android app ships without analytics until consent is designed. */}
        {!IS_ANDROID_APP && (
          <>
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
          </>
        )}

        {/*
          Before first paint: theme class (dark unless the user chose light), and the Hidden Mode flag so the brand is hidden
          (CSS: html[data-discreet] [data-brand]) and the tab title is neutral until React takes over.
        */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var d=document.documentElement,s=JSON.parse(localStorage.getItem('mt_settings')||'{}');if(s.theme==='dark')d.classList.add('dark');if(s.hiddenMode){d.setAttribute('data-discreet','');var t=String(s.hiddenTitle||'').trim()||'Personal Space';document.title=t;document.addEventListener('DOMContentLoaded',function(){document.title=t;});}}catch(e){}",
          }}
        />
      </head>
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
        <I18nProvider>
          <AppProvider>
            <OnboardingGate>{children}</OnboardingGate>
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

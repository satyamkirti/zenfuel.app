// Two build targets share this config:
// - Website (default, used by Vercel): a normal `next build` into .next. Unchanged.
// - Android app (`npm run build:android`, sets ZENFUEL_TARGET=android): a static export into
//   out/, which Capacitor packages inside the APK so the app never loads the live website.
const isAndroid = process.env.ZENFUEL_TARGET === 'android';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    // Read by the root layout to leave website-only scripts (Google Analytics) out of the app.
    NEXT_PUBLIC_ZENFUEL_TARGET: isAndroid ? 'android' : 'web',
  },
  ...(isAndroid && {
    output: 'export',
    // With a static export Next writes the finished site into distDir. Using out/ (Capacitor's
    // webDir) also keeps an app build from overwriting the website build in .next.
    distDir: 'out',
  }),
};

export default nextConfig;

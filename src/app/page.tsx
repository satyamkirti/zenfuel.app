/**
 * Root page — intentionally a SERVER component (no 'use client').
 *
 * Why: Next.js renders server components to HTML on every request.
 * The static <section> below is sent to the browser before any
 * JavaScript runs, so Google can index it without executing JS.
 *
 * The actual interactive dashboard is loaded inside DashboardContent
 * (a client component) after hydration.
 */
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function HomePage() {
  return (
    <>
      {/*
        ── Static SEO content ────────────────────────────────────────────
        This section is server-rendered HTML. Googlebot reads it without
        executing any JavaScript. sr-only positions it off-screen while
        keeping it fully indexable (unlike display:none which is ignored).
      */}
      <section
        aria-label="ZenFuel app description"
        className="sr-only"
      >
        <h1>ZenFuel — Free Brain Reset App</h1>
        <p>
          Free brain reset app. Break the doom-scroll habit and rebuild
          real focus in 30 days. No downloads needed — just open and start.
        </p>

        <h2>What is ZenFuel?</h2>
        <p>
          ZenFuel is a private, local-first dopamine detox tracker that
          helps you monitor and reduce compulsive habits like social media
          scrolling, gaming, junk food, and other dopamine-seeking
          behaviours. Your data never leaves your device.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li>Detox Score: a daily brain-health score from 0 to 100</li>
          <li>Focus Score, Discipline Score, and Productivity Score</li>
          <li>Track 8+ habit types: social media, gaming, porn, alcohol, junk food, smoking, and custom habits</li>
          <li>Streak tracker — build consecutive clean days</li>
          <li>Relapse prediction — know your risk window before it hits</li>
          <li>30-day dopamine reset challenges</li>
          <li>Personal goals: reduce by %, max sessions per week, streak targets</li>
          <li>GitHub-style yearly activity heatmap</li>
          <li>Risk alarm system — real-time alerts when habit patterns spike</li>
          <li>100% private — all data stays in your browser, never uploaded</li>
          <li>Works offline, no account or download required</li>
        </ul>

        <h2>Premium Plan</h2>
        <p>
          Premium unlocks AI-powered insights, PDF and Excel reports,
          unlimited habit tracking, annual reports, and cloud backup.
          Plans start at just ₹99/month.
        </p>

        <h2>How to start</h2>
        <p>
          Open the app, tap "Log Session" to record a trigger, and watch
          your Detox Score update instantly. Set a goal, start a challenge,
          and build your streak — one day at a time.
        </p>
      </section>

      {/* Interactive dashboard — client-rendered after hydration */}
      <DashboardContent />
    </>
  );
}

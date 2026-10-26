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
        data-seo
        className="sr-only"
      >
        <h1>ZenFuel — Screen Time & Habit Tracker</h1>
        <p>Track your screen time, understand your app usage, and build better habits. ZenFuel brings your daily habits, goals, and progress together in one private place.</p>

        <h2>What is ZenFuel?</h2>
        <p>
          ZenFuel is a personal screen time and habit tracker. It helps you understand how long you use selected apps, set daily limits, log habits manually, and follow progress over time. Habit logs are stored locally on your device rather than on a ZenFuel user-data server. Screen time tracking requires Android Usage Access and measures app usage duration; it does not inspect the content viewed inside an app.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li>Screen time summaries for selected apps and daily limits</li>
          <li>Habit history, streaks, goals, and progress insights</li>
          <li>Track 8+ habit types: social media, gaming, porn, alcohol, junk food, smoking, and custom habits</li>
          <li>Streak tracker — build consecutive clean days</li>
          <li>Relapse prediction — know your risk window before it hits</li>
          <li>30-day dopamine reset challenges</li>
          <li>Personal goals: reduce by %, max sessions per week, streak targets</li>
          <li>GitHub-style yearly activity heatmap</li>
          <li>In-app risk alerts when your logging pattern spikes</li>
          <li>Habit logs stored locally in your browser — no account required</li>
          <li>No download required — runs in your browser</li>
        </ul>

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

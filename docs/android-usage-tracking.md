# Android app and automatic usage tracking (V1)

ZenFuel's Android app packages the existing Next.js interface inside a Capacitor container and
adds one native capability: measuring foreground time of apps the user selects, using Android's
Usage Access (`UsageStatsManager`). The website on Vercel is unchanged and cannot measure usage.

## Architecture

```
Next.js app (src/)            ── same UI for website and Android app
  src/lib/usage/              ── platform-independent logic (catalog, status, records, settings)
  src/lib/usage/repository.ts ── UsageRepository: Android plugin, or "unsupported" on the web
  src/hooks/useScreenTime.ts  ── refresh on open, on return to foreground, and on demand
  src/app/screen-time/        ── Screen time page (nav link shown only inside the Android app)

android/                      ── Capacitor 8 Android project
  app/src/main/java/app/zenfuel/MainActivity.kt   ── registers the plugin, serves exported pages
  app/src/main/java/app/zenfuel/usage/
    UsagePlugin.kt         ── Capacitor plugin "ZenUsage" (JS bridge)
    UsageSync.kt           ── reads usage events, stores totals, raises alerts (one lock)
    UsageAggregator.kt     ── pure event → daily-total logic (unit tested)
    UsageStore.kt          ── SQLite table of daily totals + merge rule (unit tested)
    UsageConfig.kt         ── mirrored settings (SharedPreferences)
    LimitAlerts.kt         ── alert rule (unit tested) and local notification
    UsageRefreshWorker.kt  ── WorkManager hourly best-effort refresh
```

**Why this design**

- **Capacitor with a local static export.** The UI is reused as-is. `npm run build:android` sets
  `ZENFUEL_TARGET=android`, which switches `next.config.mjs` to `output: 'export'` into `out/`.
  Capacitor copies `out/` into the APK, so the app never loads the live website and works offline.
  Every route is already static (`○` in the build output); there are no API routes, middleware or
  server actions, so the export needs no code changes.
- **The website build is untouched.** Without `ZENFUEL_TARGET`, `next build` is exactly what Vercel
  ran before (normal `.next` output, SEO metadata, robots and sitemap).
- **Google Analytics is left out of the app build** (`NEXT_PUBLIC_ZENFUEL_TARGET=android` in the
  root layout) until an in-app consent flow is designed. The website keeps GA4 unchanged.
- **Deep reloads.** Capacitor answers every extension-less path with `index.html`. `MainActivity`
  serves `out/<route>.html` for a full reload of `/settings` etc. Client-side navigation uses the
  exported `.txt` payloads and is unaffected.
- **Native-owned usage storage.** The background worker must write data while the WebView is not
  running, so the native side owns usage records in its own SQLite database (Android's built-in
  SQLite, no extra library). The web layer reads them through the plugin. Existing ZenFuel data
  stays in localStorage; nothing was migrated.
- **Future iOS.** iOS would be another `UsageRepository` implementation backed by Screen Time /
  Family Controls (requires Apple entitlements). Not started.

## Build and install

Requirements: Node 22+, JDK 21, Android SDK platform 36 and build-tools 35/36.

```bash
npm ci --legacy-peer-deps
npm run build:android            # static export + `npx cap sync android`
cd android
./gradlew testDebugUnitTest      # Kotlin unit tests
./gradlew assembleDebug          # app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`android/local.properties` (not committed) must point `sdk.dir` at the Android SDK, or set
`ANDROID_HOME`. A release build needs a signing key, which is not part of the repository.

Web checks: `npm run typecheck`, `npm test` (Node test runner, no extra dependency), `npm run build`.

## Permissions

| Permission | Why | How it is granted |
|---|---|---|
| `PACKAGE_USAGE_STATS` | Read foreground time of the selected apps | User turns on **Usage Access** for ZenFuel in Android Settings (cannot be a dialog). The Screen time page opens the right screen. |
| `POST_NOTIFICATIONS` (Android 13+) | Optional limit alerts | Requested only when the user turns alerts on. |
| `INTERNET` | Capacitor WebView default | No usage data is sent anywhere. |

Merged into the final manifest by WorkManager (library-internal, used to keep scheduled work after a
reboot): `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `ACCESS_NETWORK_STATE`. See the build's merged manifest
for the exact list.

Not used: `QUERY_ALL_PACKAGES`, Accessibility services, foreground services for polling, location,
contacts, camera, microphone, browsing history, screen capture or keystroke access.

**Package visibility.** Android 11+ hides installed apps unless they are declared. Only the curated
packages in `src/lib/usage/catalog.ts` are declared in `<queries>`, so the app can show which
supported apps are installed. `npm test` fails if the catalog and manifest disagree.

To add an app: add it to `SUPPORTED_APPS` (stable new `id`) and its package(s) to `<queries>`.

## What is measured

- For each selected app: time on screen, from one of its activities resuming until all of them have
  stopped, merged across the app's packages (e.g. Instagram and Instagram Lite). A paused activity is
  still visible (under another app's dialog, in picture-in-picture or a split-screen pane), so it
  keeps counting until it stops. Android 7–9 log no stop events, so there a pause ends the visit.
  (Found on the emulator: YouTube paused behind its permission dialog for 49 s before stopping.)
- Screen off and shutdown end a session. A startup without a logged shutdown drops the open session
  (undercount rather than invent time).
- Days run midnight to midnight in the phone's time zone; daylight-saving days are 23/25 hours.
- **Visits** are approximate: returning within 60 seconds is the same visit.
- App-level time only. Time in YouTube is not time in Shorts, time in Instagram is not Reels.
- Multi-window: two tracked apps on screen together both count, so the daily total can exceed
  wall-clock time in that case.
- ZenFuel's own package is never tracked.

**History.** Android keeps detailed events for roughly a week (device-dependent). The first refresh
fills up to 7 days; after that daily totals accumulate in the database. A day is only stored when
Android's history covers the whole day, so partial days are not shown as low usage.

**Refresh.** Two separate mechanisms:

- *Refresh on open* (reliable): opening Screen time or the dashboard, returning to the app, or
  tapping "Refresh" recomputes usage straight away.
- *Scheduled background refresh* (best effort): `UsageRefreshWorker`, a WorkManager periodic job
  with a 1-hour interval, scheduled while tracking is on with at least one app and cancelled
  otherwise. It runs without opening the app and survives reboot (JobScheduler, rescheduled by
  WorkManager). Android decides when it actually runs; an hourly run is not guaranteed. Doze, battery
  saver and app standby buckets can delay it for hours (the "rare"/"restricted" buckets allow about
  one run a day). On Samsung, putting ZenFuel in "Sleeping apps"/"Deep sleeping apps" or setting its
  battery use to "Restricted" can stop background refresh, and therefore background limit alerts,
  until the app is opened. Force-stopping the app also stops it until the next launch.

The UI always shows the last successful refresh
time, labels figures older than 60 minutes as possibly out of date, and shows "No data yet" rather
than green when there is no refresh for today. Usage Access is re-read from Android on every load;
while it is off, every app shows "Not measuring" (no green/yellow/red), stored figures are labelled
as stored and not updating, and history stays visible.

**App selection.** Confirming the setup screen saves exactly the ticked apps, replacing any earlier
selection (`startTracking` in `src/lib/usage/settings.ts`). The native configuration is replaced in
full on every change, so a removed app stops being read; its stored history is kept until the user
deletes usage history.

**Idempotency.** Each refresh recomputes whole days and replaces rows, it never adds to them, so
overlapping refreshes cannot double-count. A row is replaced only if the new total is larger, or
produced by a newer `ALGORITHM_VERSION`, because a lower recomputation of a past day comes from
Android having deleted old events, or from an empty read, not from a correction. Repeating a refresh
changes nothing. A refresh without Usage Access stops before reading or writing anything, so stored
history is never cleared by a revoked permission.

**Known limitation: time-zone changes.** Days are keyed by the phone's current time zone. After the
time zone changes (travel), days within the last week that are recomputed use the new midnight while
already-stored rows keep the larger total from the old one, so time near the boundary can be counted
on two adjacent days. Totals for days lived in one time zone are unaffected. Fixing this needs the
time zone stored per row (a schema change).

## Status rule and limits

`src/lib/usage/status.ts` → `USAGE_STATUS_THRESHOLDS` is the one place to change it:

- Green: below 70% of the daily limit
- Yellow: 70% up to and including 100%
- Red: above 100%

Status always shows an icon and words, not colour alone. A newly selected app gets a 1-hour default
limit, labelled as a default until changed; "No limit" is available.

## Limit alerts

- Off by default; turning them on asks for notification permission on Android 13+.
- At most one alert per app per day (`LimitAlertRule`), at or above the limit.
- Default wording names no app ("One of your app limits for today has been reached"). App names are
  opt-in, and the lock-screen (public) version is always neutral.
- Hidden Mode: title is the neutral Hidden Mode title, text "You have a reminder."
- Delivery depends on the background refresh above, so alerts can arrive late. No push service,
  Firebase or server is involved.
- The native side checks the saved preference and notification permission on every refresh; with
  alerts off, none are sent. The switch always shows that saved preference. If notifications are
  blocked while alerts are on, the switch stays on with a warning, and alerts resume once
  notifications are allowed.
- Turning alerts on while an app is already over its limit sends that day's alert on the next
  refresh (background, reopening the app, or "Refresh"). "Delete usage history" also clears the record
  of today's alerts, so an app already over its limit can alert once more that day.

## Data, deletion, backup and migration

| Data | Where | Deleted by |
|---|---|---|
| Screen-time settings (apps, limits, alert choices, consent time) | localStorage `zenfuel_usage_settings` (mirrored to SharedPreferences `zenfuel_usage`) | Clear All; uninstall |
| Daily usage totals | SQLite `zenfuel_usage.db`, table `daily_usage` (schema 1) | "Delete usage history", Clear All, uninstall |
| Last refresh time and alert de-duplication | SharedPreferences `zenfuel_usage` | Delete usage history, Clear All, uninstall |

- **No existing keys were renamed or migrated.** Manual habit entries remain separate; measured time
  never creates habit entries and does not change the Detox Score.
- **Backups (Export backup) do not include screen-time data** in V1. The backup format is unchanged
  (version 3). Restoring a backup does not affect usage data.
- **Android backup is disabled** (`allowBackup=false`, `data_extraction_rules.xml` excludes cloud
  backup and device transfer). To move habit logs to a new phone, use Export backup.
- **Schema changes:** bump `UsageStore.SCHEMA_VERSION` and add steps in `onUpgrade`. Downgrades drop
  the table (recomputable from Android for recent days). Record shape changes on the JS side are
  validated in `parseRecord`; malformed rows are ignored.
- **Recovery:** if the database is lost, the next refresh rebuilds about the last week from Android.

## Privacy

- Usage figures stay on the device. No network code exists in the usage package; the app build has no
  analytics.
- Native logs never contain package names, app IDs or durations.
- Hidden Mode masks app names in the UI ("Tracked app 3") like habit names.
- Porn and Masturbation remain manual Personal Habits. Nothing is inferred from app usage.

## Google Play considerations (not verified)

These need review before publishing; nothing here claims approval:

- `PACKAGE_USAGE_STATS` is a special-access permission. Google Play reviews apps that use it; the
  core purpose must clearly need it (digital wellbeing fits), with a prominent in-app disclosure
  before the user is sent to Settings (implemented on the Screen time page) and an accurate Data
  safety form ("app activity: app interactions", processed on device, not shared).
- Package visibility uses `<queries>` with specific packages, not `QUERY_ALL_PACKAGES`.
- Background work uses WorkManager only; no foreground service.
- Target SDK 36 as generated by Capacitor 8.
- The store listing, privacy policy URL and Data safety answers must match this document.

## Verification status

See the milestone report for what was run. Device behaviour that requires a real phone or emulator
(granting/revoking Usage Access, measured values against Digital Wellbeing, background refresh timing,
notification delivery, reboot) must be checked on hardware before release.

## Roadmap (inactive in V1)

- iOS Screen Time integration (Family Controls entitlement).
- Optional Google Drive backup with explicit authorisation.
- Optional sign-in and cross-device personalisation.
- Including screen-time data in backups (needs a backup format version bump and tests).
- Future monetisation only after separate product and legal review; Free Beta stays on.

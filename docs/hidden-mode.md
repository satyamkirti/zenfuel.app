# Hidden Mode

Hidden Mode is a display-only privacy setting (Settings → Privacy & Security, or the
More menu on mobile). It is stored in the existing `mt_settings` fields `hiddenMode` and
`hiddenTitle`; no new keys were added.

## What it does

**Discreet identity**
- The in-app logo and "ZenFuel" wordmark are replaced by a neutral icon and the saved
  neutral title (default "Personal Space"; older saved titles such as "Habit Tracker" are kept).
- The browser tab title is set to the neutral title, including after client-side navigation.
- The tab icon is swapped for a plain grey square while the setting is on.
- Brand wording in headings and generated text ("Dopamine Detox Score", "Detox Streaks",
  "ZenFuel" in alerts) switches to neutral wording.
- An inline script in `layout.tsx` sets `data-discreet` on `<html>` before first paint, so the
  logo stays hidden and the tab title is neutral while the page loads.

**Masking** (via `usePrivacy()` in `src/context/PrivacyContext.tsx`)
- Habit names and icons → "Private habit N" and 🔒 (N follows the habit list order, so charts
  stay distinguishable).
- Notes → "Note hidden". Goal and challenge names → "Personal goal" / "Personal challenge".
- Insights, trigger patterns and risk alerts: habit names, icons and the brand are replaced
  inside the generated text.
- History search matches only dates, times and on-screen labels while masked.
- Editing a habit or a note asks the user to reveal first, so placeholders are never saved.
- Reminders use neutral text ("<title>: You have a reminder.").

**Reveal**: the eye button in the header shows details for two minutes; it re-hides when the
app goes to the background, when the PIN lock engages, or when tapped again.

## Data integrity
- Masking happens only at render time. Stored records, backups, CSV/JSON exports are unchanged.
- In Hidden Mode the Reports page asks before exporting; printing offers "private labels".
- Settings shows a note that backups and CSV exports contain real data.

## Limits (cannot be changed by a web app)
- The web address, browser history, bookmarks and autocomplete still show zenfuel.app.
- An installed app (PWA) keeps the name and icon from `manifest.json` on the home screen,
  app switcher and OS settings. The manifest is intentionally not changed.
- Legal pages still describe ZenFuel.
- Before JavaScript runs, the server-rendered page title is briefly "ZenFuel — Brain Reset".
- Hidden Mode is not encryption and not a security boundary; anyone with access to the
  device can turn it off or read browser storage.

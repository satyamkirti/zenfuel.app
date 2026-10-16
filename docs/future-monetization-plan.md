# ZenFuel — Future Monetization Plan (internal)

> **Status: inactive.** ZenFuel is free during its beta (`FREE_BETA = true` in
> `src/utils/subscription.ts`). Nothing in this document is live, and none of the
> planned features below may be advertised until they are built and verified.

This document preserves the original Premium plan so paid plans can be launched later
without redesigning them. It records what was planned, what exists in code today, and
what must be done before any payment is taken.

Sources: commit `dc88279` (original plan, before trust fixes), `4aba827` (pricing),
`2f8da66` (Phase 0 trust fixes), `c0e2d7e` (Free Beta).

---

## 1. How monetization is switched off today

| Switch | Location | Effect while `FREE_BETA = true` |
|---|---|---|
| `FREE_BETA` | `src/utils/subscription.ts` | `hasFullAccess()` returns true for every stored record, so all gates are open and history is unlimited |
| `MONETIZATION_UI_ENABLED` (`= !FREE_BETA`) | `src/utils/subscription.ts` | Hides the upgrade page, sidebar "Upgrade to Premium" entry point, plan badge, trial banner and the Settings Subscription section |

Stored subscription records (`ddt_subscription`) are kept untouched and are included in
full backups, but do not affect access during the beta.

**Do not set `FREE_BETA = false` until every item in section 8 is done.** Flipping it
re-enables the free-tier limits and shows the upgrade UI immediately.

---

## 2. Draft plans and prices

Defined in `PLANS` (`src/utils/subscription.ts`). Prices are drafts, not offers.

| Plan id | Name | INR | USD | Interval | Badge / note |
|---|---|---|---|---|---|
| `free` | Free | ₹0 | $0 | — | Limits: 3 habits, 30-day history, 3 insights, 3 goals |
| `monthly` | Premium | ₹99 | $1.19 | month | — |
| `yearly` | Premium Yearly | ₹1,100 | $13.19 | year | ⭐ Most Popular · ₹91.6/month equivalent · "Save ₹88 vs monthly" |
| `lifetime` | Lifetime | ₹2,999 | $35.99 | one-time | ⚡ Best Value |

Paise amounts for Razorpay: 9900 / 110000 / 299900 (`src/services/payment.ts`).

---

## 3. Original feature lists, with current status

Status key: **Built** = implemented and gated today · **Built (free)** = implemented but
not gated · **Not enforced** = limit defined but not applied · **Planned** = not built,
must not be advertised.

### Free plan (original list)

| Original claim | Status |
|---|---|
| Up to 3 habits | Not coherent: adding habits is gated at 3, but there are 8 default habits. A free-tier rule is needed |
| Last 30 days history | Built — enforced in History and Analytics only (dashboard and reports show everything) |
| Basic streak tracking | Built |
| Daily activity chart / Monthly trend chart | Built |
| 3 insights per day | Not enforced (`maxInsights` unused) |
| CSV export | Built (free); a full JSON backup is also free |
| 5 built-in challenges | Built |

### Premium (monthly) — original list

| Original claim | Status |
|---|---|
| Unlimited habits | Built (gate on habit creation) |
| Full unlimited history | Built (history cutoff) |
| Advanced analytics suite | Built — hourly, weekday, year-over-year and habit comparison charts are gated |
| AI insights engine | **Planned** — current insights are rule-based, not AI |
| Focus · Discipline · Productivity Scores | Built, gated |
| Relapse prediction analytics | Built — the Relapse Risk card is gated; risk alerts and risk timeline are free |
| Habit comparison dashboard | Built, gated |
| PDF & Excel reports | Print / PDF built and gated; **Excel export planned** |
| Annual reports | Built, gated |
| Premium challenges | **Planned** — no premium-only challenges exist (`PREMIUM_CHALLENGES` unused) |
| Cloud backup | **Planned** — needs accounts and a backend; only local JSON backup exists |
| Custom date ranges | **Planned** — the date filter has fixed periods only (`'custom'` type unused) |
| Priority support | **Planned** — operational commitment, no support system |

### Premium Yearly — original extras
"Everything in Monthly", "₹91.6/month billed yearly", "Save ₹88" (pricing facts) and
"Priority feature access" (**Planned** — a promise, define before use).

### Lifetime — original extras
"Everything in Premium", "One-time payment", "No recurring charges" (pricing facts),
"All future features included" (**Planned** — open-ended commitment, needs legal review),
"Lifetime priority support" (**Planned**).

Current `PLANS` feature lists keep only Built items, so the pricing cards stay accurate.

---

## 4. Original Free vs Premium comparison (19 rows)

| Feature | Free | Premium | Status |
|---|---|---|---|
| Habits | Up to 3 | Unlimited | Built (see free-tier note) |
| History | 30 days | All time | Built |
| Analytics | Basic | Full suite | Built |
| Daily insights | 3 max | Unlimited AI | **Planned** (AI); limit not enforced |
| Focus / Discipline / Productivity Score | ✗ | ✓ | Built |
| Relapse Prediction | ✗ | ✓ | Built |
| PDF Reports | ✗ | ✓ | Built |
| Excel Export | ✗ | ✓ | **Planned** |
| Annual Reports | ✗ | ✓ | Built |
| Habit Comparison | ✗ | ✓ | Built |
| Premium Challenges | ✗ | ✓ | **Planned** |
| Cloud Backup | ✗ | ✓ | **Planned** |
| Custom Date Range | ✗ | ✓ | **Planned** |
| Streak Tracking / Heatmap / CSV Export / PIN Lock | ✓ | ✓ | Built |

The live-safe version (Built rows only) is in `PremiumUpgradeView`.

---

## 5. Upgrade flow design (preserved in code, hidden)

**Upgrade page** — `src/components/subscription/PremiumUpgradeView.tsx` (restored from
`2f8da66`; rendered by `/upgrade` only when `MONETIZATION_UI_ENABLED`). Sections:
hero with personal stats → "What you're missing" (free limits vs premium features) →
7-day free trial CTA → pricing cards → "Everything Premium includes" grid → Free vs
Premium table → FAQ → bottom CTA. Pricing buttons are inert ("Coming Soon").

**Entry points**

| Entry point | Location | Gate |
|---|---|---|
| "Upgrade to Premium" button | `Sidebar.tsx` | `MONETIZATION_UI_ENABLED && !isPremium` |
| Plan badge, trial countdown | `Sidebar.tsx` | `MONETIZATION_UI_ENABLED` |
| Subscription section (plan, trial/expiry, Upgrade / Downgrade) | `settings/page.tsx` | `MONETIZATION_UI_ENABLED` |
| Upgrade banners | Dashboard (habit limit), History, Analytics, Reports, Habits | `!isPremium` (always false in beta) |
| Lock overlays | Analytics charts, Progress Scores card | `!isPremium` |
| Locked JSON / PDF buttons | `ReportView.tsx` | `!isPremium` |
| "Upgrade for more" habit card | `habits/page.tsx` | free limit (inactive in beta) |

**Reusable components**: `PricingCards`, `UpgradeBanner`, `LockOverlay`, `PlanBadge`,
`PremiumScoreCards`, `LegalLayout.PricingTable`.

**Subscription logic**: `isPremium`, `hasFullAccess`, `canUseFeature`, `getFreeLimit`,
`getHistoryCutoff`, `activateTrial`, `cancelSubscription`, `isLegacyDemoGrant`,
`getEffectiveSubscription`; feature ids in `PremiumFeature` (`src/types/subscription.ts`).
`activateDemoPremium` / `activateDemo` exist but nothing calls them — **never wire them
to UI** (they grant Premium without payment).

**Payment placeholders**: `src/services/payment.ts` — Stripe, Razorpay, Google Play and
Apple IAP stubs that throw "not configured"; webhook instructions in
`getWebhookInstructions()`. No SDK is installed.

---

## 6. Original copy that must be rewritten before reuse

These appeared on the live site before Phase 0 and were removed because they were
untrue. Do not reuse them as-is.

- FAQ: "We never upload your personal habits to any server" (GA4 runs); "We support UPI,
  cards, NetBanking via Razorpay, and international cards via Stripe"; "40% student
  discount"; "Cancel anytime, keep access until the period ends".
- Upgrade page: "Prices in INR · GST inclusive · Secure payments via Razorpay & Stripe",
  "30-day money-back guarantee", "Join thousands of users", "AI-powered scores".
- Privacy policy: accounts, Supabase database, Razorpay processing.

## 7. Original billing and refund terms (draft, from `dc88279`)

- Monthly and yearly plans auto-renew; lifetime is a single payment.
- Cancellation takes effect at the end of the current billing period.
- Refunds: monthly — none; yearly and lifetime — full refund within 7 days by email to
  zenfuel.support@gmail.com, processed in 5–7 business days to the original method.
- Exceptions: after 7 days, repeated refund requests, Terms violations.

These need legal review and must match the payment provider's actual behaviour.

---

## 8. Dependencies before launching paid plans

1. **Server-verified payments** — create orders server-side and verify Razorpay/Stripe
   webhooks; never trust a client-side success callback.
2. **Identity and entitlements** — a localStorage plan record can be edited by anyone.
   Paid access needs accounts (or signed entitlement tokens) and a "restore purchase"
   path across devices.
3. **Free-tier rule** — resolve 8 default habits vs the 3-habit limit; decide whether
   the 30-day limit applies everywhere.
4. **Existing users** — decide how Free Beta users transition (grandfathering, notice).
   Legacy demo records (`provider: 'demo'`) are already treated as Free by
   `isLegacyDemoGrant()`.
5. **Trial policy** — the current trial is local and repeatable; decide limits and track
   them server-side if needed.
6. **Taxes** — GST registration/invoicing as applicable before showing "GST inclusive".
7. **Legal** — update Terms (pricing, billing, auto-renew, cancellation), Refund Policy,
   Privacy Policy (payment processor, account data) and analytics consent.
8. **Claims review** — advertise only Built features; build or drop each Planned item.
9. **Wire checkout** — replace the inert "Coming Soon" buttons in `PricingCards` with
   real checkout, add loading/error states, and test with provider test modes.
10. **Testing** — purchase, renewal, cancellation, refund, expiry, restore and offline
    behaviour on real devices.

## 9. Enabling checklist (when the above is done)

- [ ] Set `FREE_BETA = false` and confirm `MONETIZATION_UI_ENABLED` turns on the UI.
- [ ] Review `PremiumUpgradeView` copy, FAQ and trial wording against section 6.
- [ ] Replace the Settings "Downgrade" button with real subscription management.
- [ ] Update legal pages and the in-app "Plan: Free during beta" row.
- [ ] Re-run the access, paywall and data-safety browser tests.

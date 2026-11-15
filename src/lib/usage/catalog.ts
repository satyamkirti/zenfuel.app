import { tDynamic } from '../../i18n/translate';
// Apps ZenFuel can measure on Android.
//
// Tracking works at app level: Android reports how long an app was in the foreground, not what
// was viewed inside it (time in YouTube is not time in Shorts).
//
// To add an app: add an entry here and add each package to the <queries> block in
// android/app/src/main/AndroidManifest.xml (Android 11+ hides apps that are not declared there).
// tests/usage.test.ts checks the two lists match.

export type AppCategory = 'social' | 'video' | 'messaging';

export interface SupportedApp {
  /** Stable ID stored with usage records. Never change or reuse one. */
  id: string;
  label: string;
  category: AppCategory;
  /** Android package names. Several when an app has regional or Lite versions. */
  packages: string[];
}

export const SUPPORTED_APPS: SupportedApp[] = [
  { id: 'instagram', label: 'Instagram', category: 'social', packages: ['com.instagram.android', 'com.instagram.lite'] },
  { id: 'youtube', label: 'YouTube', category: 'video', packages: ['com.google.android.youtube'] },
  { id: 'facebook', label: 'Facebook', category: 'social', packages: ['com.facebook.katana', 'com.facebook.lite'] },
  { id: 'snapchat', label: 'Snapchat', category: 'social', packages: ['com.snapchat.android'] },
  { id: 'reddit', label: 'Reddit', category: 'social', packages: ['com.reddit.frontpage'] },
  { id: 'x', label: 'X (Twitter)', category: 'social', packages: ['com.twitter.android'] },
  { id: 'tiktok', label: 'TikTok', category: 'video', packages: ['com.zhiliaoapp.musically', 'com.ss.android.ugc.trill'] },
  { id: 'threads', label: 'Threads', category: 'social', packages: ['com.instagram.barcelona'] },
  { id: 'pinterest', label: 'Pinterest', category: 'social', packages: ['com.pinterest'] },
  { id: 'linkedin', label: 'LinkedIn', category: 'social', packages: ['com.linkedin.android'] },
  { id: 'netflix', label: 'Netflix', category: 'video', packages: ['com.netflix.mediaclient'] },
  { id: 'prime-video', label: 'Prime Video', category: 'video', packages: ['com.amazon.avod.thirdpartyclient'] },
  { id: 'twitch', label: 'Twitch', category: 'video', packages: ['tv.twitch.android.app'] },
  { id: 'moj', label: 'Moj', category: 'video', packages: ['in.mohalla.video'] },
  { id: 'sharechat', label: 'ShareChat', category: 'social', packages: ['in.mohalla.sharechat'] },
  { id: 'josh', label: 'Josh', category: 'video', packages: ['com.eterno.shortvideos'] },
  { id: 'whatsapp', label: 'WhatsApp', category: 'messaging', packages: ['com.whatsapp'] },
  { id: 'telegram', label: 'Telegram', category: 'messaging', packages: ['org.telegram.messenger'] },
  { id: 'discord', label: 'Discord', category: 'messaging', packages: ['com.discord'] },
];

/** ZenFuel's own Android package. Never measured as a digital habit. */
export const OWN_PACKAGE = 'app.zenfuel';

/** Category names in the interface language. */
export function categoryLabel(category: AppCategory): string {
  return tDynamic(`usage.category.${category}`);
}

const BY_ID = new Map(SUPPORTED_APPS.map(a => [a.id, a]));

export function getSupportedApp(id: string): SupportedApp | undefined {
  return BY_ID.get(id);
}

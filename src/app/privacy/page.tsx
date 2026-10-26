import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, H3, P, UL, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — ZenFuel',
  description: 'ZenFuel Privacy Policy — what is stored on your device, what Google Analytics collects, and how to delete your data.',
};

const strong = 'text-ink';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="October 17, 2026">

      <H2>1. Summary</H2>
      <UL>
        <li>ZenFuel has <strong className={strong}>no user accounts</strong> and <strong className={strong}>no ZenFuel database or backend server</strong>.</li>
        <li>Your tracker records (habit logs, notes, goals, challenges and settings) are <strong className={strong}>stored locally in your browser</strong> on your device. They are not sent to a ZenFuel server.</li>
        <li>The website currently uses <strong className={strong}>Google Analytics 4</strong>, which may collect information about how you use the website (see section 4).</li>
        <li>ZenFuel is free during its beta and does not collect any payments.</li>
      </UL>

      <H2>2. Who We Are</H2>
      <P>ZenFuel (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is operated by Satyam Kumar Kirti, India. This policy explains what information is involved when you use the ZenFuel website and app at zenfuel.app.</P>

      <H2>3. Data Stored Locally on Your Device</H2>
      <P>When you use ZenFuel, the following is saved in your browser&apos;s local storage on the device you are using:</P>
      <UL>
        <li>Habit log entries — the habit, date, time, and any notes you add</li>
        <li>Your habits, including custom habits you create</li>
        <li>Goals and challenges, and their progress</li>
        <li>App settings — theme, PIN lock settings (the PIN is stored as a hash, not as the digits you typed, together with its length), auto-lock time, and Hidden Mode settings</li>
        <li>Notification preferences, including the optional name you enter for reminder messages</li>
        <li>Any plan or trial status saved by an earlier version of the app (it no longer affects which features you can use)</li>
        <li>Small interface preferences, such as which banners or alerts you have dismissed, and a count of recent incorrect PIN attempts used to slow down guessing</li>
      </UL>
      <P>This data stays on your device. We do not have a copy of it, cannot see it, and cannot recover it for you if it is lost — for example, if you clear your browser data, use a different browser or device, or browse in a private window.</P>

      <H3>Reminders</H3>
      <P>If you enable notifications, reminders are shown by your browser while ZenFuel is open. On some devices this uses a small service worker installed from this website, which only displays the reminder; it does not store or send your data. Your notification preferences are stored locally; no push-notification server is used.</P>

      <H3>Hidden Mode and PIN lock</H3>
      <P>Hidden Mode changes only what ZenFuel shows on screen (a neutral title and placeholders for habit names and notes). The PIN lock hides the app on your device. Neither encrypts your data, and neither changes what is stored or exported.</P>

      <H2>4. Google Analytics</H2>
      <P>ZenFuel currently uses Google Analytics 4, a web analytics service provided by Google. When you visit the website, Google Analytics may collect information such as:</P>
      <UL>
        <li>Pages you visit and how you interact with the website</li>
        <li>Device type, browser, operating system and screen size</li>
        <li>Approximate location derived from your IP address</li>
        <li>Referring website and date and time of your visit</li>
      </UL>
      <P>Google Analytics uses cookies or similar technologies to recognise returning visitors. ZenFuel does not deliberately send the contents of your habit logs, notes, goals or challenges to Google Analytics. Information collected by Google Analytics is processed by Google under its own privacy terms; see <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google&apos;s Privacy Policy</a>.</P>
      <P>You can limit Google Analytics by blocking cookies in your browser settings, using a content blocker, or installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Analytics opt-out browser add-on</a> where it is available for your browser. ZenFuel&apos;s tracker features continue to work if you do this.</P>

      <H2>5. Hosting</H2>
      <P>The website is hosted on Vercel. As with any website, the hosting provider receives standard technical information needed to deliver pages to your browser, such as your IP address and browser type.</P>

      <H2>6. Payments</H2>
      <P>ZenFuel is free during its beta and does not collect payment details. If paid plans are introduced, this policy will be updated before any payment is taken.</P>

      <H2>7. Deleting and Exporting Your Data</H2>
      <H3>Delete</H3>
      <P>Because your tracker data is stored on your device, you control its deletion:</P>
      <UL>
        <li><strong className={strong}>Settings → Data Management → Clear All</strong> deletes all ZenFuel data stored in this browser: habit log entries and notes, goals, challenges, custom habits, app settings (including your PIN), notification preferences (including the optional name), any saved plan or trial status, and dismissed-alert preferences. Default habits and built-in challenges are set up again afterwards.</li>
        <li>Clear All does not change your browser&apos;s notification permission or remove Google Analytics cookies. To remove those, use your browser&apos;s site settings or clear this site&apos;s data (local storage and cookies).</li>
      </UL>
      <P>Deleting data on one device or browser does not affect other devices or browsers, because nothing is synced between them.</P>
      <H3>Export and restore</H3>
      <P>From <strong className={strong}>Settings → Data Management</strong> you can export a full backup as a JSON file (entries, habits, goals, challenges, settings including your PIN lock, notification preferences and any saved plan status) or your entries as a CSV file. A JSON backup can be restored on this or another device. Backup files are saved to your device; we never receive them.</P>

      <H2>8. Children&apos;s Privacy</H2>
      <P>ZenFuel is not directed at children under the age of 13. If you believe a child has used ZenFuel and want help understanding what is stored, contact us at <MailLink />.</P>

      <H2>9. Changes to This Policy</H2>
      <P>If ZenFuel&apos;s data practices change — for example, if accounts, cloud storage or payments are added — we will update this policy and the &quot;Last updated&quot; date at the top of this page before the change takes effect.</P>

      <H2>10. Contact</H2>
      <InfoBox>
        <p className="font-semibold text-ink-2">For privacy questions or requests:</p>
        <p>Email: <MailLink /></p>
        <p>See also our <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>.</p>
      </InfoBox>

    </LegalLayout>
  );
}

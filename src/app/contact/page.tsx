import type { Metadata } from 'next';
import { ContactContent } from '@/components/legal/ContactContent';

export const metadata: Metadata = {
  title: 'Contact Us — ZenFuel',
  description: 'Get in touch with ZenFuel support. We respond personally to every message.',
};

export default function ContactPage() {
  return <ContactContent />;
}

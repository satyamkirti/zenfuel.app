import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE = 'https://zenfuel.app';
const LAST_MODIFIED = '2026-07-07';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                      lastModified: LAST_MODIFIED, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/upgrade`,         lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/analytics`,       lastModified: LAST_MODIFIED, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/habits`,          lastModified: LAST_MODIFIED, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/challenges`,      lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/goals`,           lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/history`,         lastModified: LAST_MODIFIED, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/reports`,         lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`,         lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,           lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/refund`,          lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/contact`,         lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.4 },
  ];
}

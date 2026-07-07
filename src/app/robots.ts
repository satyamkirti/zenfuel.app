import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings'],
      },
    ],
    sitemap: 'https://zenfuel.app/sitemap.xml',
    host: 'https://zenfuel.app',
  };
}

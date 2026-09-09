import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/data';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og-image/'],
        disallow: ['/admin/', '/api/admin/', '/api/users/', '/api/upload/', '/login'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

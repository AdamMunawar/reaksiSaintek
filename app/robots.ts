import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || vercelDomain || 'https://reaksi-saintek.vercel.app';

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

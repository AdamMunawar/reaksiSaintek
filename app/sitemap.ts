import { MetadataRoute } from 'next';
import { db } from '@/lib/db/repository';
import { RUBRIKS } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || vercelDomain || 'https://reaksisaintek.vercel.app';
  const now = new Date();

  // 1. Static Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tentang`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/redaksi`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pedoman-media-siber`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kirim-tulisan`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cari`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // 2. Rubrik / Category Pages
  const rubrikPages: MetadataRoute.Sitemap = RUBRIKS.map((rubrik) => ({
    url: `${baseUrl}/${rubrik.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // 3. Dynamic Article Pages
  const allArticles = db.getArticles() || [];
  const publishedArticles = allArticles.filter((art) => art.status === 'PUBLISHED');

  const articlePages: MetadataRoute.Sitemap = publishedArticles.map((art) => ({
    url: `${baseUrl}/artikel/${art.slug}`,
    lastModified: art.updatedAt ? new Date(art.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...rubrikPages, ...articlePages];
}

import { MetadataRoute } from 'next';
import { query } from '@/backend/db/postgres';
import { db } from '@/lib/db/repository';
import { RUBRIKS, getBaseUrl } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // revalidate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
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
      url: `${baseUrl}/e-paper`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/media-partner`,
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
  let activeRubriksList: Array<{ slug: string }> = [];
  try {
    if (process.env.DATABASE_URL) {
      const rubrikRes = await query(`SELECT slug FROM rubriks ORDER BY sort_order ASC;`);
      if (rubrikRes && rubrikRes.rows && rubrikRes.rows.length > 0) {
        activeRubriksList = rubrikRes.rows;
      }
    }
  } catch (_) {}
  if (activeRubriksList.length === 0) {
    activeRubriksList = (db.getRubriks() || []).map((r) => ({ slug: r.slug }));
  }
  if (activeRubriksList.length === 0) {
    activeRubriksList = RUBRIKS.map((r) => ({ slug: r.slug }));
  }

  const rubrikPages: MetadataRoute.Sitemap = activeRubriksList
    .filter((r) => r.slug !== 'epaper' && r.slug !== 'e-paper')
    .map((rubrik) => ({
      url: `${baseUrl}/${rubrik.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    }));

  // 3. Dynamic Article Pages (canonical: /[rubrik]/[cleanSlug])
  let publishedArticles: Array<{ slug: string; rubrik?: string; updatedAt?: string }> = [];

  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        `SELECT slug, rubrik, COALESCE(updated_at, published_at, created_at) as updated_at 
         FROM articles 
         WHERE status = 'PUBLISHED' 
         ORDER BY COALESCE(published_at, created_at) DESC;`
      );
      if (res && res.rows) {
        publishedArticles = res.rows.map((r: any) => ({
          slug: (r.slug || '').replace(/-+$/, ''),
          rubrik: r.rubrik,
          updatedAt: r.updated_at,
        }));
      }
    }
  } catch (err) {
    console.warn('[Sitemap] PostgreSQL fetch warning, using fallback:', err);
  }

  // Fallback to local db if PostgreSQL empty or unreachable
  if (publishedArticles.length === 0) {
    const local = (db.getArticles() || [])
      .filter((art) => art.status === 'PUBLISHED')
      .map((art) => ({
        slug: (art.slug || '').replace(/-+$/, ''),
        rubrik: art.rubrik,
        updatedAt: art.updatedAt,
      }));
    publishedArticles = local;
  }

  const articlePages: MetadataRoute.Sitemap = publishedArticles.map((art) => ({
    url: art.rubrik
      ? `${baseUrl}/${art.rubrik}/${art.slug}`
      : `${baseUrl}/artikel/${art.slug}`,
    lastModified: art.updatedAt ? new Date(art.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...rubrikPages, ...articlePages];
}

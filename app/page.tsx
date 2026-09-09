import type { Metadata } from 'next';
import { query } from '@/backend/db/postgres';
import { Article, getAllActiveArticles, getBaseUrl } from '@/lib/data';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';
import HomePageClient from './HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "LPM Reaksi | Homepage",
  description: "Portal berita resmi Lembaga Pers Mahasiswa (LPM) Reaksi Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung. Tumbuh, Berkembang, Bersama.",
  alternates: {
    canonical: getBaseUrl(),
  },
  openGraph: {
    title: "LPM Reaksi | Reaksi Saintek",
    description: "Portal berita resmi LPM Reaksi Saintek. Menyajikan liputan kampus, riset saintek, opini kritis, dan karya mahasiswa.",
    url: getBaseUrl(),
    siteName: "LPM Reaksi",
    images: [
      {
        url: `${getBaseUrl()}/images/reaksi.png`,
        width: 1200,
        height: 630,
        alt: "Logo LPM Reaksi FST UIN Bandung",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LPM Reaksi | Reaksi Saintek",
    description: "Portal berita resmi LPM Reaksi Saintek.",
    images: [`${getBaseUrl()}/images/reaksi.png`],
  },
};

async function getInitialArticles(): Promise<Article[]> {
  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        `SELECT * FROM articles 
         WHERE status = 'PUBLISHED' 
         ORDER BY COALESCE(published_at, created_at) DESC 
         LIMIT 50;`
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          slug: r.slug ? r.slug.replace(/-+$/, '') : r.id,
          title: r.title,
          excerpt: extractCleanExcerpt(r.excerpt, r.content),
          content: r.content || '',
          author: r.author_name || 'Redaksi LPM Reaksi',
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.author_name || 'Redaksi')}&background=1d4ed8&color=fff`,
          rubrik: r.rubrik,
          publishedAt: r.published_at || r.created_at || new Date().toISOString(),
          readTime: r.read_time || 3,
          thumbnail: r.cover_image || '',
          coverCaption: r.cover_caption || '',
          tags: Array.isArray(r.tags) ? r.tags : [],
          views: r.views || 0,
          isFeatured: r.rubrik === 'selisik' || Boolean(r.views && r.views > 200),
        }));
      }
    }
  } catch (err) {
    console.warn('[SSR HomePage] PostgreSQL query warning:', err);
  }

  // Fallback if DATABASE_URL is not set or query failed
  return getAllActiveArticles();
}

export default async function HomePage() {
  const initialArticles = await getInitialArticles();
  return <HomePageClient initialArticles={initialArticles} />;
}

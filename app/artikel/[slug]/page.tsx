import type { Metadata } from 'next';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { getArticleBySlug, getRelatedArticles, Article } from '@/lib/data';
import ArticleClient from './ArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://reaksisaintek.vercel.app';
}

async function fetchArticleData(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  // 1. Try PostgreSQL direct
  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        'SELECT * FROM articles WHERE slug = $1 OR id = $1 OR slug = $2 LIMIT 1;',
        [slug, decodedSlug]
      );
      if (res && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt || '',
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
        } as Article;
      }
    }
  } catch (e) {
    console.warn('Server fetch article for metadata failed, falling back:', e);
  }

  // 2. Fallback to repository
  const found = getArticleBySlug(decodedSlug) || getArticleBySlug(slug);
  return found || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleData(slug);
  const baseUrl = getBaseUrl();

  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan | LPM Reaksi',
      description: 'Artikel yang Anda cari tidak dapat ditemukan di Portal Berita LPM Reaksi.',
    };
  }

  const title = article.title;
  const description = article.excerpt || 'Baca artikel dan liputan mendalam selengkapnya di LPM Reaksi.';
  const rawCover = article.thumbnail || '/images/reaksi logos.png';
  const imageUrl = rawCover.startsWith('http')
    ? rawCover
    : `${baseUrl}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
  const articleUrl = `${baseUrl}/artikel/${article.slug}`;

  return {
    title: `${title} | LPM Reaksi`,
    description,
    authors: [{ name: article.author }],
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: articleUrl,
      siteName: 'LPM Reaksi',
      locale: 'id_ID',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchArticleData(slug);
  const related = article ? getRelatedArticles(article, 3) : [];

  return (
    <ArticleClient
      initialArticle={article}
      initialRelated={related}
      slug={slug}
    />
  );
}

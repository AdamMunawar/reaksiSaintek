import { cache } from 'react';
import type { Metadata } from 'next';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { getArticleBySlug, getRelatedArticles, getBaseUrl, Article } from '@/lib/data';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';
import ArticleClient from './ArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

const fetchArticleData = cache(async (slug: string) => {
  const decodedSlug = decodeURIComponent(slug);
  const trimmedSlug = decodedSlug.replace(/-+$/, '');
  const slugWithHyphen = `${trimmedSlug}-`;

  // 1. Try PostgreSQL direct
  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        `SELECT * FROM articles 
         WHERE slug = $1 OR id = $1 OR slug = $2 OR slug = $3 OR slug = $4 
         LIMIT 1;`,
        [slug, decodedSlug, trimmedSlug, slugWithHyphen]
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
  } catch {
    console.info('[404] Resource fallback');
  }

  // 2. Fallback to repository
  const found =
    getArticleBySlug(decodedSlug) ||
    getArticleBySlug(trimmedSlug) ||
    getArticleBySlug(slugWithHyphen) ||
    getArticleBySlug(slug);
  return found || null;
});

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
  const description = extractCleanExcerpt(article.excerpt, article.content, 180) || 'Baca liputan mendalam selengkapnya di Portal Berita LPM Reaksi.';

  // Ensure absolute image URL for WhatsApp / Telegram / Twitter crawler
  let imageUrl = `${baseUrl}/images/reaksi.png`;
  if (article.thumbnail) {
    if (article.thumbnail.startsWith('http://') || article.thumbnail.startsWith('https://')) {
      imageUrl = article.thumbnail;
    } else if (article.thumbnail.startsWith('data:image/')) {
      imageUrl = `${baseUrl}/api/og-image/${encodeURIComponent(article.slug || slug)}`;
    } else if (article.thumbnail.startsWith('/')) {
      imageUrl = `${baseUrl}${article.thumbnail}`;
    } else {
      imageUrl = `${baseUrl}/${article.thumbnail}`;
    }
  } else if (article.slug || slug) {
    imageUrl = `${baseUrl}/api/og-image/${encodeURIComponent(article.slug || slug)}`;
  }

  const articleUrl = article.rubrik
    ? `${baseUrl}/${article.rubrik}/${article.slug || slug}`
    : `${baseUrl}/artikel/${article.slug || slug}`;

  return {
    title: `${title} | LPM Reaksi`,
    description,
    authors: [{ name: article.author }],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: articleUrl,
    },
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
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
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
  const baseUrl = getBaseUrl();

  const jsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: extractCleanExcerpt(article.excerpt, article.content, 180),
    image: [
      article.thumbnail && !article.thumbnail.startsWith('data:')
        ? article.thumbnail
        : `${baseUrl}/api/og-image/${encodeURIComponent(article.slug || slug)}`
    ],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: [{
      '@type': 'Person',
      name: article.author || 'Redaksi LPM Reaksi',
    }],
    publisher: {
      '@type': 'Organization',
      name: 'LPM Reaksi',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/reaksi logos.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/${article.rubrik || 'artikel'}/${(article.slug || slug).replace(/-+$/, '')}`,
    },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleClient
        initialArticle={article}
        initialRelated={related}
        slug={slug}
      />
    </>
  );
}

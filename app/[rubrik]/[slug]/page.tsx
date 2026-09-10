import { cache } from 'react';
import type { Metadata } from 'next';
import { query } from '@/backend/db/postgres';
import { getArticleBySlug, getRelatedArticles, getBaseUrl, Article } from '@/lib/data';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';
// Use absolute alias to avoid TypeScript resolver issues with [bracket] directories
import ArticleViewCore from '@/components/article/ArticleViewCore';

interface Props {
  params: Promise<{ rubrik: string; slug: string }>;
}

const fetchArticleData = cache(async (slug: string, rubrik: string) => {
  const decodedSlug = decodeURIComponent(slug);
  const trimmedSlug = decodedSlug.replace(/-+$/, '');
  const slugWithHyphen = `${trimmedSlug}-`;

  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        `SELECT * FROM articles 
         WHERE (slug = $1 OR id = $1 OR slug = $2 OR slug = $3 OR slug = $4) 
         AND status = $5 LIMIT 1;`,
        [slug, decodedSlug, trimmedSlug, slugWithHyphen, 'PUBLISHED']
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
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        } as Article;
      }
    }
  } catch {
    console.info('[404] Resource fallback');
  }

  const found =
    getArticleBySlug(decodedSlug) ||
    getArticleBySlug(trimmedSlug) ||
    getArticleBySlug(slugWithHyphen) ||
    getArticleBySlug(slug);
  return found || null;
});

const fetchRelatedArticles = cache(async (article: Article, limit = 3): Promise<Article[]> => {
  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        `SELECT id, slug, title, excerpt, cover_image, cover_caption, rubrik, author_name, tags, published_at, views, read_time, created_at, updated_at
         FROM articles
         WHERE status = 'PUBLISHED'
           AND id != $1
           AND slug != $2
         ORDER BY 
           CASE WHEN rubrik = $3 THEN 0 ELSE 1 END,
           COALESCE(published_at, created_at) DESC
         LIMIT $4;`,
        [article.id, article.slug, article.rubrik, limit]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt || '',
          content: '',
          author: r.author_name || 'Redaksi LPM Reaksi',
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.author_name || 'Redaksi')}&background=1d4ed8&color=fff`,
          rubrik: r.rubrik,
          publishedAt: r.published_at || r.created_at || new Date().toISOString(),
          readTime: r.read_time || 3,
          thumbnail: r.cover_image || '',
          coverCaption: r.cover_caption || '',
          tags: Array.isArray(r.tags) ? r.tags : [],
          views: r.views || 0,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    }
  } catch (err) {
    console.warn('[RelatedArticles] Database fallback:', err);
  }

  return getRelatedArticles(article, limit);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, rubrik } = await params;
  const article = await fetchArticleData(slug, rubrik);
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

  // Canonical URL uses rubrik-based path
  const articleUrl = `${baseUrl}/${article.rubrik || rubrik}/${article.slug || slug}`;

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

export default async function RubrikArticlePage({ params }: Props) {
  const { slug, rubrik } = await params;
  const article = await fetchArticleData(slug, rubrik);
  const related = article ? await fetchRelatedArticles(article, 3) : [];
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
    dateModified: article.updatedAt || article.publishedAt,
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
      '@id': `${baseUrl}/${article.rubrik || rubrik}/${(article.slug || slug).replace(/-+$/, '')}`,
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
      <ArticleViewCore
        initialArticle={article}
        initialRelated={related}
        slug={slug}
        rubrikContext={rubrik}
      />
    </>
  );
}

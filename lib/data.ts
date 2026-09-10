import { db } from './db/repository';
import { extractCleanExcerpt } from './utils/cleanHtml';

export function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();

  // Guard against missing hyphen in Vercel environment variable
  if (url.includes('reaksisaintek.vercel.app')) {
    url = url.replace('reaksisaintek.vercel.app', 'reaksi-saintek.vercel.app');
  }

  if (url && !url.includes('localhost')) {
    return url.replace(/\/+$/, '');
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    let vProd = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace('reaksisaintek', 'reaksi-saintek');
    return `https://${vProd.replace(/\/+$/, '')}`;
  }

  if (process.env.VERCEL_URL) {
    let vUrl = process.env.VERCEL_URL.replace('reaksisaintek', 'reaksi-saintek');
    return `https://${vUrl.replace(/\/+$/, '')}`;
  }

  return 'https://reaksi-saintek.vercel.app';
}

export type Rubrik =
  | 'kabar-kampus'
  | 'saintek'
  | 'opini'
  | 'feature'
  | 'lensa-kata'
  | 'infografik'
  | 'regional'
  | 'epaper'
  | 'selisik';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  rubrik: Rubrik;
  subRubrik?: string;
  publishedAt: string;
  readTime: number; // menit
  thumbnail: string;
  coverCaption?: string;
  tags: string[];
  views: number;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const RUBRIK_META: Record<Rubrik, { label: string; description: string; color: string; emoji?: string }> = {
  'kabar-kampus':  { label: 'Kabar Kampus',   description: 'Berita terkini seputar kampus FST & UIN SGD Bandung', color: '#2563EB', emoji: '' },
  'saintek':       { label: 'Saintek Update',  description: 'Perkembangan sains, teknologi, dan inovasi terkini', color: '#0891B2', emoji: '' },
  'opini':         { label: 'Opini',           description: 'Gagasan kritis, kolom, dan perspektif mahasiswa',    color: '#D97706', emoji: '' },
  'feature':       { label: 'Feature',         description: 'Kisah mendalam, profil inspiratif, dan narasi humanis', color: '#7C3AED', emoji: '' },
  'lensa-kata':    { label: 'Lensa & Sastra',  description: 'Karya sastra, puisi, cerpen, dan esai budaya',      color: '#059669', emoji: '' },
  'infografik':    { label: 'Infografik',      description: 'Visualisasi data dan sajian informasi grafis',       color: '#EA580C', emoji: '' },
  'regional':      { label: 'Regional',        description: 'Sorotan isu lokal Jawa Barat dan sekitarnya',        color: '#DC2626', emoji: '' },
  'epaper':        { label: 'E-Paper',         description: 'Arsip terbitan cetak digital dan buletin kampus',    color: '#4B5563', emoji: '' },
  'selisik':       { label: 'Selisik',         description: 'Laporan investigasi mendalam dan data jurnalisme',   color: '#B91C1C', emoji: '' },
};

export const RUBRIKS = (Object.keys(RUBRIK_META) as Rubrik[]).map((slug) => ({
  slug,
  name: RUBRIK_META[slug].label,
  description: RUBRIK_META[slug].description,
  color: RUBRIK_META[slug].color,
  emoji: RUBRIK_META[slug].emoji || '',
}));

// Mulai dari 0 naskah bersih - Portal siap memuat artikel live dari DB Meja Redaksi
export const articles: Article[] = [];

export function getAllActiveArticles(): Article[] {
  try {
    const dbArticles = db.getPublishedArticles();
    if (dbArticles && dbArticles.length > 0) {
      return dbArticles
        .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
        .map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          excerpt: extractCleanExcerpt(a.excerpt, a.content),
          content: a.content,
          author: a.authorName,
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.authorName)}&background=1d4ed8&color=fff`,
          rubrik: a.rubrik as Rubrik,
          subRubrik: a.subRubrik,
          publishedAt: a.publishedAt || a.createdAt,
          readTime: a.readTime || 3,
          thumbnail: a.coverImage,
          coverCaption: a.coverCaption,
          tags: a.tags || [],
          views: a.views || 0,
          isFeatured: a.rubrik === 'selisik' || Boolean(a.views && a.views > 200),
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        }));
    }
  } catch (err) {
    // Fallback during SSR
  }
  return articles;
}

export function getArticlesByRubrik(rubrik: Rubrik | 'semua', limit?: number): Article[] {
  const all = getAllActiveArticles();
  let filtered = rubrik === 'semua' ? all : all.filter((a) => a.rubrik === rubrik);
  if (limit) filtered = filtered.slice(0, limit);
  return filtered;
}

export function getFeaturedArticles(): Article[] {
  const all = getAllActiveArticles();
  const feat = all.filter((a) => a.isFeatured);
  return (feat.length > 0 ? feat : all).slice(0, 3);
}

export function getTrendingArticles(limit = 5): Article[] {
  const all = getAllActiveArticles();
  return [...all].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limit);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const all = getAllActiveArticles().filter((a) => a.id !== article.id && a.slug !== article.slug);
  const related = all.filter((a) => a.rubrik === article.rubrik || a.tags?.some((t) => article.tags?.includes(t)));
  if (related.length >= limit) {
    return related.slice(0, limit);
  }
  const others = all.filter((a) => !related.some((r) => r.id === a.id));
  return [...related, ...others].slice(0, limit);
}

export function getArticleBySlug(slug: string): Article | undefined {
  const decoded = decodeURIComponent(slug);
  const all = getAllActiveArticles();
  const found = all.find((a) => a.slug === slug || a.slug === decoded);
  if (found) return found;

  try {
    const raw = db.getArticleBySlug(slug) || db.getArticleBySlug(decoded);
    if (raw) {
      return {
        id: raw.id,
        slug: raw.slug,
        title: raw.title,
        excerpt: raw.excerpt,
        content: raw.content,
        author: raw.authorName,
        authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.authorName)}&background=1d4ed8&color=fff`,
        rubrik: raw.rubrik as Rubrik,
        subRubrik: raw.subRubrik,
        publishedAt: raw.publishedAt || raw.createdAt,
        readTime: raw.readTime || 3,
        thumbnail: raw.coverImage,
        coverCaption: raw.coverCaption,
        tags: raw.tags || [],
        views: raw.views || 0,
        isFeatured: raw.rubrik === 'selisik' || Boolean(raw.views && raw.views > 200),
      };
    }
  } catch (err) {}

  return undefined;
}

export function getLatestArticles(limit = 8): Article[] {
  const all = getAllActiveArticles();
  return [...all]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(d);

    const timeFormatted = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(d);

    return `${dateFormatted} pukul ${timeFormatted.replace('.', ':')} WIB`;
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Baru saja';
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/**
 * Returns the canonical public URL for an article.
 * Rubrik-based: /[rubrik]/[slug]   (preferred — better SEO)
 * Fallback:     /artikel/[slug]
 */
export function getArticleUrl(article: { rubrik?: string | null; slug: string }): string {
  const cleanSlug = (article.slug || '').replace(/-+$/, '');
  if (article.rubrik && cleanSlug) {
    return `/${article.rubrik}/${cleanSlug}`;
  }
  return `/artikel/${cleanSlug}`;
}


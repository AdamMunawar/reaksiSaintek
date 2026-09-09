import { db } from './db/repository';
import { extractCleanExcerpt } from './utils/cleanHtml';

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
  publishedAt: string;
  readTime: number; // menit
  thumbnail: string;
  coverCaption?: string;
  tags: string[];
  views: number;
  isFeatured?: boolean;
}

export const RUBRIK_META: Record<Rubrik, { label: string; description: string; color: string; emoji?: string }> = {
  'kabar-kampus':  { label: 'Kabar Kampus',   description: 'Berita terkini seputar kampus FST & UIN SGD Bandung', color: '#2563EB', emoji: '' },
  'saintek':       { label: 'Saintek Update',  description: 'Perkembangan sains, teknologi, dan inovasi terkini', color: '#0891B2', emoji: '' },
  'opini':         { label: 'Opini',           description: 'Pandangan kritis dan esai mahasiswa', color: '#7C3AED', emoji: '' },
  'feature':       { label: 'Feature',         description: 'Laporan mendalam dan human interest', color: '#059669', emoji: '' },
  'lensa-kata':    { label: 'Lensa Kata',      description: 'Ruang karya sastra — puisi, cerpen, prosa', color: '#DB2777', emoji: '' },
  'infografik':    { label: 'Infografik',      description: 'Data dan fakta dalam visualisasi menarik', color: '#EA580C', emoji: '' },
  'regional':      { label: 'Regional',        description: 'Berita daerah dan isu lokal Jawa Barat', color: '#D97706', emoji: '' },
  'epaper':        { label: 'E-Paper',         description: 'Tabloid dan majalah digital LPM Reaksi', color: '#475569', emoji: '' },
  'selisik':       { label: 'Selisik',         description: 'Investigasi dan liputan mendalam eksklusif', color: '#DC2626', emoji: '' },
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
          publishedAt: a.publishedAt || a.createdAt,
          readTime: a.readTime || 3,
          thumbnail: a.coverImage,
          coverCaption: a.coverCaption,
          tags: a.tags || [],
          views: a.views || 0,
          isFeatured: a.rubrik === 'selisik' || Boolean(a.views && a.views > 200),
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

export function getRelatedArticles(article: Article, limit = 4): Article[] {
  const all = getAllActiveArticles();
  return all
    .filter((a) => a.id !== article.id && (a.rubrik === article.rubrik || a.tags?.some((t) => article.tags?.includes(t))))
    .slice(0, limit);
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
    }).format(new Date(dateStr));
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
  if (article.rubrik && article.slug) {
    return `/${article.rubrik}/${article.slug}`;
  }
  return `/artikel/${article.slug}`;
}


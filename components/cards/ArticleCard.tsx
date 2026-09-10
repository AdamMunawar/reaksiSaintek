import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/data';
import { formatDate } from '@/lib/data';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';
import { db } from '@/lib/db/repository';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'horizontal' | 'minimal';
}

/** Returns canonical rubrik-based article URL: /[rubrik]/[slug] */
function articleHref(article: Article): string {
  const cleanSlug = (article.slug || '').replace(/-+$/, '');
  if (article.rubrik && cleanSlug) {
    return `/${article.rubrik}/${cleanSlug}`;
  }
  return `/artikel/${cleanSlug}`;
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const href = articleHref(article);
  const isInfografik = article.rubrik === 'infografik';
  const thumbnailSrc = article.thumbnail || '/images/reaksi.png';
  const rubrikData = article.rubrik ? db.getRubrikBySlug(article.rubrik) : null;
  const rubrikName = rubrikData?.name || article.rubrik;
  const rubrikBadge = article.subRubrik
    ? `${rubrikName} · ${article.subRubrik}`
    : rubrikName;

  /* ── HORIZONTAL VARIANT (Sidebar & Lists) ── */
  if (variant === 'horizontal') {
    return (
      <Link
        href={href}
        className="group flex items-start justify-between gap-6 sm:gap-8 py-5 sm:py-6 hover:opacity-95 transition-opacity"
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {rubrikName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {rubrikBadge}
              </span>
            )}
            {rubrikName && article.author && <span className="text-gray-300 dark:text-gray-600 text-xs">&bull;</span>}
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {article.author}
            </p>
          </div>
          <h4 className="text-base sm:text-[17px] font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
            {article.title}
          </h4>
          <p className="text-xs text-gray-400 dark:text-gray-500" suppressHydrationWarning>
            {article.readTime} menit · {formatDate(article.publishedAt)}
          </p>
        </div>
        <div className={`relative ${isInfografik ? 'w-20 h-28 sm:w-24 sm:h-32' : 'w-28 h-20 sm:w-32 sm:h-22'} rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800`}>
          <Image
            src={thumbnailSrc}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover group-hover:scale-103 transition-transform duration-500"
          />
          {isInfografik && (
            <div className="absolute bottom-1 right-1 z-10">
              <span className="bg-orange-600/90 text-white font-bold text-[8px] uppercase tracking-wider px-1 py-0.5 rounded shadow-sm">
                A3/A4
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  /* ── MINIMAL VARIANT ── */
  if (variant === 'minimal') {
    return (
      <Link href={href} className="group flex items-start gap-3 py-3">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-2.5" />
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-relaxed">
          {article.title}
        </p>
      </Link>
    );
  }

  /* ── DEFAULT EDITORIAL CARD ── */
  return (
    <Link
      href={href}
      className="group block cursor-pointer transition-opacity hover:opacity-95"
    >
      {/* Photo with aspect-[16/10] or Poster with aspect-[3/4] for A3/A4 infographics */}
      <div className={`relative w-full ${isInfografik ? 'aspect-[3/4] border border-orange-500/20 shadow-md' : 'aspect-[16/10]'} rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 mb-3.5`}>
        <Image
          src={thumbnailSrc}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-102 transition-transform duration-500"
        />
        {isInfografik && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-orange-600/95 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
              Poster A3/A4
            </span>
          </div>
        )}
      </div>

      <div>
        {/* Rubrik / Sub-Rubrik & Author */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {rubrikName && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {rubrikBadge}
            </span>
          )}
          {rubrikName && article.author && <span className="text-gray-300 dark:text-gray-600 text-xs">&bull;</span>}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            {article.author}
          </p>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors mb-1.5">
          {article.title}
        </h3>

        {/* Excerpt Ringkasan (Hanya ditampilkan di Card) */}
        {(article.excerpt || article.content) && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2 font-normal">
            {extractCleanExcerpt(article.excerpt, article.content, 140)}
          </p>
        )}

        {/* Date & Read time */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500" suppressHydrationWarning>
          {article.readTime} menit · {formatDate(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

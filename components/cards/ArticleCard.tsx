import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/data';
import { formatDate } from '@/lib/data';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'horizontal' | 'minimal';
}

/** Returns canonical rubrik-based article URL: /[rubrik]/[slug] */
function articleHref(article: Article): string {
  if (article.rubrik && article.slug) {
    return `/${article.rubrik}/${article.slug}`;
  }
  return `/artikel/${article.slug}`;
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const href = articleHref(article);

  /* ── HORIZONTAL VARIANT (Sidebar & Lists) ── */
  if (variant === 'horizontal') {
    return (
      <Link
        href={href}
        className="group flex items-start justify-between gap-6 sm:gap-8 py-5 sm:py-6 hover:opacity-95 transition-opacity"
      >
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 font-medium">
            {article.author}
          </p>
          <h4 className="text-base sm:text-[17px] font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
            {article.title}
          </h4>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {article.readTime} menit · {formatDate(article.publishedAt)}
          </p>
        </div>
        <div className="relative w-28 h-20 sm:w-32 sm:h-22 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800">
          <Image
            src={article.thumbnail}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover group-hover:scale-103 transition-transform duration-500"
          />
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
      {/* Clean photo with rounded-xl */}
      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 mb-3.5">
        <Image
          src={article.thumbnail}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-102 transition-transform duration-500"
        />
      </div>

      <div>
        {/* Author */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mb-1">
          {article.author}
        </p>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors mb-1.5">
          {article.title}
        </h3>

        {/* Excerpt Ringkasan (Hanya ditampilkan di Card) */}
        {article.excerpt && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2 font-normal">
            {article.excerpt}
          </p>
        )}

        {/* Date & Read time */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          {article.readTime} menit · {formatDate(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

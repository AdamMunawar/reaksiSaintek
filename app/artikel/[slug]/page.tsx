'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/cards/ArticleCard';
import {
  getArticleBySlug,
  getRelatedArticles,
  formatDate,
  RUBRIK_META,
  Article,
} from '@/lib/data';
import { db } from '@/lib/db/repository';
import { ChevronRight, Clock, Eye, Share2, ArrowLeft, Newspaper, Loader2 } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { cleanArticleHtml, extractCleanExcerpt } from '@/lib/utils/cleanHtml';

const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function ArticlePage() {
  const params = useParams();
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug as string) || '';

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [rubrikMeta, setRubrikMeta] = useState<{ label: string; color: string }>({
    label: 'Berita',
    color: '#2563EB',
  });


  useEffect(() => {
    if (!slug) return;

    // 1. Fetch article from db or data helper
    const decodedSlug = decodeURIComponent(slug);
    let found = getArticleBySlug(decodedSlug) || getArticleBySlug(slug);

    if (!found) {
      const rawDb = db.getArticleBySlug(decodedSlug) || db.getArticleBySlug(slug);
      if (rawDb) {
        found = {
          id: rawDb.id,
          slug: rawDb.slug,
          title: rawDb.title,
          excerpt: rawDb.excerpt,
          content: rawDb.content,
          author: rawDb.authorName,
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(rawDb.authorName)}&background=1d4ed8&color=fff`,
          rubrik: rawDb.rubrik as any,
          publishedAt: rawDb.publishedAt || rawDb.createdAt,
          readTime: rawDb.readTime || 3,
          thumbnail: rawDb.coverImage,
          tags: rawDb.tags || [],
          views: rawDb.views || 0,
        };
      }
    }

    if (found) {
      setArticle(found);
      setRelated(getRelatedArticles(found, 3));

      // Get rubrik details dynamically
      const dynamicRubrik = db.getRubrikBySlug(found.rubrik);
      if (dynamicRubrik) {
        setRubrikMeta({
          label: dynamicRubrik.name,
          color: dynamicRubrik.color,
        });
      } else if ((RUBRIK_META as any)[found.rubrik]) {
        const meta = (RUBRIK_META as any)[found.rubrik];
        setRubrikMeta({
          label: meta.label,
          color: meta.color,
        });
      }

      // Increment views
      if (db && typeof db.incrementViews === 'function') {
        db.incrementViews(found.id);
      }
      setLoading(false);
    }

    // Live fetch dari database server (terutama untuk device baru yang belum punya local cache)
    fetch(`/api/articles/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((remoteArt) => {
        if (remoteArt && !remoteArt.error) {
          const mapped: Article = {
            id: remoteArt.id,
            slug: remoteArt.slug,
            title: remoteArt.title,
            excerpt: remoteArt.excerpt,
            content: remoteArt.content,
            author: remoteArt.authorName || remoteArt.author_name || 'Redaksi LPM Reaksi',
            authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteArt.authorName || remoteArt.author_name || 'Redaksi')}&background=1d4ed8&color=fff`,
            rubrik: remoteArt.rubrik as any,
            publishedAt: remoteArt.publishedAt || remoteArt.published_at || remoteArt.createdAt || new Date().toISOString(),
            readTime: remoteArt.readTime || remoteArt.read_time || 3,
            thumbnail: remoteArt.coverImage || remoteArt.cover_image,
            coverCaption: remoteArt.coverCaption || remoteArt.cover_caption,
            tags: remoteArt.tags || [],
            views: remoteArt.views || 0,
          };
          setArticle(mapped);
          setRelated(getRelatedArticles(mapped, 3));
          db.saveArticle(mapped as any);

          const dynRubrik = db.getRubrikBySlug(mapped.rubrik);
          if (dynRubrik) {
            setRubrikMeta({
              label: dynRubrik.name,
              color: dynRubrik.color,
            });
          }
        }
      })
      .catch((e) => console.warn('Fetch remote article failed:', e))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col transition-colors"
        style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
      >
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
            Memuat artikel...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div
        className="min-h-screen flex flex-col transition-colors"
        style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
      >
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-24 text-center">
          <div
            className="p-8 border rounded-sm space-y-4 max-w-md mx-auto"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
          >
            <Newspaper size={48} className="mx-auto text-[var(--color-muted)]" />
            <h1 className="text-xl font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Artikel Tidak Ditemukan
            </h1>
            <p className="text-xs text-[var(--color-muted)]">
              Artikel yang Anda cari mungkin belum diterbitkan atau telah dipindahkan.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title={article.title} />
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16 w-full">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
          <Link href="/" className="hover:underline">Beranda</Link>
          <ChevronRight size={12} />
          <Link href={`/${article.rubrik}`} className="hover:underline" style={{ color: rubrikMeta.color }}>
            {rubrikMeta.label}
          </Link>
        </nav>

        {/* Category Badge */}
        <span
          className="inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white mb-3"
          style={{ backgroundColor: rubrikMeta.color, fontFamily: 'var(--font-display)' }}
        >
          {rubrikMeta.label}
        </span>

        {/* Headline */}
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
        >
          {article.title}
        </h1>

        {/* Byline */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 py-4 my-6"
          style={{
            borderTop: '1px solid var(--color-line)',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center border"
              style={{
                backgroundImage: `url(${article.authorAvatar})`,
                borderColor: 'var(--color-line)',
              }}
            />
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
                {article.author}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                {formatDate(article.publishedAt)} · {article.readTime} menit baca
              </p>
            </div>
          </div>

          {/* Share */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mr-1">
              Bagikan:
            </span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bagikan WhatsApp"
              className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded hover:opacity-90 transition-opacity"
            >
              <WhatsAppIcon />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bagikan X"
              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded hover:opacity-90 transition-opacity"
            >
              <TwitterXIcon />
            </a>
          </div>
        </div>

        {/* Featured Photo (Responsive) */}
        {article.thumbnail && (
          <div className="mb-8 sm:mb-12 w-full">
            <div
              className="relative w-full overflow-hidden border mb-2 rounded-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
              }}
            >
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-auto max-h-[560px] object-cover aspect-[16/10] sm:aspect-[16/9]"
              />
            </div>
            {article.coverCaption ? (
              <p className="text-[11px] sm:text-xs text-center italic mt-1.5" style={{ color: 'var(--color-muted)' }}>
                {article.coverCaption}
              </p>
            ) : null}
          </div>
        )}

        {/* Article Body */}
        <div
          className="article-body text-base sm:text-lg leading-relaxed space-y-6 clear-both"
          style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-serif)' }}
          dangerouslySetInnerHTML={{
            __html: (() => {
              if (!article.content) return '';
              // Check if content is already rich HTML (from WYSIWYG editor)
              const isHtml =
                /^\s*<[a-z]/i.test(article.content) ||
                article.content.includes('<p') ||
                article.content.includes('<div') ||
                article.content.includes('<figure') ||
                article.content.includes('<span') ||
                article.content.includes('<blockquote');
              if (isHtml) {
                return cleanArticleHtml(article.content);
              }
              return article.content
                .split(/\n\s*\n/)
                .map((p) => {
                  const trimmed = p.trim();
                  if (!trimmed) return '';

                  // Preserved HTML elements (figures, text-align divs, tables, quotes)
                  if (
                    trimmed.startsWith('<figure') ||
                    trimmed.startsWith('<div') ||
                    trimmed.startsWith('<table') ||
                    trimmed.startsWith('<blockquote')
                  ) {
                    return trimmed;
                  }

                  if (trimmed.startsWith('## ')) {
                    return `<h2 class="text-2xl font-bold font-display mt-8 mb-3 tracking-tight" style="color: var(--color-foreground); font-family: var(--font-display);">${trimmed.replace(/^## /, '')}</h2>`;
                  }
                  if (trimmed.startsWith('### ')) {
                    return `<h3 class="text-xl font-bold font-display mt-6 mb-2 tracking-tight" style="color: var(--color-foreground); font-family: var(--font-display);">${trimmed.replace(/^### /, '')}</h3>`;
                  }
                  if (trimmed.startsWith('> ')) {
                    return `<blockquote class="border-l-4 border-[var(--color-accent)] pl-5 py-3 my-6 italic bg-blue-50/20 text-base sm:text-lg">"${trimmed.replace(/^> /, '')}"</blockquote>`;
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const items = trimmed
                      .split('\n')
                      .map((li) => `<li class="ml-5 list-disc mb-1.5">${li.replace(/^[-*]\s+/, '')}</li>`)
                      .join('');
                    return `<ul class="my-4 space-y-1">${items}</ul>`;
                  }
                  if (/^\d+\.\s/.test(trimmed)) {
                    const items = trimmed
                      .split('\n')
                      .map((li) => `<li class="ml-5 list-decimal mb-1.5">${li.replace(/^\d+\.\s+/, '')}</li>`)
                      .join('');
                    return `<ol class="my-4 space-y-1">${items}</ol>`;
                  }

                  const formatted = trimmed
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-6 rounded-sm w-full max-h-[500px] object-cover border" />')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline font-semibold">$1</a>')
                    .replace(/\n/g, '<br />');

                  return `<p class="mb-4 leading-relaxed">${formatted}</p>`;
                })
                .join('');
            })(),
          }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div
            className="mt-12 pt-6 flex flex-wrap items-center gap-2"
            style={{ borderTop: '1px solid var(--color-line)' }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mr-2">
              Topik Terkait:
            </span>
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/cari?q=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 text-xs font-medium border hover:border-[var(--color-accent)] transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-line)',
                  color: 'var(--color-foreground)',
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16 pt-10" style={{ borderTop: '2px solid var(--color-keyline)' }}>
            <h2
              className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight mb-8"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Artikel Terkait
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

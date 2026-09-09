'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/cards/ArticleCard';
import {
  getRelatedArticles,
  formatDate,
  RUBRIK_META,
  Article,
} from '@/lib/data';
import { db } from '@/lib/db/repository';
import {
  ChevronRight,
  Clock,
  Eye,
  Share2,
  ArrowLeft,
  Newspaper,
  Loader2,
  Link2,
  Check,
  Settings2,
  ArrowUp,
  Type,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { cleanArticleHtml } from '@/lib/utils/cleanHtml';

// ─── Social Icons ─────────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TwitterXIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// ─── Reading Settings Types ────────────────────────────────────────────────────
type FontSize = number;
type FontFamily = 'serif' | 'sans' | 'mono';
type ColWidth = 'narrow' | 'normal' | 'wide';

const PRESET_FONT_SIZES = [15, 18, 21, 24];
const COL_WIDTHS: Record<ColWidth, string> = {
  narrow: 'max-w-2xl',
  normal: 'max-w-4xl',
  wide: 'max-w-6xl',
};
const FONT_FAMILY_CSS: Record<FontFamily, string> = {
  serif: 'var(--font-serif), Georgia, "Times New Roman", serif',
  sans: 'var(--font-sans), var(--font-body), system-ui, -apple-system, sans-serif',
  mono: 'var(--font-mono), ui-monospace, "SF Mono", Menlo, Courier, monospace',
};

// ─── Props ─────────────────────────────────────────────────────────────────────
interface ArticleViewCoreProps {
  initialArticle?: Article | null;
  initialRelated?: Article[];
  slug: string;
  /** If set, validates that rubrik matches and updates breadcrumb URL */
  rubrikContext?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ArticleViewCore({
  initialArticle = null,
  initialRelated = [],
  slug,
  rubrikContext,
}: ArticleViewCoreProps) {
  const [article, setArticle] = useState<Article | null>(initialArticle);
  const [related, setRelated] = useState<Article[]>(initialRelated);
  const [loading, setLoading] = useState(!initialArticle);

  // Initialize rubrikMeta immediately so SSR matches Client render exactly
  const initialMeta = (() => {
    const rKey = initialArticle?.rubrik || rubrikContext;
    if (rKey && (RUBRIK_META as any)[rKey]) {
      return (RUBRIK_META as any)[rKey];
    }
    return { label: 'Berita', color: '#2563EB' };
  })();
  const [rubrikMeta, setRubrikMeta] = useState<{ label: string; color: string }>(initialMeta);

  // ── Reading settings (Session in-memory) ──────────────────────────────────
  const [fontSize, setFontSize] = useState<FontSize>(18);
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [colWidth, setColWidth] = useState<ColWidth>('normal');
  const [showReadingPanel, setShowReadingPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── View count ──────────────────────────────────────────────────────────────
  const [viewCount, setViewCount] = useState<number>(initialArticle?.views ?? 0);
  const viewIncrementedRef = useRef(false);

  // ── Copy link ───────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── Back to top ─────────────────────────────────────────────────────────────
  const [showBackToTop, setShowBackToTop] = useState(false);

  // ── Scroll listener for back-to-top button ─────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 320);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close panel on outside click ───────────────────────────────────────────
  useEffect(() => {
    if (!showReadingPanel) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowReadingPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showReadingPanel]);

  // ── Fetch article & increment views ───────────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    if (article) {
      const dynamicRubrik = db.getRubrikBySlug(article.rubrik);
      if (dynamicRubrik) {
        setRubrikMeta({ label: dynamicRubrik.name, color: dynamicRubrik.color });
      } else if ((RUBRIK_META as any)[article.rubrik]) {
        const meta = (RUBRIK_META as any)[article.rubrik];
        setRubrikMeta({ label: meta.label, color: meta.color });
      }
      setLoading(false);

      // Increment view count once after article is loaded
      if (!viewIncrementedRef.current && article.id) {
        viewIncrementedRef.current = true;
        fetch(`/api/articles/${encodeURIComponent(article.id)}/views`, { method: 'PATCH' })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data?.views != null) setViewCount(data.views); })
          .catch(() => {});
      }
      return;
    }

    const decodedSlug = decodeURIComponent(slug);
    fetch(`/api/articles/${encodeURIComponent(decodedSlug)}`)
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
          setViewCount(mapped.views);
          setRelated(getRelatedArticles(mapped, 3));

          const dynRubrik = db.getRubrikBySlug(mapped.rubrik);
          if (dynRubrik) {
            setRubrikMeta({ label: dynRubrik.name, color: dynRubrik.color });
          }

          // Increment view count once after article is loaded
          if (!viewIncrementedRef.current) {
            viewIncrementedRef.current = true;
            fetch(`/api/articles/${encodeURIComponent(mapped.id)}/views`, { method: 'PATCH' })
              .then((r) => r.ok ? r.json() : null)
              .then((data) => { if (data?.views != null) setViewCount(data.views); })
              .catch(() => {});
          }
        }
      })
      .catch(() => console.info('[404] Resource fallback'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ── Copy link handler ──────────────────────────────────────────────────────
  const handleCopyLink = useCallback(() => {
    let url = typeof window !== 'undefined' ? window.location.href : '';
    url = url.replace(/-+$/, '');
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Font size change (slider / scroll / step) ────────────────────────────
  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(12, Math.min(32, Math.round(newSize)));
    setFontSize(clamped);
  };

  const handleFontSizeStep = (delta: number) => {
    handleFontSizeChange(fontSize + delta);
  };

  const handleFontFamily = (ff: FontFamily) => {
    setFontFamily(ff);
  };

  const handleColWidth = (cw: ColWidth) => {
    setColWidth(cw);
  };

  // ── Render article body HTML ───────────────────────────────────────────────
  const renderBody = (content: string): string => {
    if (!content) return '';
    const isHtml =
      /^\s*<[a-z]/i.test(content) ||
      content.includes('<p') ||
      content.includes('<div') ||
      content.includes('<figure') ||
      content.includes('<span') ||
      content.includes('<blockquote');
    if (isHtml) return cleanArticleHtml(content);
    return content
      .split(/\n\s*\n/)
      .map((p) => {
        const t = p.trim();
        if (!t) return '';
        if (t.startsWith('<figure') || t.startsWith('<div') || t.startsWith('<table') || t.startsWith('<blockquote')) return t;
        if (t.startsWith('## ')) return `<h2 class="text-2xl font-bold font-display mt-8 mb-3 tracking-tight" style="color:var(--color-foreground);font-family:var(--font-display)">${t.replace(/^## /, '')}</h2>`;
        if (t.startsWith('### ')) return `<h3 class="text-xl font-bold font-display mt-6 mb-2 tracking-tight" style="color:var(--color-foreground);font-family:var(--font-display)">${t.replace(/^### /, '')}</h3>`;
        if (t.startsWith('> ')) return `<blockquote class="border-l-4 border-[var(--color-accent)] pl-5 py-3 my-6 italic bg-blue-50/20">"${t.replace(/^> /, '')}"</blockquote>`;
        if (t.startsWith('- ') || t.startsWith('* ')) {
          const items = t.split('\n').map((li) => `<li class="ml-5 list-disc mb-1.5">${li.replace(/^[-*]\s+/, '')}</li>`).join('');
          return `<ul class="my-4 space-y-1">${items}</ul>`;
        }
        if (/^\d+\.\s/.test(t)) {
          const items = t.split('\n').map((li) => `<li class="ml-5 list-decimal mb-1.5">${li.replace(/^\d+\.\s+/, '')}</li>`).join('');
          return `<ol class="my-4 space-y-1">${items}</ol>`;
        }
        const fmt = t
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-6 rounded-sm w-full max-h-[500px] object-cover border" />')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline font-semibold">$1</a>')
          .replace(/\n/g, '<br />');
        return `<p class="mb-4 leading-relaxed">${fmt}</p>`;
      })
      .join('');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Memuat artikel...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!article) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="p-8 border rounded-sm space-y-4 max-w-md mx-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
            <Newspaper size={48} className="mx-auto text-[var(--color-muted)]" />
            <h1 className="text-xl font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>Artikel Tidak Ditemukan</h1>
            <p className="text-xs text-[var(--color-muted)]">Artikel yang Anda cari mungkin belum diterbitkan atau telah dipindahkan.</p>
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

  const handleShareWhatsApp = useCallback(() => {
    let url = typeof window !== 'undefined' ? window.location.href : '';
    url = url.replace(/-+$/, '');
    const text = `${article.title}\n\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }, [article.title]);

  const handleShareTwitter = useCallback(() => {
    let url = typeof window !== 'undefined' ? window.location.href : '';
    url = url.replace(/-+$/, '');
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  }, [article.title]);

  const rubrikUrl = article.rubrik ? `/${article.rubrik}` : '/';

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title={article.title} />
      <Header />

      {/* ── Main Article ── */}
      <main className={`flex-1 mx-auto px-4 sm:px-8 py-10 sm:py-16 w-full transition-all duration-300 ${COL_WIDTHS[colWidth]}`} suppressHydrationWarning>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
          <Link href="/" className="hover:underline">Beranda</Link>
          <ChevronRight size={12} />
          <Link href={rubrikUrl} className="hover:underline capitalize" style={{ color: rubrikMeta.color }} suppressHydrationWarning>
            {rubrikMeta.label}
          </Link>
        </nav>

        {/* Category Badge */}
        <span
          className="inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white mb-3"
          style={{ backgroundColor: rubrikMeta.color, fontFamily: 'var(--font-display)' }}
          suppressHydrationWarning
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
          style={{ borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}
        >
          {/* Author + meta */}
          <div className="flex items-center gap-3">
            <img
              src={article.authorAvatar}
              alt={article.author}
              className="w-10 h-10 rounded-full object-cover border flex-shrink-0"
              style={{ borderColor: 'var(--color-line)' }}
            />
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
                {article.author}
              </p>
              <p className="text-[11px] flex items-center gap-2 flex-wrap" style={{ color: 'var(--color-muted)' }}>
                <span suppressHydrationWarning>{formatDate(article.publishedAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {article.readTime} menit baca
                </span>
                <span>·</span>
                <span className="flex items-center gap-1" suppressHydrationWarning>
                  <Eye size={11} />
                  <span suppressHydrationWarning>{viewCount.toLocaleString('id-ID')} dibaca</span>
                </span>
              </p>
            </div>
          </div>

          {/* Action bar: share & copy link */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Bagikan:
            </span>

            {/* WhatsApp */}
            <button
              id="btn-share-wa"
              onClick={handleShareWhatsApp}
              aria-label="Bagikan WhatsApp"
              title="Bagikan ke WhatsApp"
              className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded hover:opacity-90 transition-opacity cursor-pointer"
            >
              <WhatsAppIcon />
            </button>

            {/* Twitter/X */}
            <button
              id="btn-share-x"
              onClick={handleShareTwitter}
              aria-label="Bagikan X (Twitter)"
              title="Bagikan ke X"
              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded hover:opacity-90 transition-opacity cursor-pointer"
            >
              <TwitterXIcon />
            </button>

            {/* Copy Link */}
            <button
              id="btn-copy-link"
              onClick={handleCopyLink}
              className="w-8 h-8 flex items-center justify-center border rounded transition-all cursor-pointer"
              style={{
                borderColor: copied ? 'var(--color-accent)' : 'var(--color-line)',
                backgroundColor: copied ? 'var(--color-accent-pale)' : 'var(--color-surface)',
                color: copied ? 'var(--color-accent)' : 'var(--color-muted)',
              }}
              aria-label={copied ? 'Tautan berhasil disalin' : 'Salin tautan artikel'}
              title={copied ? 'Tautan berhasil disalin!' : 'Salin tautan artikel'}
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />}
            </button>
          </div>
        </div>

        {/* Featured Photo */}
        {article.thumbnail && (
          <div className="mb-8 sm:mb-12 w-full">
            <div
              className="relative w-full overflow-hidden border mb-2 rounded-sm"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
            >
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-auto max-h-[560px] object-cover aspect-[16/10] sm:aspect-[16/9]"
              />
            </div>
            {article.coverCaption && (
              <p className="text-[11px] sm:text-xs text-center italic mt-1.5" style={{ color: 'var(--color-muted)' }}>
                {article.coverCaption}
              </p>
            )}
          </div>
        )}

        {/* Article Body — respects reading settings */}
        <div
          className={`article-body font-mode-${fontFamily} leading-relaxed space-y-6 clear-both transition-all duration-150`}
          style={{
            ['--article-font-family' as any]: FONT_FAMILY_CSS[fontFamily],
            ['--article-font-size' as any]: `${fontSize}px`,
            ['--article-line-height' as any]: fontSize >= 21 ? '1.9' : '1.75',
            color: 'var(--color-foreground)',
            fontFamily: FONT_FAMILY_CSS[fontFamily],
            fontSize: `${fontSize}px`,
            lineHeight: fontSize >= 21 ? '1.9' : '1.75',
          }}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: renderBody(article.content) }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-6 flex flex-wrap items-center gap-2" style={{ borderTop: '1px solid var(--color-line)' }}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mr-2">Topik Terkait:</span>
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

        {/* Copy link (bottom) */}
        <div className="mt-8 flex items-center gap-3 py-4" style={{ borderTop: '1px solid var(--color-line)' }}>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase border rounded transition-all"
            style={{
              borderColor: copied ? 'var(--color-accent)' : 'var(--color-line)',
              backgroundColor: copied ? 'var(--color-accent-pale)' : 'var(--color-surface)',
              color: copied ? 'var(--color-accent)' : 'var(--color-muted)',
              fontFamily: 'var(--font-display)',
            }}
            aria-label="Salin tautan artikel ini"
          >
            {copied ? <Check size={13} /> : <Link2 size={13} />}
            {copied ? 'Tautan Disalin!' : 'Salin Tautan Artikel'}
          </button>
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }} suppressHydrationWarning>
            <Eye size={13} />
            <span suppressHydrationWarning>{viewCount.toLocaleString('id-ID')} kali dibaca</span>
          </span>
        </div>

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

      {/* ── Floating Controls (Bottom-Right) ── */}
      <aside
        aria-label="Kontrol Membaca dan Navigasi"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        ref={panelRef}
      >
        {/* Reading Settings Floating Popover */}
        {showReadingPanel && (
          <div
            id="panel-reading-settings"
            role="dialog"
            aria-label="Kustomisasi Tampilan Baca"
            className="w-[calc(100vw-3rem)] max-w-[320px] rounded-2xl border shadow-2xl p-4 sm:p-5 space-y-4 mb-1 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              color: 'var(--color-foreground)',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--color-line)',
            }}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: 'var(--color-line)' }}>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
                <Type size={14} style={{ color: 'var(--color-accent)' }} />
                Tampilan Baca
              </span>
              <button
                onClick={() => setShowReadingPanel(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-xs text-muted transition-colors"
                aria-label="Tutup panel"
              >
                ✕
              </button>
            </div>

            {/* Font Size — Continuous Slider + Mouse Wheel + Presets */}
            <div
              className="space-y-2.5 p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}
              onWheel={(e) => {
                e.preventDefault();
                handleFontSizeStep(e.deltaY < 0 ? 1 : -1);
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
                  Ukuran Teks (Scroll / Slider)
                </p>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-accent-pale)', color: 'var(--color-accent)' }}>
                  {fontSize}px
                </span>
              </div>

              {/* Slider & Steppers */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFontSizeStep(-1)}
                  disabled={fontSize <= 12}
                  className="w-7 h-7 flex items-center justify-center border rounded-lg text-xs font-bold transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-surface)' }}
                  aria-label="Perkecil 1px"
                  title="Perkecil teks (-1px)"
                >
                  A−
                </button>

                <div className="flex-1 flex items-center px-1">
                  <input
                    type="range"
                    id="slider-font-size"
                    min={12}
                    max={32}
                    step={1}
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)] bg-gray-300 dark:bg-neutral-700"
                    aria-label="Pengatur ukuran font dengan slider"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleFontSizeStep(1)}
                  disabled={fontSize >= 32}
                  className="w-7 h-7 flex items-center justify-center border rounded-lg text-xs font-bold transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-surface)' }}
                  aria-label="Perbesar 1px"
                  title="Perbesar teks (+1px)"
                >
                  A+
                </button>
              </div>

              {/* Presets Shortcut */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[
                  { label: 'S', size: 15 },
                  { label: 'M', size: 18 },
                  { label: 'L', size: 21 },
                  { label: 'XL', size: 24 },
                  { label: '2XL', size: 28 },
                ].map(({ label, size }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleFontSizeChange(size)}
                    className="flex-1 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer"
                    style={{
                      borderColor: fontSize === size ? 'var(--color-accent)' : 'var(--color-line)',
                      color: fontSize === size ? 'var(--color-accent)' : 'var(--color-muted)',
                      backgroundColor: fontSize === size ? 'var(--color-accent-pale)' : 'var(--color-surface)',
                      transform: fontSize === size ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {label} ({size})
                  </button>
                ))}
              </div>

              <p className="text-[9px] text-center" style={{ color: 'var(--color-muted)' }}>
                Tip: Geser slider atau scroll mouse di kotak ini
              </p>
            </div>

            {/* Font Family */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
                Jenis Font
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'serif', label: 'Serif', preview: 'Abc' },
                    { key: 'sans', label: 'Sans', preview: 'Abc' },
                    { key: 'mono', label: 'Mono', preview: 'Abc' },
                  ] as { key: FontFamily; label: string; preview: string }[]
                ).map(({ key, label, preview }) => (
                  <button
                    key={key}
                    onClick={() => handleFontFamily(key)}
                    className="flex flex-col items-center justify-center py-2 px-1 border rounded-lg transition-all text-center"
                    style={{
                      borderColor: fontFamily === key ? 'var(--color-accent)' : 'var(--color-line)',
                      backgroundColor: fontFamily === key ? 'var(--color-accent-pale)' : 'transparent',
                      color: fontFamily === key ? 'var(--color-accent)' : 'var(--color-muted)',
                    }}
                  >
                    <span
                      className="text-lg leading-none mb-0.5"
                      style={{ fontFamily: FONT_FAMILY_CSS[key] }}
                    >
                      {preview}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column Width */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
                Lebar Baca
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'narrow', label: 'Sempit' },
                    { key: 'normal', label: 'Normal' },
                    { key: 'wide', label: 'Lebar' },
                  ] as { key: ColWidth; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleColWidth(key)}
                    className="py-1.5 px-2 border rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                    style={{
                      borderColor: colWidth === key ? 'var(--color-accent)' : 'var(--color-line)',
                      backgroundColor: colWidth === key ? 'var(--color-accent-pale)' : 'transparent',
                      color: colWidth === key ? 'var(--color-accent)' : 'var(--color-muted)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Settings */}
            <div className="pt-2 border-t flex justify-between items-center text-[10px]" style={{ borderColor: 'var(--color-line)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Tampilan sesi</span>
              <button
                onClick={() => {
                  setFontSize(18);
                  setFontFamily('serif');
                  setColWidth('normal');
                }}
                className="font-bold uppercase tracking-wider text-muted hover:text-[var(--color-accent)] transition-colors"
              >
                Reset Default
              </button>
            </div>
          </div>
        )}

        {/* ── Floating Buttons Row/Stack ── */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Floating Button: Edit Ukuran Teks (Aa) */}
          <button
            id="btn-reading-settings-float"
            onClick={() => setShowReadingPanel((v) => !v)}
            aria-label="Kustomisasi ukuran dan tampilan baca (Aa)"
            title="Kustomisasi ukuran teks dan tampilan baca"
            className="w-11 h-11 flex items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: showReadingPanel ? 'var(--color-accent)' : 'var(--color-surface)',
              borderColor: showReadingPanel ? 'var(--color-accent)' : 'var(--color-line)',
              color: showReadingPanel ? '#ffffff' : 'var(--color-foreground)',
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.18)',
            }}
          >
            <span className="font-serif font-bold text-sm leading-none select-none">Aa</span>
          </button>

          {/* Floating Button: Scroll to Top */}
          <button
            id="btn-back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Kembali ke atas halaman"
            title="Kembali ke atas"
            className="w-11 h-11 flex items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-accent)',
              borderColor: 'var(--color-accent-deep)',
              color: '#ffffff',
              opacity: showBackToTop ? 1 : 0,
              pointerEvents: showBackToTop ? 'auto' : 'none',
              transform: showBackToTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.22)',
            }}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </aside>
    </div>
  );
}

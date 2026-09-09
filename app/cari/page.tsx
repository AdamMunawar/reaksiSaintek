'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getAllActiveArticles, RUBRIK_META, type Rubrik, getArticleUrl, formatDate } from '@/lib/data';
import { db } from '@/lib/db/repository';
import {
  Search,
  X,
  SlidersHorizontal,
  Newspaper,
  ArrowUpDown,
  Clock,
  Flame,
  Calendar,
  Sparkles,
  LayoutGrid,
  List,
  Eye,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { PageTitle } from '@/components/ui/PageTitle';

const RUBRIK_COLORS: Record<string, string> = {
  'kabar-kampus': '#2563eb',
  'saintek':      '#0891b2',
  'opini':        '#7c3aed',
  'feature':      '#059669',
  'lensa-kata':   '#db2777',
  'infografik':   '#ea580c',
  'regional':     '#d97706',
  'selisik':      '#dc2626',
  'epaper':       '#475569',
};

type SortOption = 'relevan' | 'terbaru' | 'terlama' | 'populer';

/* ── Helper: Strip HTML tags to clean plain text ── */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ── Helper: Highlight matching query words with bold & golden marker ── */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!text || !query.trim()) return <>{text}</>;

  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (tokens.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = tokens.some((t) => new RegExp(`^${t}$`, 'i').test(part));
        return isMatch ? (
          <mark
            key={i}
            className="bg-amber-200 dark:bg-amber-900/60 text-blue-900 dark:text-blue-100 font-extrabold px-1 py-0.5 rounded-[2px] shadow-sm transition-colors"
          >
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
}

/* ── Helper: Extract matching snippet around keyword in content ── */
function extractMatchingSnippet(
  content: string,
  fallbackExcerpt: string,
  query: string,
  maxLength = 180
): { snippet: string; matchedInContent: boolean } {
  const cleanContent = stripHtml(content);
  if (!cleanContent || !query.trim()) {
    const text = fallbackExcerpt || cleanContent;
    return {
      snippet: text.slice(0, maxLength) + (text.length > maxLength ? '...' : ''),
      matchedInContent: false,
    };
  }

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let bestIndex = -1;

  for (const token of tokens) {
    const idx = cleanContent.toLowerCase().indexOf(token);
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
      bestIndex = idx;
    }
  }

  // Not matched in content -> use fallback excerpt
  if (bestIndex === -1) {
    const text = fallbackExcerpt || cleanContent;
    return {
      snippet: text.slice(0, maxLength) + (text.length > maxLength ? '...' : ''),
      matchedInContent: false,
    };
  }

  // Found keyword in content! Extract surrounding context
  const start = Math.max(0, bestIndex - 60);
  const end = Math.min(cleanContent.length, start + maxLength);
  let snippet = cleanContent.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < cleanContent.length) snippet = snippet + '...';

  return { snippet, matchedInContent: true };
}

/* ── Helper: Calculate relevance score for search query ── */
function calculateRelevanceScore(article: any, query: string): number {
  if (!query.trim()) return 0;
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;

  const titleLower = (article.title || '').toLowerCase();
  const excerptLower = (article.excerpt || '').toLowerCase();
  const contentLower = (stripHtml(article.content || '')).toLowerCase();
  const authorLower = (article.author || article.authorName || '').toLowerCase();
  const tagsLower = Array.isArray(article.tags) ? article.tags.map((t: string) => t.toLowerCase()) : [];

  // Exact phrase matches
  if (titleLower.includes(q)) score += 180;
  if (excerptLower.includes(q)) score += 60;
  if (contentLower.includes(q)) score += 40;

  // Individual token matches
  for (const token of tokens) {
    if (titleLower.includes(token)) score += 50;
    if (tagsLower.some((t: string) => t.includes(token))) score += 30;
    if (authorLower.includes(token)) score += 25;
    if (excerptLower.includes(token)) score += 20;

    // Content match density
    const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const contentCount = (contentLower.match(regex) || []).length;
    score += Math.min(contentCount * 5, 50);
  }

  return score;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialRubrik = (searchParams.get('rubrik') as Rubrik) || 'semua';

  const [query, setQuery] = useState(initialQuery);
  const [selectedRubrik, setSelectedRubrik] = useState<Rubrik | 'semua'>(initialRubrik);
  const [sortBy, setSortBy] = useState<SortOption>('relevan');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch and sync
  useEffect(() => {
    const local = getAllActiveArticles();
    if (local && local.length > 0) {
      setAllArticles(local);
      setIsLoading(false);
    }

    fetch('/api/articles?status=PUBLISHED')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          db.syncArticlesFromRemote(data);
          setAllArticles(getAllActiveArticles());
        }
        setIsLoading(false);
      })
      .catch((e) => {
        console.warn('Search sync articles error:', e);
        setIsLoading(false);
      });
  }, []);

  // Sync URL search params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setQuery(q);
    const r = searchParams.get('rubrik') as Rubrik | null;
    if (r !== null) setSelectedRubrik(r);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedRubrik !== 'semua') params.set('rubrik', selectedRubrik);
    router.replace(`/cari?${params.toString()}`);
  };

  // Filter and Sort results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    let filtered = allArticles.filter((a) => {
      // 1. Rubrik filter
      const matchRubrik = selectedRubrik === 'semua' || a.rubrik === selectedRubrik;
      if (!matchRubrik) return false;

      // If no search query, match all in this rubrik
      if (!q) return true;

      // 2. Query search across Title, Excerpt, Content (Isi Berita), Author, Tags
      const titleLower = (a.title || '').toLowerCase();
      const excerptLower = (a.excerpt || '').toLowerCase();
      const contentLower = (stripHtml(a.content || '')).toLowerCase();
      const authorLower = (a.author || a.authorName || '').toLowerCase();
      const tagsLower = Array.isArray(a.tags) ? a.tags.map((t: string) => t.toLowerCase()) : [];

      return tokens.some(
        (token) =>
          titleLower.includes(token) ||
          excerptLower.includes(token) ||
          contentLower.includes(token) ||
          authorLower.includes(token) ||
          tagsLower.some((t: string) => t.includes(token))
      );
    });

    // 3. Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'relevan') {
        if (q) {
          const scoreB = calculateRelevanceScore(b, query);
          const scoreA = calculateRelevanceScore(a, query);
          if (scoreB !== scoreA) return scoreB - scoreA;
        }
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      }
      if (sortBy === 'terbaru') {
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      }
      if (sortBy === 'terlama') {
        return new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime();
      }
      if (sortBy === 'populer') {
        return (b.views || 0) - (a.views || 0);
      }
      return 0;
    });
  }, [query, selectedRubrik, sortBy, allArticles]);

  return (
    <main
      className="flex-1 w-full min-h-screen py-8 sm:py-12"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs / Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
            <Link href="/" className="hover:underline">Beranda</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-accent)' }}>Pencarian Berita</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Pencarian Artikel &amp; Arsip Berita
          </h1>
          <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Cari berita kampus, riset sains, opini kritis, atau kata kunci spesifik di seluruh arsip publikasi LPM Reaksi.
          </p>
        </div>

        {/* Search Input Box */}
        <div
          className="p-4 sm:p-6 mb-8 rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search size={18} className="absolute left-4 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, topik, nama reporter, atau kata di dalam naskah berita..."
              className="w-full pl-11 pr-24 py-3 text-sm font-medium rounded-none focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
                fontFamily: 'var(--font-body)',
              }}
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-muted)' }}
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Cari
              </button>
            </div>
          </form>

          {/* Rubrik Filter Chips */}
          <div className="mt-4 pt-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderTop: '1px solid var(--color-line)' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
              <SlidersHorizontal size={13} />
              <span>Rubrik:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedRubrik('semua')}
                className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{
                  fontFamily: 'var(--font-display)',
                  backgroundColor: selectedRubrik === 'semua' ? 'var(--color-accent)' : 'transparent',
                  color: selectedRubrik === 'semua' ? '#ffffff' : 'var(--color-foreground)',
                  border: `1px solid ${selectedRubrik === 'semua' ? 'var(--color-accent)' : 'var(--color-line)'}`,
                }}
              >
                Semua
              </button>
              {Object.entries(RUBRIK_META).map(([key, meta]) => {
                const isActive = selectedRubrik === key;
                const rubrikColor = RUBRIK_COLORS[key] || 'var(--color-accent)';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRubrik(key as Rubrik)}
                    className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      fontFamily: 'var(--font-display)',
                      backgroundColor: isActive ? rubrikColor : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--color-foreground)',
                      border: `1px solid ${isActive ? rubrikColor : 'var(--color-line)'}`,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter & Sorting Controls Toolbar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6"
          style={{ borderBottom: '2px solid var(--color-keyline)' }}
        >
          {/* Result Count and Query indicator */}
          <div className="flex items-center gap-2.5">
            <div style={{ width: 4, height: 18, background: 'var(--color-accent)', borderRadius: 1 }} />
            <h2
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              {results.length} Artikel Ditemukan
            </h2>
            {query && (
              <span className="text-xs px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 font-semibold">
                Kata kunci: &ldquo;{query}&rdquo;
              </span>
            )}
          </div>

          {/* Sorting Buttons + View Mode Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1 mr-1" style={{ color: 'var(--color-muted)' }}>
                <ArrowUpDown size={12} />
                <span>Urutkan:</span>
              </span>

              {/* Sort by: Paling Relevan */}
              <button
                type="button"
                onClick={() => setSortBy('relevan')}
                className={`px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-[2px] ${
                  sortBy === 'relevan' ? 'shadow-sm text-white' : 'hover:opacity-75'
                }`}
                style={{
                  backgroundColor: sortBy === 'relevan' ? 'var(--color-accent)' : 'var(--color-surface)',
                  border: `1px solid ${sortBy === 'relevan' ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  color: sortBy === 'relevan' ? '#ffffff' : 'var(--color-muted)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={11} />
                  Paling Relevan
                </span>
              </button>

              {/* Sort by: Terbaru */}
              <button
                type="button"
                onClick={() => setSortBy('terbaru')}
                className={`px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-[2px] ${
                  sortBy === 'terbaru' ? 'shadow-sm text-white' : 'hover:opacity-75'
                }`}
                style={{
                  backgroundColor: sortBy === 'terbaru' ? 'var(--color-accent)' : 'var(--color-surface)',
                  border: `1px solid ${sortBy === 'terbaru' ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  color: sortBy === 'terbaru' ? '#ffffff' : 'var(--color-muted)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  Terbaru
                </span>
              </button>

              {/* Sort by: Terlama */}
              <button
                type="button"
                onClick={() => setSortBy('terlama')}
                className={`px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-[2px] ${
                  sortBy === 'terlama' ? 'shadow-sm text-white' : 'hover:opacity-75'
                }`}
                style={{
                  backgroundColor: sortBy === 'terlama' ? 'var(--color-accent)' : 'var(--color-surface)',
                  border: `1px solid ${sortBy === 'terlama' ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  color: sortBy === 'terlama' ? '#ffffff' : 'var(--color-muted)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  Terlama
                </span>
              </button>

              {/* Sort by: Populer */}
              <button
                type="button"
                onClick={() => setSortBy('populer')}
                className={`px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-[2px] ${
                  sortBy === 'populer' ? 'shadow-sm text-white' : 'hover:opacity-75'
                }`}
                style={{
                  backgroundColor: sortBy === 'populer' ? 'var(--color-accent)' : 'var(--color-surface)',
                  border: `1px solid ${sortBy === 'populer' ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  color: sortBy === 'populer' ? '#ffffff' : 'var(--color-muted)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Flame size={11} />
                  Populer
                </span>
              </button>
            </div>

            {/* View Mode Toggle (Grid vs List) */}
            <div className="flex items-center border rounded-[2px] overflow-hidden ml-auto sm:ml-2" style={{ borderColor: 'var(--color-line)' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className="p-1.5 transition-colors"
                style={{
                  backgroundColor: viewMode === 'grid' ? 'var(--color-accent-pale)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-muted)',
                }}
                title="Tampilan Kisi (Grid)"
                aria-label="Tampilan Grid"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-1.5 transition-colors"
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--color-accent-pale)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-muted)',
                }}
                title="Tampilan Daftar (List)"
                aria-label="Tampilan List"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Container */}
        {results.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {results.map((article) => {
              const { snippet, matchedInContent } = extractMatchingSnippet(
                article.content || '',
                article.excerpt || '',
                query
              );
              const articleHref = getArticleUrl(article);
              const rubrikColor = RUBRIK_COLORS[article.rubrik] || 'var(--color-accent)';

              if (viewMode === 'list') {
                return (
                  <article
                    key={article.id}
                    className="p-4 sm:p-5 rounded-sm transition-all hover:translate-y-[-1px] group"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-line)',
                      boxShadow: 'var(--shadow-hard-sm)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {article.thumbnail && (
                        <Link
                          href={articleHref}
                          className="relative w-full sm:w-56 aspect-[16/10] overflow-hidden rounded-[2px] flex-shrink-0"
                        >
                          <img
                            src={article.thumbnail}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Rubrik Badge + Match Location Badge */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white rounded-[2px]"
                            style={{
                              backgroundColor: rubrikColor,
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {RUBRIK_META[article.rubrik as keyof typeof RUBRIK_META]?.label || article.rubrik}
                          </span>

                          {matchedInContent && query && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-[2px]">
                              <FileText size={10} />
                              Cocok di teks berita
                            </span>
                          )}
                        </div>

                        {/* Article Title with Highlights */}
                        <h3 className="text-base sm:text-lg font-bold leading-snug tracking-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                          <Link href={articleHref}>
                            <HighlightMatch text={article.title} query={query} />
                          </Link>
                        </h3>

                        {/* Snippet with Highlights */}
                        <p className="text-xs sm:text-[13px] leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                          <HighlightMatch text={snippet} query={query} />
                        </p>

                        {/* Meta: Author, Date, Read Time, Views */}
                        <div className="flex items-center gap-3 text-[11px] flex-wrap" style={{ color: 'var(--color-muted)' }}>
                          <span className="font-semibold text-foreground" style={{ color: 'var(--color-foreground)' }}>
                            {article.author || article.authorName || 'Redaksi LPM Reaksi'}
                          </span>
                          <span>&bull;</span>
                          <span suppressHydrationWarning>{formatDate(article.publishedAt || article.createdAt)}</span>
                          {article.readTime && (
                            <>
                              <span>&bull;</span>
                              <span>{article.readTime} menit baca</span>
                            </>
                          )}
                          {article.views !== undefined && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1" suppressHydrationWarning>
                                <Eye size={11} />
                                {article.views} pembaca
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }

              // Grid Mode
              return (
                <article
                  key={article.id}
                  className="flex flex-col rounded-sm overflow-hidden p-4 sm:p-5 transition-all hover:translate-y-[-2px] group"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-line)',
                    boxShadow: 'var(--shadow-hard-sm)',
                  }}
                >
                  {article.thumbnail && (
                    <Link
                      href={articleHref}
                      className="relative w-full aspect-[16/10] overflow-hidden rounded-[2px] mb-3 block"
                    >
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  )}

                  {/* Rubrik Badge + Match Location */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white rounded-[2px]"
                      style={{
                        backgroundColor: rubrikColor,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {RUBRIK_META[article.rubrik as keyof typeof RUBRIK_META]?.label || article.rubrik}
                    </span>

                    {matchedInContent && query && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-[2px]">
                        <FileText size={10} />
                        Cocok di isi berita
                      </span>
                    )}
                  </div>

                  {/* Article Title with Highlights */}
                  <h3 className="text-sm sm:text-base font-bold leading-snug tracking-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                    <Link href={articleHref}>
                      <HighlightMatch text={article.title} query={query} />
                    </Link>
                  </h3>

                  {/* Snippet with Highlights */}
                  <p className="text-xs leading-relaxed mb-4 line-clamp-3 flex-1" style={{ color: 'var(--color-muted)' }}>
                    <HighlightMatch text={snippet} query={query} />
                  </p>

                  {/* Meta: Author and Date */}
                  <div
                    className="pt-3 border-t flex items-center justify-between text-[10.5px]"
                    style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
                  >
                    <span className="truncate max-w-[130px] font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {article.author || article.authorName || 'Redaksi'}
                    </span>
                    <span suppressHydrationWarning>{formatDate(article.publishedAt || article.createdAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="text-center py-20 px-4 rounded-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px dashed var(--color-line)',
            }}
          >
            <Newspaper size={44} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--color-muted)' }} />
            <h3
              className="text-base font-bold uppercase mb-1.5"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Tidak Ada Berita Ditemukan
            </h3>
            <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>
              {query ? (
                <>
                  Tidak ada naskah yang cocok dengan kata kunci &ldquo;<strong className="text-foreground">{query}</strong>&rdquo;. Coba periksa ejaan, gunakan kata kunci yang lebih singkat, atau pilih opsi <strong>&quot;Semua Rubrik&quot;</strong>.
                </>
              ) : (
                'Belum ada artikel yang tersedia di rubrik ini.'
              )}
            </p>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedRubrik('semua');
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-[2px]"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-wall)' }}>
      <PageTitle title="Pencarian Berita" />
      <Header />
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: 'var(--color-wall)' }}>
          <p className="text-sm font-semibold animate-pulse" style={{ color: 'var(--color-muted)' }}>Memuat pencarian artikel...</p>
        </main>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}
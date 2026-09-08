'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/cards/ArticleCard';
import { getAllActiveArticles, RUBRIK_META, type Rubrik } from '@/lib/data';
import { Search, X, SlidersHorizontal, Newspaper } from 'lucide-react';
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

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialRubrik = searchParams.get('rubrik') as Rubrik | null;

  const [query, setQuery] = useState(initialQuery);
  const [selectedRubrik, setSelectedRubrik] = useState<Rubrik | 'semua'>(initialRubrik || 'semua');
  const [allArticles, setAllArticles] = useState<any[]>([]);

  useEffect(() => {
    setAllArticles(getAllActiveArticles());
    fetch('/api/articles?status=PUBLISHED')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          db.syncArticlesFromRemote(data);
          setAllArticles(getAllActiveArticles());
        }
      })
      .catch((e) => console.warn('Search sync articles error:', e));
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setQuery(q);
    const r = searchParams.get('rubrik') as Rubrik | null;
    if (r !== null) setSelectedRubrik(r);
  }, [searchParams]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allArticles.filter(a => {
      const matchQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.tags.some((t: string) => t.toLowerCase().includes(q));
      const matchRubrik = selectedRubrik === 'semua' || a.rubrik === selectedRubrik;
      return matchQuery && matchRubrik;
    });
  }, [query, selectedRubrik, allArticles]);

  return (
    <main
      className="flex-1 w-full min-h-screen py-8 sm:py-12"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumbs / Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
            <Link href="/" className="hover:underline">Beranda</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-accent)' }}>Pencarian</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Pencarian Artikel
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Temukan berita, opini, liputan investigasi, dan arsip artikel LPM Reaksi.
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
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ketik kata kunci, judul, penulis, atau topik..."
              className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-none focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
                fontFamily: 'var(--font-body)',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 p-1 rounded-full hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-muted)' }}
                aria-label="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Rubrik Filter Chips */}
          <div className="mt-4 pt-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderTop: '1px solid var(--color-line)' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
              <SlidersHorizontal size={13} />
              <span>Filter Rubrik:</span>
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

        {/* Results Metadata Bar */}
        <div
          className="flex items-center justify-between pb-3 mb-6"
          style={{ borderBottom: '2px solid var(--color-keyline)' }}
        >
          <div className="flex items-center gap-2">
            <div style={{ width: 4, height: 16, background: 'var(--color-accent)', borderRadius: 1 }} />
            <h2
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Hasil Pencarian
            </h2>
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
            {results.length} artikel ditemukan {query && <span>untuk &quot;{query}&quot;</span>}
          </span>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {results.map(article => (
              <div
                key={article.id}
                className="p-4 transition-all"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-line)',
                }}
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-20 px-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px dashed var(--color-line)',
            }}
          >
            <Newspaper size={40} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--color-muted)' }} />
            <h3
              className="text-base font-bold uppercase mb-1.5"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Tidak Ada Artikel Ditemukan
            </h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Coba periksa ejaan kata kunci Anda, pilih rubrik &quot;Semua&quot;, atau cari dengan istilah yang lebih umum.
            </p>
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
          <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>Memuat pencarian...</p>
        </main>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}
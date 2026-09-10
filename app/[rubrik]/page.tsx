'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/cards/ArticleCard';
import { RUBRIK_META, getAllActiveArticles, Article } from '@/lib/data';
import { db } from '@/lib/db/repository';
import { Newspaper, Loader2, ArrowLeft } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

function RubrikContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawRubrik = params.rubrik;
  const rubrikSlug = Array.isArray(rawRubrik) ? rawRubrik[0] : (rawRubrik as string) || '';
  const initialSub = searchParams.get('sub') || '';

  const [articles, setArticles] = useState<Article[]>([]);
  const [rubrikMeta, setRubrikMeta] = useState<{
    label: string;
    description: string;
    color: string;
    emoji: string;
    subRubriks: string[];
  } | null>(null);
  const [selectedSubRubrik, setSelectedSubRubrik] = useState<string>(initialSub);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedSubRubrik(initialSub);
  }, [initialSub]);

  useEffect(() => {
    if (!rubrikSlug) return;

    // Load rubrik meta
    const dynamicRubrik = db.getRubrikBySlug(rubrikSlug);
    if (dynamicRubrik) {
      setRubrikMeta({
        label: dynamicRubrik.name,
        description: dynamicRubrik.description,
        color: dynamicRubrik.color,
        emoji: dynamicRubrik.emoji,
        subRubriks: dynamicRubrik.subRubriks || [],
      });
    } else if ((RUBRIK_META as any)[rubrikSlug]) {
      const meta = (RUBRIK_META as any)[rubrikSlug];
      setRubrikMeta({
        label: meta.label,
        description: meta.description,
        color: meta.color,
        emoji: meta.emoji,
        subRubriks: [],
      });
    } else {
      setRubrikMeta({
        label: rubrikSlug.replace(/-/g, ' ').toUpperCase(),
        description: 'Arsip artikel dan liputan terkini',
        color: '#2563EB',
        emoji: '',
        subRubriks: [],
      });
    }

    // Load articles for this rubrik
    const all = getAllActiveArticles();
    const filtered = all.filter((a) => a.rubrik === rubrikSlug);
    setArticles(filtered);
    setLoading(false);

    // Live sync rubrik meta from API
    fetch('/api/rubriks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          const found = data.find((r: any) => r.slug === rubrikSlug);
          if (found) {
            let parsedSubs: string[] = [];
            const rawSubs = found.subRubriks || found.sub_rubriks;
            if (Array.isArray(rawSubs)) parsedSubs = rawSubs;
            else if (typeof rawSubs === 'string' && rawSubs.trim()) {
              try { parsedSubs = JSON.parse(rawSubs); } catch (_) {}
            }
            setRubrikMeta({
              label: found.name,
              description: found.description || '',
              color: found.color || '#2563EB',
              emoji: found.emoji || '',
              subRubriks: Array.isArray(parsedSubs) ? parsedSubs : [],
            });
          }
        }
      })
      .catch(() => {});

    // Live sync dari Supabase API
    fetch(`/api/articles?status=PUBLISHED&rubrik=${encodeURIComponent(rubrikSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          db.syncArticlesFromRemote(data);
          const liveFiltered = getAllActiveArticles().filter((a) => a.rubrik === rubrikSlug);
          setArticles(liveFiltered);
        }
      })
      .catch((err) => console.warn('Fetch rubrik articles error:', err));
  }, [rubrikSlug]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col transition-colors"
        style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
      >
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
            Memuat artikel rubrik...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = rubrikMeta || {
    label: 'Rubrik',
    description: 'Arsip artikel',
    color: '#2563EB',
    emoji: '',
    subRubriks: [],
  };

  const displayArticles = selectedSubRubrik
    ? articles.filter((a) => a.subRubrik?.toLowerCase() === selectedSubRubrik.toLowerCase())
    : articles;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title={meta.label} />
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
          <Link href="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <span style={{ color: meta.color }}>{meta.label}</span>
          {selectedSubRubrik && (
            <>
              <span>/</span>
              <span style={{ color: 'var(--color-foreground)' }}>{selectedSubRubrik}</span>
            </>
          )}
        </div>

        {/* Category Header */}
        <div
          className="pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          style={{ borderBottom: '2px solid var(--color-keyline)' }}
        >
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 6,
                height: 38,
                backgroundColor: meta.color,
                flexShrink: 0,
                borderRadius: 2,
              }}
            />
            <div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                {meta.label}
              </h1>
              <p
                className="text-xs sm:text-sm font-medium mt-1"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
              >
                {meta.description}
              </p>
            </div>
          </div>

          <div
            className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider self-start sm:self-auto rounded-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {displayArticles.length} Artikel
          </div>
        </div>

        {/* Sub-rubrik Filter Pills (Hanya jika rubrik memiliki breakdown) */}
        {meta.subRubriks && meta.subRubriks.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSubRubrik('')}
              className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all"
              style={{
                backgroundColor: !selectedSubRubrik ? meta.color : 'var(--color-surface)',
                color: !selectedSubRubrik ? '#ffffff' : 'var(--color-foreground)',
                border: '1px solid',
                borderColor: !selectedSubRubrik ? meta.color : 'var(--color-line)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Semua ({meta.label})
            </button>
            {meta.subRubriks.map((sub) => {
              const active = selectedSubRubrik.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubRubrik(active ? '' : sub)}
                  className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: active ? meta.color : 'var(--color-surface)',
                    color: active ? '#ffffff' : 'var(--color-foreground)',
                    border: '1px solid',
                    borderColor: active ? meta.color : 'var(--color-line)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        {/* Responsive Articles Grid */}
        {displayArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {displayArticles.map((article) => (
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
            className="text-center py-24 px-4 rounded-sm"
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
              Belum Ada Artikel
            </h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>
              {selectedSubRubrik
                ? `Belum ada artikel dalam kategori sub-rubrik "${selectedSubRubrik}".`
                : 'Belum ada artikel yang dipublikasikan dalam rubrik ini.'}
            </p>
            {selectedSubRubrik ? (
              <button
                type="button"
                onClick={() => setSelectedSubRubrik('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-white"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                <span>Lihat Semua {meta.label}</span>
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-white"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                <ArrowLeft size={13} />
                <span>Kembali ke Beranda</span>
              </Link>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function RubrikPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-wall)' }}>
          <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
        </div>
      }
    >
      <RubrikContent />
    </Suspense>
  );
}

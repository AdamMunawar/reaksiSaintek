'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import {
  getAllActiveArticles,
  formatDate,
  RUBRIK_META,
  Rubrik,
  Article,
  getArticleUrl,
} from '@/lib/data';
import { db } from '@/backend/db/repository';
import { RubrikItem, EPaperItem } from '@/backend/db/schema';
import { ArrowRight, Clock, TrendingUp, Sparkles, Newspaper, PenTool, BookOpen, Download } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────────────────────────────────────────── */

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

function RubrikLabel({ rubrik, size = 'sm' }: { rubrik: string; size?: 'sm' | 'md' }) {
  const dynamic = db.getRubrikBySlug(rubrik);
  const color = dynamic?.color || RUBRIK_COLORS[rubrik] || '#2563eb';
  const meta  = RUBRIK_META[rubrik as keyof typeof RUBRIK_META];
  return (
    <span
      style={{
        color,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size === 'md' ? '11px' : '10px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {meta?.label || rubrik}
    </span>
  );
}

function MetaRow({ author, date, readTime, className = '' }: {
  author?: string; date?: string; readTime?: number; className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 flex-wrap ${className}`}
      style={{ color: 'var(--color-muted)', fontSize: '11px', fontWeight: 500 }}
    >
      {author && <span style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>{author}</span>}
      {author && date && <span className="opacity-40">&bull;</span>}
      {date && <span>{date}</span>}
      {readTime && <><span className="opacity-40">&bull;</span><span className="flex items-center gap-1"><Clock size={10} />{readTime} mnt</span></>}
    </div>
  );
}

function SectionHeader({ title, href, color }: { title: string; href?: string; color?: string }) {
  return (
    <div
      className="flex items-center justify-between mb-5"
      style={{ borderBottom: '2px solid var(--color-keyline)', paddingBottom: '10px' }}
    >
      <div className="flex items-center gap-2.5">
        <div style={{ width: 4, height: 18, background: color || 'var(--color-accent)', flexShrink: 0, borderRadius: 1 }} />
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-foreground)',
        }}>
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '10px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
          }}
          className="hover:opacity-60 transition-opacity inline-flex items-center gap-1"
        >
          <span>Lihat Semua</span>
          <ArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}

function Rule() {
  return <div style={{ borderTop: '1px solid var(--color-line)', margin: '2.5rem 0' }} />;
}

function HorizCard({ article }: { article: any }) {
  return (
    <Link
      href={getArticleUrl(article)}
      className="group flex gap-3 transition-opacity hover:opacity-75"
      style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid var(--color-line)' }}
    >
      <div style={{ position: 'relative', width: 80, height: 60, flexShrink: 0, overflow: 'hidden', borderRadius: 3 }}>
        <img
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 min-w-0">
        <RubrikLabel rubrik={article.rubrik} />
        <h4 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '12.5px',
          lineHeight: 1.4,
          color: 'var(--color-foreground)',
          marginTop: 3,
        }} className="line-clamp-2">
          {article.title}
        </h4>
        <MetaRow date={formatDate(article.publishedAt)} className="mt-1.5" />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOMEPAGE CLIENT COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
interface HomePageClientProps {
  initialArticles?: Article[];
  initialEPapers?: EPaperItem[];
}

export default function HomePageClient({ initialArticles = [], initialEPapers = [] }: HomePageClientProps) {
  const [allArticles, setAllArticles] = useState<Article[]>(initialArticles);
  const [epapers, setEpapers] = useState<EPaperItem[]>(initialEPapers);
  const [rubriks, setRubriks] = useState<RubrikItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(initialArticles.length > 0 || initialEPapers.length > 0);
  const [topProgressActive, setTopProgressActive] = useState(initialArticles.length === 0);

  useEffect(() => {
    // Maksimal 0.5 detik (500ms) untuk loading awal garis gradasi
    const maxTimer = setTimeout(() => {
      setTopProgressActive(false);
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(maxTimer);
  }, []);

  useEffect(() => {
    // If initial articles were provided by SSR, sync them to local cache
    if (initialArticles.length > 0) {
      setAllArticles(initialArticles);
      setRubriks(db.getRubriks());
      setIsLoaded(true);
    } else {
      const loaded = getAllActiveArticles();
      if (loaded.length > 0) {
        setAllArticles(loaded);
        setIsLoaded(true);
      }
      setRubriks(db.getRubriks());
    }

    if (initialEPapers.length > 0) {
      setEpapers(initialEPapers);
    } else {
      setEpapers(db.getEPapers().slice(0, 6));
    }

    // Live background sync from PostgreSQL API
    fetch('/api/articles?status=PUBLISHED')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          db.syncArticlesFromRemote(data);
          setAllArticles(getAllActiveArticles());
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.warn('Fetch live homepage articles error:', err);
        setIsLoaded(true);
      });

    // Live background sync for epapers
    fetch('/api/epapers?limit=6')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEpapers(data);
        }
      })
      .catch((err) => {
        console.warn('Fetch live homepage epapers error:', err);
      });

    const sync = () => {
      setAllArticles(getAllActiveArticles());
      setRubriks(db.getRubriks());
      setEpapers(db.getEPapers().slice(0, 6));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [initialArticles, initialEPapers]);

  const latestFallback = allArticles;
  const featuredArticles = allArticles.filter((a) => a.isFeatured);
  const heroArticles = featuredArticles.length > 0 ? featuredArticles : latestFallback;
  const [mainHero, ...heroRest] = heroArticles;
  const radarArticles = heroRest.slice(0, 3);

  const kabarKampus = allArticles.filter((a) => a.rubrik === 'kabar-kampus').slice(0, 5);
  const saintek = allArticles.filter((a) => a.rubrik === 'saintek').slice(0, 4);
  const selisik = allArticles.filter((a) => a.rubrik === 'selisik').slice(0, 3);
  const opini = allArticles.filter((a) => a.rubrik === 'opini').slice(0, 3);
  const lensaKata = allArticles.filter((a) => a.rubrik === 'lensa-kata').slice(0, 3);
  const infografik = allArticles.filter((a) => a.rubrik === 'infografik').slice(0, 2);
  const trending = [...allArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  const latestNews = [...allArticles].slice(0, 6);

  const [saintekLead, ...saintekRest] = saintek;
  const [selisikLead, ...selisikRest] = selisik;

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors"
      style={{ background: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      {/* ── TOP GRADIENT PROGRESS BAR (MAX 0.5 DETIK) ── */}
      {topProgressActive && (
        <div
          className="fixed top-0 left-0 right-0 z-[999999] h-[2.5px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #60a5fa 100%)',
            boxShadow: '0 0 10px rgba(37, 99, 235, 0.8), 0 0 3px rgba(96, 165, 250, 0.9)',
          }}
        />
      )}

      <PageTitle />
      <Header />

      {/* ── BREAKING TICKER ── */}
      <div
        style={{
          background: 'var(--color-accent)',
          borderBottom: '2px solid var(--color-keyline)',
          overflow: 'hidden',
          padding: '8px 0',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <span style={{
            background: '#fff',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '9px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            flexShrink: 0,
          }}>
            Terkini
          </span>
          <div className="overflow-hidden flex-1" style={{ fontSize: '11.5px', fontWeight: 600, color: '#fff' }}>
            {latestFallback.length > 0 ? (
              <div className="ticker-track whitespace-nowrap">
                {[...latestFallback, ...latestFallback].map((a, i) => (
                  <Link
                    key={i}
                    href={getArticleUrl(a)}
                    className="inline-block mr-12 opacity-90 hover:opacity-100 hover:underline"
                  >
                    {a.title}
                  </Link>
                ))}
              </div>
            ) : (
              <span className="opacity-95">
                Portal Berita LPM Reaksi &bull; Tumbuh Berkembang Bersama &bull; Fakultas Sains &amp; Teknologi UIN Sunan Gunung Djati Bandung
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {allArticles.length === 0 && !isLoaded ? (
          null
        ) : allArticles.length === 0 ? (
          /* ── FRESH EMPTY STATE: ONLY SHOWN IF DB IS TRULY EMPTY ── */
          <section className="py-12 sm:py-16">
            <div
              className="p-8 sm:p-12 text-center rounded-sm space-y-6 max-w-3xl mx-auto"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-keyline)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent-pale)', color: 'var(--color-accent)' }}
              >
                <TrendingUp size={32} />
              </div>

              <div>
                <span
                  className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white inline-block mb-3"
                  style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                >
                  Portal Siap Beroperasi
                </span>
                <h1
                  className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Selamat Datang di Portal Berita LPM Reaksi
                </h1>
                <p className="text-xs sm:text-sm mt-2 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  Seluruh data visual awal telah dibersihkan. Portal ini kini berada dalam status bersih (0 naskah) dan siap menerbitkan liputan berita, riset saintek, serta opini kritis karya sivitas akademika FST UIN SGD Bandung.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                >
                  Masuk Meja Redaksi
                </Link>
                <Link
                  href="/kontributor/kirim"
                  className="px-6 py-3 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
                >
                  Kirim Naskah Kontributor
                </Link>
                <Link
                  href="/tentang"
                  className="px-6 py-3 text-xs font-bold uppercase tracking-wider hover:underline inline-flex items-center gap-1.5"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}
                >
                  <span>Tentang Redaksi</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Rubrik quick jump */}
              <div className="pt-6 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
                  Pilihan Rubrik Publikasi
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {rubriks.length > 0 ? (
                    <>
                      {rubriks
                        .filter((r) => r.slug !== 'epaper' && r.slug !== 'e-paper')
                        .map((r) => (
                          <Link
                            key={r.id || r.slug}
                            href={`/${r.slug}`}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase border hover:border-[var(--color-accent)] transition-colors"
                            style={{
                              backgroundColor: 'var(--color-wall)',
                              borderColor: 'var(--color-line)',
                              color: 'var(--color-foreground)',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {r.name}
                          </Link>
                        ))}
                      <Link
                        href="/e-paper"
                        className="px-2.5 py-1 text-[10px] font-bold uppercase border hover:border-[var(--color-accent)] transition-colors"
                        style={{
                          backgroundColor: 'var(--color-wall)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-foreground)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        E-Paper
                      </Link>
                    </>
                  ) : (
                    Object.entries(RUBRIK_META).map(([key, meta]) => (
                      <Link
                        key={key}
                        href={`/${key}`}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase border hover:border-[var(--color-accent)] transition-colors"
                        style={{
                          backgroundColor: 'var(--color-wall)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-foreground)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {meta.label}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════
                ZONE 1 — HERO + SIDEBAR
                ══════════════════════════════════════════════════════════════ */}
            <section className="pt-7 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
                {/* ── BIG LEAD STORY ── */}
                <div>
                  {mainHero && (
                    <Link
                      href={getArticleUrl(mainHero)}
                      className="group block mb-5"
                    >
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        overflow: 'hidden',
                        borderRadius: 4,
                        marginBottom: 16,
                      }}>
                        <img
                          src={mainHero.thumbnail}
                          alt={mainHero.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                        />
                        <div style={{ position: 'absolute', top: 12, left: 12 }}>
                          <span style={{
                            background: RUBRIK_COLORS[mainHero.rubrik] || 'var(--color-accent)',
                            color: '#fff',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '3px 10px',
                            borderRadius: 2,
                          }}>
                            {RUBRIK_META[mainHero.rubrik as keyof typeof RUBRIK_META]?.label}
                          </span>
                        </div>
                      </div>

                      <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 'clamp(20px, 2.5vw, 28px)',
                        lineHeight: 1.3,
                        color: 'var(--color-foreground)',
                        marginBottom: 10,
                        letterSpacing: '-0.01em',
                      }} className="group-hover:opacity-70 transition-opacity">
                        {mainHero.title}
                      </h1>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--color-muted)',
                        lineHeight: 1.7,
                        marginBottom: 10,
                      }} className="line-clamp-2">
                        {extractCleanExcerpt(mainHero.excerpt, mainHero.content)}
                      </p>
                      <MetaRow
                        author={mainHero.author}
                        date={formatDate(mainHero.publishedAt)}
                        readTime={mainHero.readTime}
                      />
                    </Link>
                  )}

                  {/* Sub-hero */}
                  {radarArticles.length > 0 && (
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5"
                      style={{ borderTop: '2px solid var(--color-keyline)' }}
                    >
                      {radarArticles.slice(0, 2).map((article) => (
                        <Link
                          key={article.id}
                          href={getArticleUrl(article)}
                          className="group block"
                        >
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 3, marginBottom: 10 }}>
                            <img
                              src={article.thumbnail}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          </div>
                          <RubrikLabel rubrik={article.rubrik} />
                          <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: '14px',
                            lineHeight: 1.4,
                            color: 'var(--color-foreground)',
                            marginTop: 5,
                            marginBottom: 6,
                          }} className="line-clamp-2 group-hover:opacity-70 transition-opacity">
                            {article.title}
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 6 }} className="line-clamp-2">
                            {extractCleanExcerpt(article.excerpt, article.content, 110)}
                          </p>
                          <MetaRow date={formatDate(article.publishedAt)} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── RIGHT SIDEBAR ── */}
                <div>
                  <SectionHeader title="Kabar Kampus" href="/kabar-kampus" color="#2563eb" />
                  <div>
                    {kabarKampus.map((item) => (
                      <Link
                        key={item.id}
                        href={getArticleUrl(item)}
                        className="group flex items-start gap-3 transition-opacity hover:opacity-70"
                        style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--color-line)' }}
                      >
                        <div style={{ position: 'relative', width: 70, height: 52, flexShrink: 0, overflow: 'hidden', borderRadius: 3 }}>
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            lineHeight: 1.4,
                            color: 'var(--color-foreground)',
                            marginBottom: 4,
                          }} className="line-clamp-2">
                            {item.title}
                          </h4>
                          <MetaRow date={formatDate(item.publishedAt)} />
                        </div>
                      </Link>
                    ))}
                  </div>

                  {trending.length > 0 && (
                    <div className="mt-6">
                      <SectionHeader title="Terpopuler" color="#dc2626" />
                      <div>
                        {trending.slice(0, 4).map((item, idx) => (
                          <Link
                            key={item.id}
                            href={getArticleUrl(item)}
                            className="group flex items-start gap-2.5 transition-opacity hover:opacity-70"
                            style={{ paddingBottom: 12, marginBottom: 12, borderBottom: idx < 3 ? '1px solid var(--color-line)' : 'none' }}
                          >
                            <span style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 800,
                              fontSize: '20px',
                              color: 'var(--color-line)',
                              lineHeight: 1,
                              flexShrink: 0,
                              width: 22,
                              textAlign: 'right',
                              marginTop: 2,
                            }}>
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <RubrikLabel rubrik={item.rubrik} />
                              <h4 style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: '12.5px',
                                lineHeight: 1.4,
                                color: 'var(--color-foreground)',
                                marginTop: 3,
                              }} className="line-clamp-2">
                                {item.title}
                              </h4>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {selisikLead && (
              <>
                <Rule />
                {/* ══════════════════════════════════════════════════════════════
                    ZONE 2 — SELISIK
                    ══════════════════════════════════════════════════════════════ */}
                <section className="pb-8">
                  <div style={{
                    background: '#0f1117',
                    border: '2px solid var(--color-keyline)',
                    overflow: 'hidden',
                    borderRadius: 4,
                  }}>
                    <div
                      className="flex items-center justify-between px-5 sm:px-7 py-3.5"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ width: 4, height: 18, background: '#dc2626', flexShrink: 0 }} />
                        <h2 style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '12px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#fff',
                        }}>Selisik</h2>
                        <span style={{
                          background: '#dc2626',
                          color: '#fff',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '9px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          padding: '2px 7px',
                        }}>
                          Investigasi
                        </span>
                      </div>
                      <Link
                        href="/selisik"
                        style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                        className="hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <span>Selengkapnya</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
                      <Link
                        href={getArticleUrl(selisikLead)}
                        className="group block p-5 sm:p-7"
                        style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 4, marginBottom: 18 }}>
                          <img
                            src={selisikLead.thumbnail}
                            alt={selisikLead.title}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-700"
                          />
                        </div>
                        <h3 style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: 'clamp(16px, 2vw, 22px)',
                          lineHeight: 1.3,
                          color: '#fff',
                          marginBottom: 10,
                          letterSpacing: '-0.01em',
                        }} className="group-hover:opacity-70 transition-opacity">
                          {selisikLead.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 12 }} className="line-clamp-2">
                          {extractCleanExcerpt(selisikLead.excerpt, selisikLead.content)}
                        </p>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          <span>{selisikLead.author}</span> &bull; <span>{selisikLead.readTime} menit baca</span> &bull; <span>{formatDate(selisikLead.publishedAt)}</span>
                        </div>
                      </Link>

                      <div className="p-5 sm:p-6 flex flex-col gap-0">
                        <p style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.35)',
                          marginBottom: 16,
                        }}>
                          Laporan Terkait
                        </p>
                        {selisikRest.slice(0, 2).map((item) => (
                          <Link
                            key={item.id}
                            href={getArticleUrl(item)}
                            className="group flex gap-3 transition-opacity hover:opacity-70"
                            style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                          >
                            <div style={{ position: 'relative', width: 80, height: 60, flexShrink: 0, overflow: 'hidden', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: '13px',
                                lineHeight: 1.4,
                                color: '#fff',
                                marginBottom: 6,
                              }} className="line-clamp-2">
                                {item.title}
                              </h4>
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                                {formatDate(item.publishedAt)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {(saintekLead || opini.length > 0) && (
              <>
                <Rule />
                {/* ══════════════════════════════════════════════════════════════
                    ZONE 3 — SAINTEK + OPINI
                    ══════════════════════════════════════════════════════════════ */}
                <section className="pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {saintekLead && (
                      <div>
                        <SectionHeader title="Saintek Update" href="/saintek" color="#0891b2" />
                        <Link href={getArticleUrl(saintekLead)} className="group block mb-5">
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 4, marginBottom: 12 }}>
                            <img
                              src={saintekLead.thumbnail}
                              alt={saintekLead.title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                            />
                            <div style={{ position: 'absolute', top: 10, left: 10 }}>
                              <span style={{ background: '#0891b2', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2 }}>
                                Saintek
                              </span>
                            </div>
                          </div>
                          <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            fontSize: '16px',
                            lineHeight: 1.4,
                            color: 'var(--color-foreground)',
                            marginBottom: 8,
                          }} className="line-clamp-2 group-hover:opacity-70 transition-opacity">
                            {saintekLead.title}
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 8 }} className="line-clamp-2">
                            {extractCleanExcerpt(saintekLead.excerpt, saintekLead.content)}
                          </p>
                          <MetaRow author={saintekLead.author} date={formatDate(saintekLead.publishedAt)} />
                        </Link>
                        {saintekRest.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: 14 }}>
                            {saintekRest.slice(0, 2).map((item) => (
                              <HorizCard key={item.id} article={item} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {opini.length > 0 && (
                      <div style={{ borderLeft: '1px solid var(--color-line)', paddingLeft: 'clamp(0px, 3%, 32px)' }} className="lg:pl-8">
                        <SectionHeader title="Opini &amp; Esai" href="/opini" color="#7c3aed" />
                        <div>
                          {opini.map((item, i) => (
                            <Link
                              key={item.id}
                              href={getArticleUrl(item)}
                              className="group block transition-opacity hover:opacity-70"
                              style={{ paddingBottom: 18, marginBottom: 18, borderBottom: i < opini.length - 1 ? '1px solid var(--color-line)' : 'none' }}
                            >
                              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <span style={{
                                  fontFamily: 'Georgia, serif',
                                  fontSize: '48px',
                                  lineHeight: 0.8,
                                  color: '#ddd6fe',
                                  flexShrink: 0,
                                  marginTop: 4,
                                }}>&ldquo;</span>
                                <div className="flex-1 min-w-0">
                                  <h4 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 800,
                                    fontSize: '14.5px',
                                    lineHeight: 1.4,
                                    color: 'var(--color-foreground)',
                                    marginBottom: 6,
                                  }} className="line-clamp-2">
                                    {item.title}
                                  </h4>
                                  <p style={{ fontSize: '12.5px', color: 'var(--color-muted)', lineHeight: 1.65, fontStyle: 'italic' }} className="line-clamp-2 mb-2.5">
                                    {extractCleanExcerpt(item.excerpt, item.content)}
                                  </p>
                                  <MetaRow author={item.author} readTime={item.readTime} />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {(lensaKata.length > 0 || infografik.length > 0 || latestNews.length > 0) && (
              <>
                <Rule />
                {/* ══════════════════════════════════════════════════════════════
                    ZONE 4 — LENSA KATA + DATA VISUAL + BERITA TERBARU
                    ══════════════════════════════════════════════════════════════ */}
                <section className="pb-8">
                  <div className={`grid grid-cols-1 ${
                    (lensaKata.length > 0 && infografik.length > 0)
                      ? 'lg:grid-cols-[1fr_1fr_260px]'
                      : (lensaKata.length > 0 || infografik.length > 0)
                      ? 'lg:grid-cols-[1fr_300px]'
                      : 'max-w-2xl'
                  } gap-8 lg:gap-10`}>
                    {/* LENSA KATA */}
                    {lensaKata.length > 0 && (
                      <div>
                        <SectionHeader title="Lensa Kata" href="/lensa-kata" color="#db2777" />
                        <div>
                          {lensaKata.map((item, i) => (
                            <Link
                              key={item.id}
                              href={getArticleUrl(item)}
                              className="group flex gap-3 transition-opacity hover:opacity-70"
                              style={{ paddingBottom: 16, marginBottom: 16, borderBottom: i < lensaKata.length - 1 ? '1px solid var(--color-line)' : 'none' }}
                            >
                              <div style={{ position: 'relative', width: 90, height: 70, flexShrink: 0, overflow: 'hidden', borderRadius: 3 }}>
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span style={{ color: '#db2777', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                  Karya Mahasiswa
                                </span>
                                <h4 style={{
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  lineHeight: 1.4,
                                  color: 'var(--color-foreground)',
                                  marginBottom: 5,
                                }} className="line-clamp-2">
                                  {item.title}
                                </h4>
                                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>
                                  Oleh {item.author}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DATA VISUAL (INFOGRAFIK POSTER A3/A4) */}
                    {infografik.length > 0 && (
                      <div style={{ borderLeft: lensaKata.length > 0 ? '1px solid var(--color-line)' : 'none' }} className={lensaKata.length > 0 ? 'lg:pl-8' : ''}>
                        <SectionHeader title="Data Visual" href="/infografik" color="#ea580c" />
                        <div className="space-y-6">
                          {infografik.map((item) => (
                            <Link
                              key={item.id}
                              href={getArticleUrl(item)}
                              className="group block"
                            >
                              {/* Poster Frame dengan Rasio Vertikal A3/A4 (3:4) */}
                              <div
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  aspectRatio: '3/4',
                                  overflow: 'hidden',
                                  borderRadius: 4,
                                  marginBottom: 10,
                                  backgroundColor: 'rgba(0,0,0,0.03)',
                                  border: '1px solid var(--color-line)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                              >
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                />
                                {/* Poster format badge */}
                                <div className="absolute top-2.5 left-2.5 z-10">
                                  <span
                                    style={{
                                      backgroundColor: '#ea580c',
                                      color: '#ffffff',
                                      fontFamily: 'var(--font-display)',
                                      fontWeight: 800,
                                      fontSize: '9px',
                                      letterSpacing: '0.08em',
                                      textTransform: 'uppercase',
                                      padding: '3px 7px',
                                      borderRadius: 2,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                    }}
                                  >
                                    <Sparkles size={10} />
                                    Poster A3/A4
                                  </span>
                                </div>
                              </div>
                              <h4 style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: '13px',
                                lineHeight: 1.4,
                                color: 'var(--color-foreground)',
                                marginBottom: 4,
                              }} className="line-clamp-2 group-hover:opacity-70 transition-opacity">
                                {item.title}
                              </h4>
                              <MetaRow date={formatDate(item.publishedAt)} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BERITA TERBARU */}
                    {latestNews.length > 0 && (
                      <div style={{ borderLeft: (lensaKata.length > 0 || infografik.length > 0) ? '1px solid var(--color-line)' : 'none' }} className={(lensaKata.length > 0 || infografik.length > 0) ? 'lg:pl-6' : ''}>
                        <SectionHeader title="Terbaru" color="var(--color-accent)" />
                        <div>
                          {latestNews.slice(0, 5).map((item, i) => (
                            <Link
                              key={item.id}
                              href={getArticleUrl(item)}
                              className="group block transition-opacity hover:opacity-70"
                              style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < 4 ? '1px solid var(--color-line)' : 'none' }}
                            >
                              <RubrikLabel rubrik={item.rubrik} />
                              <h4 style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: '12.5px',
                                lineHeight: 1.4,
                                color: 'var(--color-foreground)',
                                marginTop: 3,
                                marginBottom: 4,
                              }} className="line-clamp-2">
                                {item.title}
                              </h4>
                              <MetaRow date={formatDate(item.publishedAt)} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                ZONE: E-PAPER & TABLOID DIGITAL
                ══════════════════════════════════════════════════════════════ */}
            <Rule />
            <section className="pb-8">
              <SectionHeader
                title="E-Paper & Tabloid Mahasiswa"
                href="/e-paper"
                color="#2563eb"
              />

              {epapers.length > 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-keyline)',
                    boxShadow: 'var(--shadow-hard)',
                    borderRadius: 4,
                  }}
                  className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8"
                >
                  {/* FEATURED / LATEST EDITION */}
                  {(() => {
                    const latest = epapers[0];
                    const catColors: Record<string, string> = {
                      BULETIN: '#2563eb',
                      TABLOID: '#7c3aed',
                      MAJALAH: '#059669',
                    };
                    const catColor = catColors[latest.category] || '#2563eb';

                    return (
                      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        {/* 3D BOOK / MAGAZINE COVER THUMBNAIL */}
                        <div
                          className="relative flex-shrink-0 group cursor-pointer"
                          style={{
                            width: 'clamp(170px, 28vw, 210px)',
                            aspectRatio: '1/1.414',
                          }}
                        >
                          <Link href={`/e-paper?read=${latest.id}`} className="block w-full h-full">
                            <div
                              className="w-full h-full relative overflow-hidden rounded-r-md rounded-l-sm transition-transform duration-500 group-hover:-translate-y-1"
                              style={{
                                border: '1px solid rgba(0,0,0,0.15)',
                                boxShadow: '6px 10px 24px rgba(0,0,0,0.18), 2px 2px 6px rgba(0,0,0,0.1)',
                              }}
                            >
                              <img
                                src={latest.coverImage}
                                alt={latest.title}
                                className="w-full h-full object-cover"
                              />
                              {/* Magazine Spine Highlight */}
                              <div
                                className="absolute inset-y-0 left-0 w-3 pointer-events-none"
                                style={{
                                  background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.15) 100%)',
                                }}
                              />
                              {/* Read overlay on hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                                <BookOpen size={16} />
                                <span>Buka Reader</span>
                              </div>
                            </div>
                          </Link>
                        </div>

                        {/* EDITION DETAILS & ACTIONS */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                              <span
                                style={{
                                  backgroundColor: catColor,
                                  color: '#ffffff',
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 800,
                                  fontSize: '10px',
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  padding: '2px 8px',
                                  borderRadius: 2,
                                }}
                              >
                                {latest.category} TERBARU
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  color: 'var(--color-muted)',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {latest.edition}
                              </span>
                            </div>

                            <Link href={`/e-paper?read=${latest.id}`} className="group">
                              <h3
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 800,
                                  fontSize: 'clamp(18px, 2.2vw, 24px)',
                                  lineHeight: 1.3,
                                  color: 'var(--color-foreground)',
                                  marginBottom: 8,
                                }}
                                className="group-hover:text-blue-600 transition-colors"
                              >
                                {latest.title}
                              </h3>
                            </Link>

                            {latest.description && (
                              <p
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--color-muted)',
                                  lineHeight: 1.7,
                                  marginBottom: 16,
                                }}
                                className="line-clamp-3"
                              >
                                {latest.description}
                              </p>
                            )}

                            <div
                              className="flex items-center gap-4 text-xs font-semibold mb-6 flex-wrap"
                              style={{ color: 'var(--color-muted)' }}
                            >
                              {latest.publishedAt && (
                                <span>Terbit: {formatDate(latest.publishedAt)}</span>
                              )}
                              {latest.pageCount && latest.pageCount > 0 && (
                                <>
                                  <span>&bull;</span>
                                  <span>{latest.pageCount} Halaman</span>
                                </>
                              )}
                              {latest.fileSize && (
                                <>
                                  <span>&bull;</span>
                                  <span>{latest.fileSize}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-3 flex-wrap pt-2">
                            <Link
                              href={`/e-paper?read=${latest.id}`}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
                              style={{
                                backgroundColor: 'var(--color-accent)',
                                fontFamily: 'var(--font-display)',
                                boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)',
                              }}
                            >
                              <BookOpen size={14} />
                              <span>Baca E-Paper</span>
                            </Link>

                            {latest.pdfUrl && (
                              <a
                                href={latest.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                                style={{
                                  borderColor: 'var(--color-line)',
                                  color: 'var(--color-foreground)',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                <Download size={14} />
                                <span>Unduh PDF</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* PREVIOUS EDITIONS LIST */}
                  <div
                    className="border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between"
                    style={{ borderColor: 'var(--color-line)' }}
                  >
                    <div>
                      <h4
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '11px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--color-muted)',
                          marginBottom: 14,
                        }}
                      >
                        Arsip Terbitan Lainnya
                      </h4>

                      {epapers.length > 1 ? (
                        <div className="space-y-3.5">
                          {epapers.slice(1, 4).map((prev) => (
                            <Link
                              key={prev.id}
                              href={`/e-paper?read=${prev.id}`}
                              className="group flex gap-3.5 items-center p-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                            >
                              <div
                                className="relative w-12 aspect-[3/4] flex-shrink-0 overflow-hidden rounded shadow-sm border"
                                style={{ borderColor: 'var(--color-line)' }}
                              >
                                <img
                                  src={prev.coverImage}
                                  alt={prev.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: 'var(--color-accent)',
                                    fontFamily: 'var(--font-display)',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    display: 'block',
                                  }}
                                >
                                  {prev.edition}
                                </span>
                                <h5
                                  style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    color: 'var(--color-foreground)',
                                    lineHeight: 1.35,
                                  }}
                                  className="line-clamp-2 group-hover:text-blue-600 transition-colors"
                                >
                                  {prev.title}
                                </h5>
                                <span style={{ fontSize: '10.5px', color: 'var(--color-muted)' }}>
                                  {formatDate(prev.publishedAt)}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-muted)] leading-relaxed italic">
                          Belum ada arsip edisi sebelumnya. Terbitan berikutnya akan otomatis diarsipkan di sini.
                        </p>
                      )}
                    </div>

                    <Link
                      href="/e-paper"
                      className="mt-5 inline-flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border border-blue-600/30 hover:bg-blue-600/5 rounded transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <span>Jelajahi Semua Edisi</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                /* EMPTY STATE / EDITORIAL TEASER IF NO EPAPERS YET */
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-keyline)',
                    boxShadow: 'var(--shadow-hard)',
                    borderRadius: 4,
                  }}
                  className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}
                    >
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '16px',
                          color: 'var(--color-foreground)',
                          marginBottom: 4,
                        }}
                      >
                        Penerbitan Tabloid & Buletin Digital Mahasiswa
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)', maxWidth: 540 }}>
                        LPM Reaksi menerbitkan produk jurnalistik berkala cetak & digital dalam format majalah/tabloid A4 interaktif. Redaksi dapat mengunggah edisi baru melalui panel admin.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/e-paper"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-sm transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                  >
                    <span>Kunjungi Laman E-Paper</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>

            <Rule />

            {/* ══════════════════════════════════════════════════════════════
                ZONE 5 — CTA KIRIM TULISAN
                ══════════════════════════════════════════════════════════════ */}
            <section className="pb-14">
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-keyline)',
                  boxShadow: 'var(--shadow-hard)',
                  borderRadius: 4,
                  padding: 'clamp(24px, 5%, 40px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                }}
                className="md:flex-row md:justify-between"
              >
                <div className="text-center md:text-left">
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'var(--color-accent)',
                      color: '#fff',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '9px',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      marginBottom: 10,
                      borderRadius: 2,
                    }}
                  >
                    Ruang Kontributor
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '18px',
                      color: 'var(--color-foreground)',
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    Punya Opini, Liputan, atau Karya Sastra?
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.7, maxWidth: 480 }}>
                    LPM Reaksi membuka ruang seluas-luasnya bagi sivitas akademika FST UIN SGD untuk bersuara dan berkarya.
                  </p>
                </div>
                <Link
                  href="/kontributor/kirim"
                  className="flex items-center gap-2 flex-shrink-0 transition-all hover:translate-y-[-2px]"
                  style={{
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '12px 24px',
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
                  }}
                >
                  Kirim Tulisan <ArrowRight size={14} />
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

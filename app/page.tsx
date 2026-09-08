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
} from '@/lib/data';
import { db } from '@/lib/db/repository';
import { RubrikItem } from '@/lib/db/schema';
import { ArrowRight, Clock, TrendingUp, Sparkles, Newspaper, PenTool, BookOpen } from 'lucide-react';
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
      href={`/artikel/${article.slug}`}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HOMEPAGE COMPONENT
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function HomePage() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [rubriks, setRubriks] = useState<RubrikItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = getAllActiveArticles();
    setAllArticles(loaded);
    setRubriks(db.getRubriks());
    setIsLoaded(true);

    const sync = () => {
      setAllArticles(getAllActiveArticles());
      setRubriks(db.getRubriks());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

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
      <PageTitle />
      <Header />

      {/* â”€â”€ BREAKING TICKER â”€â”€ */}
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
                    href={`/artikel/${a.slug}`}
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
        {allArticles.length === 0 ? (
          /* â”€â”€ FRESH EMPTY STATE: READY FOR PUBLISHING â”€â”€ */
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
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                ZONE 1 â€” HERO + SIDEBAR
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <section className="pt-7 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
                {/* â”€â”€ BIG LEAD STORY â”€â”€ */}
                <div>
                  {mainHero && (
                    <Link
                      href={`/artikel/${mainHero.slug}`}
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
                          href={`/artikel/${article.slug}`}
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

                {/* â”€â”€ RIGHT SIDEBAR â”€â”€ */}
                <div>
                  <SectionHeader title="Kabar Kampus" href="/kabar-kampus" color="#2563eb" />
                  <div>
                    {kabarKampus.map((item) => (
                      <Link
                        key={item.id}
                        href={`/artikel/${item.slug}`}
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
                            href={`/artikel/${item.slug}`}
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
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    ZONE 2 â€” SELISIK
                    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                        href={`/artikel/${selisikLead.slug}`}
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
                            href={`/artikel/${item.slug}`}
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
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    ZONE 3 â€” SAINTEK + OPINI
                    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <section className="pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {saintekLead && (
                      <div>
                        <SectionHeader title="Saintek Update" href="/saintek" color="#0891b2" />
                        <Link href={`/artikel/${saintekLead.slug}`} className="group block mb-5">
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
                              href={`/artikel/${item.slug}`}
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
                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    ZONE 4 â€” LENSA KATA + DATA VISUAL + BERITA TERBARU
                    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                              href={`/artikel/${item.slug}`}
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

                    {/* DATA VISUAL */}
                    {infografik.length > 0 && (
                      <div style={{ borderLeft: lensaKata.length > 0 ? '1px solid var(--color-line)' : 'none' }} className={lensaKata.length > 0 ? 'lg:pl-8' : ''}>
                        <SectionHeader title="Data Visual" href="/infografik" color="#ea580c" />
                        <div>
                          {infografik.map((item) => (
                            <Link
                              key={item.id}
                              href={`/artikel/${item.slug}`}
                              className="group block mb-4"
                            >
                              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', borderRadius: 3, marginBottom: 8 }}>
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                />
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
                              href={`/artikel/${item.slug}`}
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

            <Rule />

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                ZONE 5 â€” CTA KIRIM TULISAN
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
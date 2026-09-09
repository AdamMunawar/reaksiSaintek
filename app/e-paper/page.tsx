'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { PageTitle } from '@/components/ui/PageTitle';
import { db } from '@/lib/db/repository';
import { EPaperItem } from '@/lib/db/schema';
import {
  Newspaper,
  BookOpen,
  Download,
  Eye,
  Calendar,
  Layers,
  FileText,
  X,
  Maximize2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Share2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua Terbitan' },
  { id: 'BULETIN', label: 'Buletin' },
  { id: 'TABLOID', label: 'Tabloid' },
  { id: 'MAJALAH', label: 'Majalah' },
] as const;

export default function EPaperPublicPage() {
  const [epapers, setEpapers] = useState<EPaperItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [readingItem, setReadingItem] = useState<EPaperItem | null>(null);

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const readId = urlParams.get('read');
      if (readId) {
        const found = db.getEPaperById(readId);
        if (found) setReadingItem(found);
      }
    }
  }, []);

  const loadData = () => {
    setEpapers(db.getEPapers());
    fetch('/api/epapers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEpapers(data);
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const readId = urlParams.get('read');
            if (readId) {
              const found = data.find((e: EPaperItem) => e.id === readId);
              if (found) setReadingItem(found);
            }
          }
        }
      })
      .catch(() => {});
  };

  const filteredEpapers = epapers.filter((e) => {
    if (selectedCategory === 'ALL') return true;
    return e.category === selectedCategory;
  });

  const latestEdition = epapers.length > 0 ? epapers[0] : null;

  const handleDownload = (item: EPaperItem) => {
    db.incrementEPaperDownloads(item.id);
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}>
      <PageTitle title="E-Paper & Tabloid Mahasiswa" />
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
          <Link href="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-foreground)' }}>E-Paper &amp; Tabloid</span>
        </div>

        {/* Hero Section */}
        <div
          className="p-6 sm:p-10 rounded-sm mb-10"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white mb-3" style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
              <Newspaper size={13} />
              <span>Publikasi Cetak &amp; Digital Mahasiswa</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              E-Paper &amp; Tabloid LPM Reaksi
            </h1>
            <p className="text-xs sm:text-sm mt-3 leading-relaxed" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
              Arsip digital resmi buletin berkala, tabloid investigasi kampus, dan majalah sains karya sivitas akademika FST UIN Sunan Gunung Djati Bandung. Nikmati kemudahan membaca langsung secara interaktif atau unduh berkas PDF kualitas cetak.
            </p>
          </div>
        </div>

        {/* Featured Latest Edition */}
        {latestEdition && (
          <div
            className="p-6 sm:p-8 rounded-sm mb-12 flex flex-col md:flex-row gap-6 sm:gap-8 items-center"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-sm)',
            }}
          >
            {/* Cover preview */}
            <div className="w-48 sm:w-56 h-68 sm:h-80 flex-shrink-0 relative overflow-hidden border shadow-lg group cursor-pointer" onClick={() => setReadingItem(latestEdition)}>
              <img
                src={latestEdition.coverImage}
                alt={latestEdition.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <Eye size={18} />
                <span>Baca Edisi Ini</span>
              </div>
            </div>

            {/* Edition Info */}
            <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-600 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    Terbitan Terbaru
                  </span>
                  <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase bg-blue-600 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {latestEdition.category}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--color-muted)]">
                    {latestEdition.edition}
                  </span>
                </div>

                <h2
                  className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  {latestEdition.title}
                </h2>

                {latestEdition.description && (
                  <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {latestEdition.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReadingItem(latestEdition)}
                  className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white inline-flex items-center gap-2 shadow-sm transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                >
                  <BookOpen size={15} />
                  <span>Baca PDF Interaktif</span>
                </button>

                <a
                  href={latestEdition.pdfUrl}
                  download={`${latestEdition.title}.pdf`}
                  onClick={() => handleDownload(latestEdition)}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border inline-flex items-center gap-2 transition-opacity hover:opacity-75"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
                >
                  <Download size={15} />
                  <span>Unduh PDF ({latestEdition.fileSize || 'Kualitas Cetak'})</span>
                </a>
              </div>

              <div className="text-[11px] text-[var(--color-muted)] flex items-center justify-center md:justify-start gap-4 pt-1">
                <span>Tanggal Terbit: <strong>{latestEdition.publishedAt}</strong></span>
                <span>&bull;</span>
                <span>Telah diunduh <strong>{latestEdition.downloads || 0}</strong> kali</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b flex-wrap" style={{ borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-foreground)] border hover:opacity-75'
                }`}
                style={{
                  borderColor: 'var(--color-line)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-semibold text-[var(--color-muted)]">
            Total {filteredEpapers.length} Edisi
          </span>
        </div>

        {/* Archive Editions Grid */}
        {filteredEpapers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredEpapers.map((item) => (
              <div
                key={item.id}
                className="group rounded-sm overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-line)',
                  boxShadow: 'var(--shadow-hard-sm)',
                }}
              >
                {/* Cover Thumbnail */}
                <div
                  className="w-full aspect-[3/4] overflow-hidden relative cursor-pointer bg-black/5"
                  onClick={() => setReadingItem(item)}
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase bg-black/70 text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Info & CTA */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--color-muted)] block">
                      {item.edition}
                    </span>
                    <h3
                      className="text-xs font-bold uppercase line-clamp-2 mt-1"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-3 mt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--color-line)' }}>
                    <button
                      type="button"
                      onClick={() => setReadingItem(item)}
                      className="text-[11px] font-extrabold uppercase text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <span>Baca</span>
                      <ArrowRight size={11} />
                    </button>

                    <a
                      href={item.pdfUrl}
                      download={`${item.title}.pdf`}
                      onClick={() => handleDownload(item)}
                      className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] border"
                      style={{ borderColor: 'var(--color-line)' }}
                      title="Unduh Berkas PDF"
                    >
                      <Download size={13} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="p-12 text-center rounded-sm space-y-3"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-blue-500/10 text-blue-600">
              <Newspaper size={24} />
            </div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Belum Ada E-Paper dalam Kategori Ini
            </h3>
            <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto leading-relaxed">
              Seluruh data awal telah dibersihkan. Edisi buletin dan tabloid PDF terbaru akan segera diterbitkan melalui meja redaksi LPM Reaksi.
            </p>
          </div>
        )}
      </main>

      {/* Interactive PDF Reader Modal */}
      {readingItem && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm animate-fade-in">
          {/* Reader Top Bar */}
          <div className="p-3 sm:p-4 bg-zinc-900 border-b border-zinc-800 text-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-blue-600 text-white rounded-none flex-shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold truncate">
                  {readingItem.title}
                </h3>
                <span className="text-[10px] text-zinc-400 block">
                  {readingItem.edition} &bull; Pembaca Digital PDF LPM Reaksi
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={readingItem.pdfUrl}
                download={`${readingItem.title}.pdf`}
                onClick={() => handleDownload(readingItem)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Unduh PDF</span>
              </a>

              <button
                type="button"
                onClick={() => setReadingItem(null)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-none"
                title="Tutup Pembaca"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* PDF Viewer Frame */}
          <div className="flex-1 w-full h-full bg-zinc-950 p-2 sm:p-4 flex flex-col items-center justify-center">
            <iframe
              src={`${readingItem.pdfUrl}#toolbar=1&navpanes=0`}
              title={readingItem.title}
              className="w-full h-full flex-1 rounded-sm border border-zinc-800 shadow-2xl bg-white"
            />
            <div className="mt-2 text-center text-xs text-zinc-400 flex items-center justify-center gap-3 flex-wrap">
              <span>Kendala memuat pratinjau?</span>
              <a
                href={readingItem.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1"
              >
                <span>Buka PDF di Tab Baru</span>
                <ExternalLink size={11} />
              </a>
              <span>&bull;</span>
              <a
                href={`https://docs.google.com/viewer?url=${encodeURIComponent(readingItem.pdfUrl)}&embedded=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-medium inline-flex items-center gap-1"
              >
                <span>Buka via Google Docs Viewer</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

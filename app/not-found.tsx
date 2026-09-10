'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Search, Home, ArrowLeft, Compass, Newspaper } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

import { db } from '@/backend/db/repository';
import type { RubrikItem } from '@/backend/db/schema';
import { useEffect } from 'react';

interface QuickLink {
  name: string;
  href: string;
}

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [rubriks, setRubriks] = useState<QuickLink[]>([
    { name: 'Beranda', href: '/' },
    { name: 'E-Paper', href: '/e-paper' },
  ]);

  useEffect(() => {
    try {
      const dynamicRubriks = db.getRubriks();
      if (Array.isArray(dynamicRubriks) && dynamicRubriks.length > 0) {
        const filtered = dynamicRubriks
          .filter((r: RubrikItem) => r.slug !== 'epaper' && r.slug !== 'e-paper')
          .slice(0, 6)
          .map((r: RubrikItem) => ({ name: r.name, href: `/${r.slug}` }));
        if (filtered.length > 0) {
          setRubriks(filtered);
        }
      }
    } catch (_) {}
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="404 — Halaman Tidak Ditemukan" />
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 py-12 sm:py-20">
        <div
          className="max-w-xl w-full p-8 sm:p-12 text-center relative transition-all duration-300 rounded-[2px]"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          {/* Registration Ticks (LPM Reaksi print aesthetic) */}
          <div className="absolute -top-[2px] -left-[2px] w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: 'var(--color-keyline)' }} />
          <div className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: 'var(--color-keyline)' }} />
          <div className="absolute -bottom-[2px] -left-[2px] w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: 'var(--color-keyline)' }} />
          <div className="absolute -bottom-[2px] -right-[2px] w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: 'var(--color-keyline)' }} />

          {/* Stencil Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider mb-5 text-white rounded-[2px]"
            style={{
              backgroundColor: 'var(--color-accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Newspaper size={12} />
            <span>Warta Redaksi</span>
          </div>

          {/* Big 404 in Accent Blue */}
          <h1
            className="text-6xl sm:text-8xl font-black tracking-tighter leading-none mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent)',
            }}
          >
            404
          </h1>

          <h2
            className="text-lg sm:text-xl font-black uppercase tracking-tight mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Halaman atau Artikel Tidak Ditemukan
          </h2>

          <p className="text-xs sm:text-sm mb-8 leading-relaxed max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            Naskah berita yang Anda cari mungkin telah diarsipkan, dipindahkan ke rubrik lain, atau tautan alamat yang dimasukkan belum tepat.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearch} className="mb-8 max-w-md mx-auto">
            <div
              className="flex items-center border overflow-hidden p-1 rounded-[2px] transition-colors focus-within:border-[var(--color-accent)]"
              style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}
            >
              <Search size={15} className="ml-3 mr-2 text-[var(--color-muted)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul berita, topik, atau kata kunci..."
                className="w-full bg-transparent text-xs sm:text-sm outline-none px-2 py-1 text-[var(--color-foreground)] placeholder-[var(--color-muted)]"
              />
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold uppercase text-white transition-all shrink-0 hover:opacity-90 cursor-pointer rounded-[2px]"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                Cari
              </button>
            </div>
          </form>

          {/* Quick Rubrik Links */}
          <div className="mb-8 pt-6 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5 text-[var(--color-muted)]" style={{ fontFamily: 'var(--font-display)' }}>
              <Compass size={12} />
              <span>Jelajahi Rubrik Populer:</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rubriks.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] rounded-[2px]"
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 rounded-[2px]"
              style={{
                backgroundColor: 'var(--color-accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Home size={13} />
              <span>Ke Beranda Utama</span>
            </Link>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors hover:border-[var(--color-keyline)] rounded-[2px] cursor-pointer"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <ArrowLeft size={13} />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

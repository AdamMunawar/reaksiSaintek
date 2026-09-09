'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Search, Home, ArrowLeft, Compass, Newspaper } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const rubriks = [
    { name: 'Kabar Kampus', href: '/kabar-kampus' },
    { name: 'Saintek Update', href: '/saintek' },
    { name: 'Opini Mahasiswa', href: '/opini' },
    { name: 'Feature & Humanis', href: '/feature' },
    { name: 'Lensa Kata', href: '/lensa-kata' },
    { name: 'E-Paper & Tabloid', href: '/e-paper' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="404 — Halaman Tidak Ditemukan" />
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 py-16 sm:py-24">
        <div
          className="max-w-xl w-full p-8 sm:p-12 text-center rounded-2xl border transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-line)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-6 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Newspaper size={13} />
            <span>Warta Tidak Ditemukan</span>
          </div>

          {/* Big Error Code */}
          <h1
            className="text-7xl sm:text-8xl font-black tracking-tighter leading-none mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </h1>

          <h2
            className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-3"
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
              className="flex items-center rounded-xl border overflow-hidden p-1.5 transition-colors focus-within:border-[var(--color-accent)]"
              style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}
            >
              <Search size={16} className="ml-3 mr-2 text-[var(--color-muted)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul berita, topik, atau kata kunci..."
                className="w-full bg-transparent text-xs sm:text-sm outline-none px-2 py-1.5 text-[var(--color-foreground)] placeholder-[var(--color-muted)]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold uppercase rounded-lg text-white transition-all shrink-0 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                Cari
              </button>
            </div>
          </form>

          {/* Quick Rubrik Links */}
          <div className="mb-8 pt-6 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5 text-[var(--color-muted)]">
              <Compass size={13} />
              <span>Jelajahi Rubrik Populer:</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rubriks.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    borderColor: 'var(--color-line)',
                    color: 'var(--color-foreground)',
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-transform hover:-translate-y-0.5 shadow-md"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <Home size={14} />
              <span>Ke Beranda Utama</span>
            </Link>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <ArrowLeft size={14} />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

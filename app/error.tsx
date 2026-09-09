'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AlertTriangle, RefreshCw, Home, Compass } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log masked error for internal analytics if needed
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Terjadi Kendala Memuat Halaman" />
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 py-16 sm:py-24">
        <div
          className="max-w-lg w-full p-8 sm:p-12 text-center rounded-2xl border transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-line)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Icon Badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-inner">
            <AlertTriangle size={32} />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Kendala Sistem Sementara
          </h1>

          <p className="text-xs sm:text-sm mb-8 leading-relaxed max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            Permintaan Anda belum dapat diproses secara optimal saat ini. Tim telah mencatat kondisi ini untuk segera dipulihkan.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-transform hover:-translate-y-0.5 shadow-md cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <RefreshCw size={14} />
              <span>Coba Muat Ulang</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Home size={14} />
              <span>Ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error logged securely
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Terjadi Kendala Sistem" />
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 py-12 sm:py-20">
        <div
          className="max-w-lg w-full p-8 sm:p-12 text-center relative transition-all duration-300 rounded-[2px]"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          {/* Registration Corner Ticks */}
          <div className="absolute -top-[2px] -left-[2px] w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: 'var(--color-keyline)' }} />
          <div className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: 'var(--color-keyline)' }} />
          <div className="absolute -bottom-[2px] -left-[2px] w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: 'var(--color-keyline)' }} />
          <div className="absolute -bottom-[2px] -right-[2px] w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: 'var(--color-keyline)' }} />

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider mb-5 text-white rounded-[2px]"
            style={{ backgroundColor: '#dc2626', fontFamily: 'var(--font-display)' }}
          >
            <AlertTriangle size={12} />
            <span>Pemberitahuan Sistem</span>
          </div>

          <h1
            className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Kendala Sistem Sementara
          </h1>

          <p className="text-xs sm:text-sm mb-8 leading-relaxed max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            Permintaan Anda belum dapat diproses secara optimal saat ini. Tim redaksi teknologi telah mencatat kondisi ini untuk segera dipulihkan.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 rounded-[2px] cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <RefreshCw size={13} />
              <span>Coba Muat Ulang</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors hover:border-[var(--color-keyline)] rounded-[2px]"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Home size={13} />
              <span>Ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

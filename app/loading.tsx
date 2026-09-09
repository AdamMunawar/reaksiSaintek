import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function GlobalLoading() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors"
      style={{ background: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse">
        {/* Top Loading Indicator Status */}
        <div
          className="p-4 rounded-md flex items-center justify-between gap-4 border mb-8"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-line)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <p className="text-xs sm:text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
              Memuat Halaman LPM Reaksi...
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
            <span className="animate-spin inline-block">⏳</span> Menyiapkan konten...
          </div>
        </div>

        {/* Hero Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="w-full aspect-[16/9] rounded-lg bg-gray-200 dark:bg-slate-800" />
            <div className="w-24 h-4 rounded bg-blue-200 dark:bg-blue-900/50" />
            <div className="w-3/4 h-7 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="w-full h-3.5 rounded bg-gray-100 dark:bg-slate-800/60" />
              <div className="w-5/6 h-3.5 rounded bg-gray-100 dark:bg-slate-800/60" />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="w-36 h-5 rounded bg-gray-200 dark:bg-slate-800 mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <div className="w-20 h-16 rounded bg-gray-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-16 h-3 rounded bg-blue-100 dark:bg-blue-950" />
                  <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
                  <div className="w-2/3 h-3 rounded bg-gray-100 dark:bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function GlobalLoading() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors"
      style={{ background: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      {/* ── TOP GRADIENT PROGRESS BAR ── */}
      <div
        className="fixed top-0 left-0 right-0 z-[999999] h-[2.5px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #60a5fa 100%)',
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.8), 0 0 3px rgba(96, 165, 250, 0.9)',
        }}
      />

      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-pulse">
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

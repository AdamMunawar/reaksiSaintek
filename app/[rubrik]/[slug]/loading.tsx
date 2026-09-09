import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ArticleLoading() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors animate-pulse"
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

      {/* Top Reading Tracker Skeleton */}
      <div className="h-1 w-full bg-blue-100 dark:bg-blue-950" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-16 h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-800" />
          <div className="w-24 h-4 rounded bg-blue-100 dark:bg-blue-900/40" />
        </div>

        {/* Rubrik Badge Skeleton */}
        <div className="w-28 h-6 rounded bg-blue-600/20 mb-4" />

        {/* Article Title Skeleton (2 lines) */}
        <div className="space-y-3 mb-6">
          <div className="w-full h-8 sm:h-10 rounded-md bg-gray-300 dark:bg-slate-700" />
          <div className="w-4/5 h-8 sm:h-10 rounded-md bg-gray-300 dark:bg-slate-700" />
        </div>

        {/* Excerpt Skeleton */}
        <div className="w-11/12 h-5 rounded bg-gray-200 dark:bg-slate-800 mb-6" />

        {/* Author & Meta Row Skeleton */}
        <div className="flex items-center gap-4 py-4 mb-8 border-y" style={{ borderColor: 'var(--color-line)' }}>
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-slate-700" />
          <div className="space-y-1.5 flex-1">
            <div className="w-36 h-4 rounded bg-gray-300 dark:bg-slate-700" />
            <div className="w-48 h-3 rounded bg-gray-200 dark:bg-slate-800" />
          </div>
          <div className="w-20 h-8 rounded bg-gray-200 dark:bg-slate-800" />
        </div>

        {/* Cover Image Skeleton (16:9) */}
        <div className="w-full aspect-[16/9] rounded-lg bg-gray-300 dark:bg-slate-800 mb-8" />

        {/* Article Content Paragraph Skeletons */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-5/6 h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-4/6 h-4 rounded bg-gray-200 dark:bg-slate-800" />

          <div className="py-6">
            <div className="w-full h-24 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40" />
          </div>

          <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="w-3/4 h-4 rounded bg-gray-200 dark:bg-slate-800" />
        </div>
      </main>

      <Footer />
    </div>
  );
}

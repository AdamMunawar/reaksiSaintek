'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}>
      <PageTitle title="Halaman Tidak Ditemukan" />
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div
          className="max-w-md w-full p-8 text-center rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-accent)' }}>
            <FileQuestion size={30} />
          </div>

          <h1
            className="text-3xl font-black uppercase tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            404
          </h1>

          <h2
            className="text-base font-bold uppercase tracking-wide mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Artikel atau halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tautan yang dimasukkan salah.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
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

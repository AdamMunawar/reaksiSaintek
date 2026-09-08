'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log masked/sanitized error to server or internal logger if available
    // Raw error stack is intentionally not rendered in DOM for security
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <div
        className="max-w-md w-full p-8 text-center rounded-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-keyline)',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
          <AlertCircle size={26} />
        </div>

        <h2
          className="text-lg font-extrabold uppercase tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Terjadi Kendala Memuat Halaman
        </h2>

        <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Maaf, sistem sedang mengalami kendala sementara. Silakan coba memuat ulang halaman atau kembali ke beranda.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            <RefreshCw size={13} />
            <span>Muat Ulang</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-75"
            style={{
              border: '1px solid var(--color-line)',
              color: 'var(--color-foreground)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Home size={13} />
            <span>Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

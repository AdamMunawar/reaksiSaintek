'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { Loader2 } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Mengautentikasi akun...');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Masukkan alamat email akun Anda.');
      return;
    }
    if (!password.trim()) {
      setError('Masukkan kata sandi akun.');
      return;
    }

    setIsLoading(true);
    setError('');
    setLoadingText('Memverifikasi kredensial akun...');

    try {
      const res = await loginWithEmail(email.trim(), password);
      if (res.success) {
        setLoadingText('Menyiapkan Meja Redaksi...');
        const isContributor = email.toLowerCase().includes('kontributor');
        setTimeout(() => {
          if (isContributor) {
            router.push('/kontributor');
          } else {
            router.push('/admin');
          }
        }, 400);
      } else {
        setIsLoading(false);
        setError(res.error || 'Email atau kata sandi tidak valid. Pastikan akun telah terdaftar di meja redaksi.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Gagal menghubungi server autentikasi. Silakan periksa koneksi Anda.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Masuk Meja Redaksi" />
      {/* Top branding bar */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
          Portal Internal
        </span>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--color-muted)' }}>
          LPM Reaksi Meja Redaksi
        </span>
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-md p-6 sm:p-8 rounded-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-keyline)',
          boxShadow: 'var(--shadow-hard-lg)',
        }}
      >
        {/* Logo & title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Image
              src="/images/reaksi.png"
              alt="LPM Reaksi"
              width={140}
              height={36}
              className="h-8 w-auto mx-auto object-contain dark:hidden"
            />
            <Image
              src="/images/reaksi-dark.png"
              alt="LPM Reaksi"
              width={140}
              height={36}
              className="h-8 w-auto mx-auto object-contain hidden dark:block"
            />
          </div>
          <h1
            className="text-lg font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Masuk ke Meja Redaksi &amp; Kontributor
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Silakan pilih peran akun atau masuk dengan kredensial Anda.
          </p>
        </div>

        {/* Form login manual */}
        <form onSubmit={handleLogin} className="space-y-4 mb-2">
          {error && (
            <div className="p-3 text-xs font-medium rounded-none bg-red-500/10 text-red-600 border border-red-500/30">
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              Email Akun
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="misal: redaksi@reaksi.id"
                required
                className="w-full px-3 py-2.5 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi..."
              required
              className="w-full px-3 py-2.5 text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--color-accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses Masuk...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        {/* Informational notice */}
        <div
          className="mt-6 pt-4 border-t text-center text-[11px] leading-relaxed"
          style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
        >
          <p>
            Belum memiliki akun redaksi atau kontributor? Silakan hubungi Sekretariat LPM Reaksi FST UIN Sunan Gunung Djati Bandung.
          </p>
        </div>

        {/* Animated Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div
              className="p-6 max-w-sm w-full rounded-sm border shadow-2xl text-center space-y-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-keyline)',
                boxShadow: 'var(--shadow-hard-lg)',
              }}
            >
              <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-[var(--color-accent)]">
                <Loader2 size={26} className="animate-spin" />
              </div>
              <div>
                <h3
                  className="text-sm font-extrabold uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  {loadingText}
                </h3>
                <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                  Mohon tunggu sebentar, sesi Anda sedang dipersiapkan...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
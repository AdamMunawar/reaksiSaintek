'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { Article, ArticleStatus } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  PenTool,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlusCircle,
  User as UserIcon,
  LogOut,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Loader2,
} from 'lucide-react';


const STATUS_BADGES: Record<ArticleStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draf', bg: '#6b7280', text: '#ffffff' },
  PENDING_REVIEW: { label: 'Menunggu Review', bg: '#ea580c', text: '#ffffff' },
  PUBLISHED: { label: 'Diterbitkan', bg: '#059669', text: '#ffffff' },
  REJECTED: { label: 'Ditolak', bg: '#dc2626', text: '#ffffff' },
  REVISION: { label: 'Perlu Revisi', bg: '#d97706', text: '#ffffff' },
};

export default function ContributorDashboard() {
  const router = useRouter();
  const { user, logout, isLoggedIn, role } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState<ArticleStatus | 'ALL'>('ALL');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      router.push('/login');
    }, 500);
  };

  useEffect(() => {
    // If not logged in, auto login as demo kontributor for seamless testing or redirect
    if (!isLoggedIn) {
      // Auto assign demo kontributor
      // or redirect to login
    }
    loadArticles();
  }, [user]);

  const loadArticles = () => {
    // If user is logged in as contributor, get their articles, or all contributor articles
    const all = db.getArticles();
    if (user?.id) {
      const myArticles = all.filter((a) => a.authorId === user.id || a.authorRole === 'kontributor');
      setArticles(myArticles);
    } else {
      const contributorArticles = all.filter((a) => a.authorRole === 'kontributor');
      setArticles(contributorArticles);
    }
  };

  const filteredArticles = filter === 'ALL'
    ? articles
    : articles.filter((a) => a.status === filter);

  const stats = {
    total: articles.length,
    pending: articles.filter((a) => a.status === 'PENDING_REVIEW').length,
    published: articles.filter((a) => a.status === 'PUBLISHED').length,
    revision: articles.filter((a) => a.status === 'REVISION').length,
    draft: articles.filter((a) => a.status === 'DRAFT').length,
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Portal Kontributor" />
      {/* Top Navigation */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '2px solid var(--color-keyline)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/reaksi.png"
                  alt="LPM Reaksi"
                  width={110}
                  height={28}
                  className="h-6 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/images/reaksi-dark.png"
                  alt="LPM Reaksi"
                  width={110}
                  height={28}
                  className="h-6 w-auto object-contain hidden dark:block"
                />
              </Link>
              <span
                className="text-[10px] font-extrabold uppercase px-2 py-0.5 text-white"
                style={{ backgroundColor: '#ea580c', fontFamily: 'var(--font-display)' }}
              >
                Portal Kontributor
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/kontributor/kirim"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                <PlusCircle size={14} />
                <span>Kirim Naskah</span>
              </Link>

              <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: 'var(--color-line)' }}>
                <span className="text-xs font-bold hidden md:inline" style={{ color: 'var(--color-foreground)' }}>
                  {user?.name || 'Kontributor Tamu'}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:opacity-70 transition-opacity"
                  title="Keluar dari Ruang Kontributor"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#ea580c', fontFamily: 'var(--font-display)' }}>
              Ruang Penulis Mahasiswa
            </span>
            <h1
              className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Selamat Datang, {user?.name?.split(' ')[0] || 'Kontributor'}
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
              {user?.institution || 'Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung'}
            </p>
          </div>

          <Link
            href="/kontributor/kirim"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            <PenTool size={15} />
            <span>Tulis &amp; Kirim Naskah Baru</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div
            onClick={() => setFilter('ALL')}
            className={`p-4 rounded-sm cursor-pointer transition-all ${filter === 'ALL' ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-muted)' }}>
              Total Naskah
            </span>
            <span className="text-2xl font-extrabold mt-1 block" style={{ fontFamily: 'var(--font-display)' }}>
              {stats.total}
            </span>
          </div>

          <div
            onClick={() => setFilter('PENDING_REVIEW')}
            className={`p-4 rounded-sm cursor-pointer transition-all ${filter === 'PENDING_REVIEW' ? 'ring-2 ring-orange-500' : ''}`}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block text-orange-500">
              Menunggu Review
            </span>
            <span className="text-2xl font-extrabold mt-1 block text-orange-500" style={{ fontFamily: 'var(--font-display)' }}>
              {stats.pending}
            </span>
          </div>

          <div
            onClick={() => setFilter('PUBLISHED')}
            className={`p-4 rounded-sm cursor-pointer transition-all ${filter === 'PUBLISHED' ? 'ring-2 ring-emerald-600' : ''}`}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">
              Diterbitkan (Live)
            </span>
            <span className="text-2xl font-extrabold mt-1 block text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>
              {stats.published}
            </span>
          </div>

          <div
            onClick={() => setFilter('REVISION')}
            className={`p-4 rounded-sm cursor-pointer transition-all ${filter === 'REVISION' ? 'ring-2 ring-amber-600' : ''}`}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-600">
              Perlu Revisi
            </span>
            <span className="text-2xl font-extrabold mt-1 block text-amber-600" style={{ fontFamily: 'var(--font-display)' }}>
              {stats.revision}
            </span>
          </div>
        </div>

        {/* Articles Table & Status List */}
        <div
          className="rounded-sm p-4 sm:p-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--color-line)' }}>
            <h2
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Riwayat Naskah yang Anda Kirim ({filteredArticles.length})
            </h2>
            <div className="flex gap-1">
              {(['ALL', 'PENDING_REVIEW', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    filter === st ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : STATUS_BADGES[st as ArticleStatus]?.label || st}
                </button>
              ))}
            </div>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((art) => {
                const badge = STATUS_BADGES[art.status] || STATUS_BADGES.DRAFT;
                return (
                  <div
                    key={art.id}
                    className="p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5"
                          style={{ backgroundColor: badge.bg, color: badge.text, fontFamily: 'var(--font-display)' }}
                        >
                          {badge.label}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                        >
                          Rubrik: {art.rubrik}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          Â· Diajukan {art.createdAt?.split('T')[0]}
                        </span>
                      </div>

                      <h3
                        className="text-sm sm:text-base font-bold line-clamp-1"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                      >
                        {art.title}
                      </h3>

                      <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {art.excerpt}
                      </p>

                      {art.reviewNotes && (
                        <div
                          className="mt-2 p-2.5 text-xs rounded-none flex items-start gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        >
                          <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold block">Catatan Meja Redaksi:</span>
                            <span>{art.reviewNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {art.status === 'PUBLISHED' && (
                        <Link
                          href={`/artikel/${art.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:underline"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          <span>Lihat di Web</span>
                          <ExternalLink size={13} />
                        </Link>
                      )}

                      <Link
                        href={`/kontributor/kirim?id=${art.id}`}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity"
                        style={{
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-foreground)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        Edit Naskah
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText size={36} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--color-muted)' }} />
              <p className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                Belum ada naskah pada status ini.
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Kirimkan karya opini, esai, atau liputan sains Anda ke redaksi sekarang.
              </p>
              <Link
                href="/kontributor/kirim"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                <PlusCircle size={14} />
                <span>Kirim Naskah Pertama Anda</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Logout Loading Modal Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="p-6 max-w-sm w-full rounded-sm border shadow-2xl text-center space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-lg)',
            }}
          >
            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-600">
              <Loader2 size={26} className="animate-spin" />
            </div>
            <div>
              <h3
                className="text-sm font-extrabold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                Mengakhiri Sesi Kontributor...
              </h3>
              <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                Membersihkan sesi dan mengembalikan ke halaman masuk...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
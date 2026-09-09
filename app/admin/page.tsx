'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { Article, ArticleStatus } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  PenTool,
  ArrowUpRight,
  Shield,
  BookOpen,
  Sparkles,
  ExternalLink,
  Users,
  ArrowRight,
} from 'lucide-react';
import { getArticleUrl } from '@/lib/data';


const STATUS_BADGES: Record<ArticleStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draf', bg: '#6b7280', text: '#ffffff' },
  PENDING_REVIEW: { label: 'Menunggu Review', bg: '#ea580c', text: '#ffffff' },
  PUBLISHED: { label: 'Terbit Live', bg: '#059669', text: '#ffffff' },
  REJECTED: { label: 'Ditolak', bg: '#dc2626', text: '#ffffff' },
  REVISION: { label: 'Perlu Revisi', bg: '#d97706', text: '#ffffff' },
};

export default function AdminDashboardPage() {
  const { user, role, canReview, canManagePages, canWriteArticle, isReadOnlyArticles } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

  useEffect(() => {
    loadData();
  }, [isReadOnlyArticles]);

  const loadData = () => {
    const all = db.getArticles();
    if (isReadOnlyArticles) {
      const published = all.filter((a) => a.status === 'PUBLISHED');
      setArticles(published);
      setPendingArticles([]);
    } else {
      setArticles(all);
      setPendingArticles(all.filter((a) => a.status === 'PENDING_REVIEW'));
    }
  };

  const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0);
  const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard Redaksi" />
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
            LPM Reaksi Content Management System
          </span>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Dashboard Utama
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Selamat datang, <strong>{user?.name || 'Redaksi'}</strong>. Ringkasan aktivitas dan publikasi konten portal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canWriteArticle ? (
            <Link
              href="/admin/artikel/tulis"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <PenTool size={14} />
              <span>Tulis Artikel Baru</span>
            </Link>
          ) : role === 'pemred' ? (
            <Link
              href="/admin/review"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-orange-600 hover:bg-orange-700 transition-opacity"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <CheckCircle2 size={14} />
              <span>Buka Meja Review</span>
            </Link>
          ) : (
            <Link
              href="/admin/halaman"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-700 transition-opacity"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <BookOpen size={14} />
              <span>Kelola Halaman &amp; Redaksi</span>
            </Link>
          )}
        </div>
      </div>

      {/* Pending Review Alert Banner (For Pemred / Superadmin) */}
      {canReview && pendingArticles.length > 0 && (
        <div
          className="p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
          style={{
            backgroundColor: 'rgba(234, 88, 12, 0.08)',
            borderColor: '#ea580c',
          }}
        >
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400" style={{ fontFamily: 'var(--font-display)' }}>
                {pendingArticles.length} Naskah Menunggu Review &amp; Approval
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-foreground)' }}>
                Ada naskah dari kontributor/tim liputan yang siap ditinjau dan diterbitkan ke web publik.
              </p>
            </div>
          </div>
          <Link
            href="/admin/review"
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white self-start sm:self-auto"
            style={{ backgroundColor: '#ea580c', fontFamily: 'var(--font-display)' }}
          >
            <span>Buka Review Hub</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
            <span>Total Artikel</span>
            <FileText size={16} />
          </div>
          <span className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            {articles.length}
          </span>
          <span className="text-[11px] block mt-1" style={{ color: 'var(--color-muted)' }}>
            Semua rubrik &amp; status
          </span>
        </div>

        <div
          className="p-5 rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 text-emerald-600">
            <span>Artikel Terbit</span>
            <CheckCircle2 size={16} />
          </div>
          <span className="text-3xl font-extrabold text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>
            {publishedCount}
          </span>
          <span className="text-[11px] block mt-1" style={{ color: 'var(--color-muted)' }}>
            Aktif tampil di portal
          </span>
        </div>

        <div
          className="p-5 rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 text-orange-500">
            <span>Menunggu Review</span>
            <Clock size={16} />
          </div>
          <span className="text-3xl font-extrabold text-orange-500" style={{ fontFamily: 'var(--font-display)' }}>
            {pendingArticles.length}
          </span>
          <span className="text-[11px] block mt-1" style={{ color: 'var(--color-muted)' }}>
            Antrean kurasi redaksi
          </span>
        </div>

        <div
          className="p-5 rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 text-blue-600">
            <span>Total Pembaca</span>
            <Eye size={16} />
          </div>
          <span className="text-3xl font-extrabold text-blue-600" style={{ fontFamily: 'var(--font-display)' }}>
            {totalViews.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] block mt-1" style={{ color: 'var(--color-muted)' }}>
            Akumulasi tayangan artikel
          </span>
        </div>
      </div>

      {/* Quick Action Hubs for Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canWriteArticle ? (
          <Link
            href="/admin/artikel/tulis"
            className="p-5 rounded-sm transition-transform hover:-translate-y-0.5 flex items-start gap-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-none">
              <PenTool size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Tulis &amp; Publikasi Artikel
              </h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                Buat berita kampus, liputan investigasi, atau opini sains baru.
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/admin/artikel"
            className="p-5 rounded-sm transition-transform hover:-translate-y-0.5 flex items-start gap-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-none">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Arsip Artikel Terbit
              </h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                Lihat daftar dan statistik naskah yang telah terbit secara publik.
              </p>
            </div>
          </Link>
        )}

        {canReview && (
          <Link
            href="/admin/review"
            className="p-5 rounded-sm transition-transform hover:-translate-y-0.5 flex items-start gap-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-none">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Review Meja Redaksi
              </h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                Tinjau, beri catatan revisi, dan setujui naskah kontributor.
              </p>
            </div>
          </Link>
        )}

        {canManagePages && (
          <Link
            href="/admin/halaman"
            className="p-5 rounded-sm transition-transform hover:-translate-y-0.5 flex items-start gap-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-none">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Kelola Halaman Lembaga
              </h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                Ubah profil Tentang Kami, Visi &amp; Misi, dan Susunan Redaksi.
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Recent Articles Table */}
      <div
        className="p-6 rounded-sm"
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
            Artikel Terbaru
          </h2>
          <Link
            href="/admin/artikel"
            className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] hover:underline inline-flex items-center gap-1.5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>Lihat Semua Artikel</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-3">
          {articles.slice(0, 6).map((art) => {
            const badge = STATUS_BADGES[art.status] || STATUS_BADGES.DRAFT;
            return (
              <div
                key={art.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  border: '1px solid var(--color-line)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[9px] font-extrabold uppercase px-1.5 py-0.2"
                      style={{ backgroundColor: badge.bg, color: badge.text, fontFamily: 'var(--font-display)' }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600" style={{ fontFamily: 'var(--font-display)' }}>
                      {art.rubrik}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      &bull; {art.authorName}
                    </span>
                  </div>
                  <h4
                    className="text-xs sm:text-sm font-bold truncate"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                  >
                    {art.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {art.status === 'PUBLISHED' && (
                    <Link
                      href={getArticleUrl(art)}
                      target="_blank"
                      className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Web</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                  {!isReadOnlyArticles && (
                    <Link
                      href={`/admin/artikel/${art.id}/edit`}
                      className="px-2.5 py-1 text-xs font-bold uppercase border hover:opacity-70"
                      style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
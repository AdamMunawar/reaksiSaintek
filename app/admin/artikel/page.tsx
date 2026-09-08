'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { Article, ArticleStatus } from '@/lib/db/schema';
import { RUBRIK_META } from '@/lib/data';
import {
  PlusCircle,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { PageTitle } from '@/components/ui/PageTitle';

const STATUS_BADGES: Record<ArticleStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draf', bg: '#6b7280', text: '#ffffff' },
  PENDING_REVIEW: { label: 'Menunggu Review', bg: '#ea580c', text: '#ffffff' },
  PUBLISHED: { label: 'Terbit Live', bg: '#059669', text: '#ffffff' },
  REJECTED: { label: 'Ditolak', bg: '#dc2626', text: '#ffffff' },
  REVISION: { label: 'Perlu Revisi', bg: '#d97706', text: '#ffffff' },
};

export default function AdminArticlesPage() {
  const { user, role, canPublish, canWriteArticle, canEditArticle, canDeleteArticle, isReadOnlyArticles } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [availableRubriks, setAvailableRubriks] = useState<Array<{ slug: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'ALL'>(isReadOnlyArticles ? 'PUBLISHED' : 'ALL');
  const [rubrikFilter, setRubrikFilter] = useState<string>('semua');
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isReadOnlyArticles) {
      setStatusFilter('PUBLISHED');
    }
  }, [isReadOnlyArticles]);

  useEffect(() => {
    const rList = db.getRubriks();
    if (rList && rList.length > 0) {
      setAvailableRubriks(rList.map((r) => ({ slug: r.slug, name: r.name })));
    } else {
      setAvailableRubriks(
        Object.entries(RUBRIK_META).map(([key, meta]) => ({
          slug: key,
          name: meta.label,
        }))
      );
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [search, statusFilter, rubrikFilter, isReadOnlyArticles]);

  const loadArticles = () => {
    const effectiveStatus = isReadOnlyArticles ? 'PUBLISHED' : statusFilter;
    const list = db.getArticles({
      search: search || undefined,
      status: effectiveStatus,
      rubrik: rubrikFilter !== 'semua' ? rubrikFilter : undefined,
    });
    setArticles(list);

    // Live sync from PostgreSQL API
    const params = new URLSearchParams();
    if (effectiveStatus && effectiveStatus !== 'ALL') params.set('status', effectiveStatus);
    if (rubrikFilter && rubrikFilter !== 'semua') params.set('rubrik', rubrikFilter);
    if (search) params.set('search', search);

    fetch(`/api/articles?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          db.syncArticlesFromRemote(data);
          setArticles(data);
        }
      })
      .catch((err) => console.warn('Sync admin articles error:', err));
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    const toDeleteId = articleToDelete.id;
    db.deleteArticle(toDeleteId);
    setArticleToDelete(null);
    setNotification({
      type: 'success',
      message: `Artikel "${articleToDelete.title}" berhasil dihapus.`,
    });

    try {
      await fetch(`/api/articles/${toDeleteId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete server article error:', e);
    }
    loadArticles();
    setTimeout(() => setNotification(null), 3000);
  };

  const handleQuickStatus = async (id: string, newStatus: ArticleStatus) => {
    db.updateArticleStatus(id, newStatus);
    loadArticles();
    try {
      await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Quick update server article error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Kelola Artikel" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Manajemen Artikel
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            {isReadOnlyArticles
              ? 'Mode Superadmin: Akses arsip artikel terbit (Hanya Baca / Read-Only).'
              : 'Kelola seluruh berita, liputan, opini, dan publikasi portal LPM Reaksi.'}
          </p>
        </div>

        {canWriteArticle && (
          <Link
            href="/admin/artikel/tulis"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            <PlusCircle size={15} />
            <span>Tulis Artikel Baru</span>
          </Link>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-none flex items-center gap-2.5 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        className="p-4 rounded-sm space-y-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
        }}
      >
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul artikel, penulis, atau topik..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
              }}
            />
          </div>

          {/* Rubrik filter */}
          <select
            value={rubrikFilter}
            onChange={(e) => setRubrikFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs font-bold uppercase focus:outline-none"
            style={{
              backgroundColor: 'var(--color-wall)',
              color: 'var(--color-foreground)',
              border: '1px solid var(--color-line)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <option value="semua">Semua Rubrik</option>
            {availableRubriks.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--color-line)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'var(--color-muted)' }}>
            Status:
          </span>
          {isReadOnlyArticles ? (
            <span
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Terbit Live (Superadmin Read-Only)
            </span>
          ) : (
            (['ALL', 'PUBLISHED', 'PENDING_REVIEW', 'DRAFT', 'REVISION', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === st
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-wall)] text-[var(--color-foreground)] hover:opacity-75'
                }`}
                style={{ border: '1px solid var(--color-line)', fontFamily: 'var(--font-display)' }}
              >
                {st === 'ALL' ? 'Semua' : STATUS_BADGES[st as ArticleStatus]?.label || st}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Articles Table */}
      <div
        className="rounded-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-keyline)',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-wall)', borderBottom: '1px solid var(--color-line)' }}>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Artikel &amp; Penulis</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Rubrik</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Statistik</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {articles.length > 0 ? (
                articles.map((art) => {
                  const badge = STATUS_BADGES[art.status] || STATUS_BADGES.DRAFT;
                  return (
                    <tr key={art.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      {/* Title & Author */}
                      <td className="p-3.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          {art.coverImage && (
                            <img
                              src={art.coverImage}
                              alt=""
                              className="w-12 h-10 object-cover rounded-none border flex-shrink-0"
                              style={{ borderColor: 'var(--color-line)' }}
                            />
                          )}
                          <div>
                            <Link
                              href={isReadOnlyArticles ? `/artikel/${art.slug}` : `/admin/artikel/${art.id}/edit`}
                              target={isReadOnlyArticles ? '_blank' : undefined}
                              className="font-bold text-xs hover:underline line-clamp-1 block"
                              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                            >
                              {art.title}
                            </Link>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                              Oleh: <span className="font-semibold">{art.authorName}</span> &bull; {art.publishedAt || art.createdAt?.split('T')[0]}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rubrik */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 border" style={{ borderColor: 'var(--color-line)' }}>
                          {art.rubrik}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-[10px] text-[var(--color-muted)]">
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {art.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {art.readTime || 1}m
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5"
                          style={{ backgroundColor: badge.bg, color: badge.text, fontFamily: 'var(--font-display)' }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 whitespace-nowrap text-right space-x-2">
                        {art.status === 'PUBLISHED' && (
                          <Link
                            href={`/artikel/${art.slug}`}
                            target="_blank"
                            className="p-1.5 inline-flex items-center gap-1 text-emerald-600 hover:opacity-70 font-semibold"
                            title="Buka di Website"
                          >
                            <ExternalLink size={14} />
                            {isReadOnlyArticles && <span className="text-[10px]">Baca</span>}
                          </Link>
                        )}

                        {canEditArticle && (
                          <Link
                            href={`/admin/artikel/${art.id}/edit`}
                            className="p-1.5 inline-block text-blue-600 hover:opacity-70"
                            title="Edit Artikel"
                          >
                            <Edit size={14} />
                          </Link>
                        )}

                        {canPublish && art.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleQuickStatus(art.id, 'PUBLISHED')}
                            className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-600 text-white hover:opacity-80"
                            title="Terbitkan Langsung"
                          >
                            Terbitkan
                          </button>
                        )}

                        {canDeleteArticle && (
                          <button
                            onClick={() => setArticleToDelete(art)}
                            className="p-1.5 text-red-600 hover:opacity-70"
                            title="Hapus Artikel"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-16 text-center space-y-2" style={{ color: 'var(--color-muted)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-foreground)' }}>
                      Belum Ada Artikel di Meja Redaksi
                    </p>
                    <p className="text-[11px] max-w-sm mx-auto">
                      Seluruh data dummy visual telah dibersihkan. Anda dapat mulai membuat dan menerbitkan liputan berita pertama.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(articleToDelete)}
        onClose={() => setArticleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Naskah Artikel"
        itemTitle={articleToDelete?.title}
        itemRubrik={articleToDelete?.rubrik}
        itemAuthor={articleToDelete?.authorName}
        itemImage={articleToDelete?.coverImage}
        warningMessage="Tindakan ini tidak dapat dibatalkan. Seluruh isi tulisan beserta statistik pembaca akan dihapus secara permanen dari portal LPM Reaksi."
        confirmButtonText="Ya, Hapus Naskah"
      />
    </div>
  );
}
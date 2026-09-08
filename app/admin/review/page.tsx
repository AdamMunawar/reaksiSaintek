'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { Article, ArticleStatus } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Clock,
  Phone,
  Building,
  Send,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function ReviewHubPage() {
  const { user, canReview, role } = useAuth();
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [reviewWarning, setReviewWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionAction, setDecisionAction] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = () => {
    const list = db.getArticles({ status: 'PENDING_REVIEW' });
    setPendingArticles(list);
    if (list.length > 0 && !selectedArticle) {
      setSelectedArticle(list[0]);
    } else if (list.length === 0) {
      setSelectedArticle(null);
    }

    // Live sync dari database server
    fetch('/api/articles?status=PENDING_REVIEW')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          db.syncArticlesFromRemote(data);
          setPendingArticles(data);
          if (data.length > 0 && !selectedArticle) {
            setSelectedArticle(data[0]);
          } else if (data.length === 0) {
            setSelectedArticle(null);
          }
        }
      })
      .catch((e) => console.warn('Fetch pending articles error:', e));
  };

  const handleDecision = async (decision: 'PUBLISHED' | 'REVISION' | 'REJECTED') => {
    if (!selectedArticle) return;

    if (decision === 'PUBLISHED' && !selectedArticle.coverImage?.trim()) {
      setReviewWarning(
        'Peringatan: Naskah ini belum memiliki foto sampul (cover). Foto cover wajib diunggah sebelum artikel diterbitkan. Silakan minta revisi ke penulis atau lengkapi foto cover naskah terlebih dahulu.'
      );
      return;
    }

    setReviewWarning(null);
    setIsProcessing(true);
    setDecisionAction(decision);

    const notes = reviewNote.trim() || undefined;
    db.updateArticleStatus(selectedArticle.id, decision, notes);

    try {
      await fetch(`/api/articles/${selectedArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision,
          reviewNotes: notes,
        }),
      });
    } catch (e) {
      console.warn('Update review status to server error:', e);
    }

    const message =
      decision === 'PUBLISHED'
        ? `Artikel "${selectedArticle.title}" berhasil DISETUJUI & DITERBITKAN ke portal publik & database server!`
        : decision === 'REVISION'
        ? `Status naskah diubah menjadi "Perlu Revisi" dengan catatan perbaikan.`
        : `Naskah ditolak.`;

    setActionSuccess(message);
    setReviewNote('');
    setIsProcessing(false);
    setDecisionAction(null);
    loadPending();

    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  if (!canReview) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4 rounded-sm border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          Akses Meja Review Dibatasi
        </h2>
        <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto">
          Meja review dan approval naskah hanya dapat diakses oleh Pemimpin Redaksi dan Redaktur. Peran Anda saat ini ({role}) tidak memiliki izin review.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
        >
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Meja Review & Kurasi" />
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-500" style={{ fontFamily: 'var(--font-display)' }}>
          <Sparkles size={13} />
          <span>Meja Kurasi Editorial</span>
        </div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
        >
          Review &amp; Approval Naskah
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
          Khusus Pemimpin Redaksi &amp; Editor: Periksa kualitas tulisan sebelum diterbitkan live ke portal publik.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-none flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {pendingArticles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Pending Articles (1 col) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>
              Antrean Naskah Masuk ({pendingArticles.length})
            </h3>

            <div className="space-y-2">
              {pendingArticles.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => { setSelectedArticle(art); setReviewNote(art.reviewNotes || ''); }}
                    className={`p-4 rounded-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-[var(--color-accent)]'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-wall)',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 text-white bg-orange-600"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {art.rubrik}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                        {art.createdAt?.split('T')[0]}
                      </span>
                    </div>

                    <h4
                      className="text-xs font-bold line-clamp-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                    >
                      {art.title}
                    </h4>

                    <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--color-muted)' }}>
                      Penulis: <strong>{art.authorName}</strong> ({art.authorRole})
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Article Preview & Action Panel (2 cols) */}
          {selectedArticle && (
            <div
              className="lg:col-span-2 p-6 sm:p-8 rounded-sm space-y-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-keyline)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              {/* Author & Submission Info Header */}
              <div
                className="p-4 rounded-none space-y-2"
                style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600" style={{ fontFamily: 'var(--font-display)' }}>
                    Data Penulis / Kontributor
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    Diajukan pada {selectedArticle.createdAt?.replace('T', ' ').slice(0, 16)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold block" style={{ color: 'var(--color-foreground)' }}>
                      {selectedArticle.authorName} ({selectedArticle.authorRole})
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      {selectedArticle.authorInstitution || 'FST UIN Sunan Gunung Djati Bandung'}
                    </span>
                  </div>
                  {selectedArticle.authorPhone && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      <Phone size={12} />
                      <span>WhatsApp: {selectedArticle.authorPhone}</span>
                    </div>
                  )}
                </div>

                {selectedArticle.authorBio && (
                  <p className="text-[11px] italic pt-1" style={{ color: 'var(--color-muted)', borderTop: '1px dashed var(--color-line)' }}>
                    &ldquo;{selectedArticle.authorBio}&rdquo;
                  </p>
                )}
              </div>

              {/* Title & Body Preview */}
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-600"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Rubrik: {selectedArticle.rubrik}
                </span>
                <h2
                  className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight mt-1 mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  {selectedArticle.title}
                </h2>

                <div className="p-3 mb-4 rounded-none text-xs italic font-medium bg-black/5 dark:bg-white/5 border-l-2 border-[var(--color-accent)]">
                  {selectedArticle.excerpt}
                </div>

                {selectedArticle.coverImage && (
                  <div className="aspect-video relative overflow-hidden mb-4 border" style={{ borderColor: 'var(--color-line)' }}>
                    <img src={selectedArticle.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className="prose dark:prose-invert max-w-none text-sm font-normal leading-relaxed whitespace-pre-line py-4 border-t border-b"
                  style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-body)' }}
                >
                  {selectedArticle.content}
                </div>
              </div>

              {/* Decision Area */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    Catatan Feedback Redaksi (Untuk Penulis)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Tulis catatan apresiasi atau poin perbaikan naskah..."
                    className="w-full p-2.5 text-xs font-medium focus:outline-none resize-none"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </div>

                {/* Review Warning Alert */}
                {reviewWarning && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{reviewWarning}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecision('REJECTED')}
                      className="px-4 py-2.5 text-xs font-bold uppercase text-red-600 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {isProcessing && decisionAction === 'REJECTED' && <Loader2 size={13} className="animate-spin" />}
                      <span>Tolak Naskah</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecision('REVISION')}
                      className="px-4 py-2.5 text-xs font-bold uppercase text-amber-600 border border-amber-500/30 hover:bg-amber-500/10 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {isProcessing && decisionAction === 'REVISION' && <Loader2 size={13} className="animate-spin" />}
                      <span>Minta Revisi</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('PUBLISHED')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {isProcessing && decisionAction === 'PUBLISHED' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Menerbitkan Artikel...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Setujui &amp; Terbitkan Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        <div
          className="text-center py-20 p-6 rounded-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px dashed var(--color-line)',
          }}
        >
          <CheckCircle2 size={44} className="mx-auto mb-3 text-emerald-600" />
          <h3 className="text-base font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            Semua Naskah Telah Ditinjau
          </h3>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--color-muted)' }}>
            Tidak ada naskah yang sedang menunggu persetujuan saat ini. Naskah baru dari kontributor atau reporter akan muncul di sini.
          </p>
        </div>
      )}

      {/* Decision Processing Loading Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="p-6 max-w-sm w-full rounded-sm border shadow-2xl text-center space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-lg)',
            }}
          >
            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <Loader2 size={26} className="animate-spin" />
            </div>
            <div>
              <h3
                className="text-sm font-extrabold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                {decisionAction === 'PUBLISHED'
                  ? 'Menerbitkan Artikel ke Portal...'
                  : decisionAction === 'REVISION'
                  ? 'Mengirim Catatan Revisi...'
                  : 'Memproses Penolakan Naskah...'}
              </h3>
              <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                {decisionAction === 'PUBLISHED'
                  ? 'Menyinkronkan dan mempublikasikan naskah secara live ke pembaca...'
                  : 'Memperbarui status naskah di meja kurasi redaksi...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
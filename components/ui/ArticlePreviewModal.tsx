'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  User as UserIcon,
  ChevronRight,
  Monitor,
  Smartphone,
  Loader2,
  Tag,
  ArrowLeft
} from 'lucide-react';
import { db } from '@/lib/db/repository';
import { cleanArticleHtml, extractCleanExcerpt } from '@/lib/utils/cleanHtml';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish?: () => void;
  isPublishing?: boolean;
  canPublish?: boolean;
  article: {
    title: string;
    rubrik: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    coverCaption?: string;
    authorName: string;
    authorRole?: string;
    authorInstitution?: string;
    tags?: string[];
  };
}

export default function ArticlePreviewModal({
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing = false,
  canPublish = true,
  article,
}: ArticlePreviewModalProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen) return null;

  const dynamicRubrik = db.getRubrikBySlug(article.rubrik);
  const rubrikName = dynamicRubrik?.name || article.rubrik.toUpperCase();
  const rubrikColor = dynamicRubrik?.color || '#2563EB';

  // Calculate estimated reading time
  const wordCount = (article.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-5xl h-[94vh] flex flex-col rounded-sm border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-keyline)',
          boxShadow: 'var(--shadow-hard-lg)',
        }}
      >
        {/* ── PREVIEW HEADER BAR ── */}
        <div
          className="px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 flex-shrink-0"
          style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-wall)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-sm bg-blue-500/10 text-blue-600 flex-shrink-0">
              <Eye size={16} />
            </span>
            <div>
              <h3
                className="text-xs sm:text-sm font-extrabold uppercase tracking-wide truncate"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                Pratinjau Tampilan Artikel
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[var(--color-muted)] truncate">
                Simulasi tampilan publik di portal LPM Reaksi sebelum diterbitkan.
              </p>
            </div>
          </div>

          {/* Viewport simulation buttons & close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center p-0.5 border rounded-sm" style={{ borderColor: 'var(--color-line)' }}>
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`p-1.5 text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
                title="Tampilan Komputer (Desktop)"
              >
                <Monitor size={14} />
                <span className="text-[10px] uppercase">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`p-1.5 text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
                title="Tampilan Ponsel (Mobile)"
              >
                <Smartphone size={14} />
                <span className="text-[10px] uppercase">Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors border"
              style={{ borderColor: 'var(--color-line)' }}
              title="Tutup Pratinjau"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── NOTICE BANNER ── */}
        <div className="px-4 sm:px-6 py-2 bg-blue-500/10 border-b border-blue-500/20 text-[11px] font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2 flex-shrink-0">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>
            Silakan periksa judul, foto sampul, dan perataan naskah. Jika telah sesuai, klik tombol <strong>Konfirmasi &amp; Terbitkan</strong> di bagian bawah.
          </span>
        </div>

        {/* ── SCROLLABLE ARTICLE PREVIEW AREA ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[var(--color-wall)]">
          <div
            className={`mx-auto transition-all duration-300 ${
              viewport === 'mobile'
                ? 'max-w-md border-x-2 px-4 py-6 shadow-xl'
                : 'max-w-3xl'
            }`}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-keyline)',
            }}
          >
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
              <span>Beranda</span>
              <ChevronRight size={12} />
              <span style={{ color: rubrikColor, fontWeight: 700 }}>
                {rubrikName}
              </span>
            </nav>

            {/* Rubrik Badge */}
            <span
              className="inline-flex items-center px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-white mb-3"
              style={{ backgroundColor: rubrikColor, fontFamily: 'var(--font-display)' }}
            >
              {rubrikName}
            </span>

            {/* Title */}
            <h1
              className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              {article.title || 'Judul Artikel Belum Diisi'}
            </h1>

            {/* Author Byline */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 py-3.5 my-4 border-y"
              style={{ borderColor: 'var(--color-line)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-cover bg-center border flex items-center justify-center font-bold text-xs text-white"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    borderColor: 'var(--color-line)',
                  }}
                >
                  {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'R'}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
                    {article.authorName || 'Redaksi LPM Reaksi'}
                  </p>
                  <p className="text-[10px] sm:text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    Hari ini (Pratinjau) &bull; {readTime} menit baca
                  </p>
                </div>
              </div>

              {article.authorRole && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-none border text-[var(--color-muted)]" style={{ borderColor: 'var(--color-line)' }}>
                  {article.authorRole}
                </span>
              )}
            </div>

            {/* Cover Image & Caption (Responsive) */}
            {article.coverImage ? (
              <div className="mb-6 sm:mb-8 w-full">
                <div
                  className="relative w-full overflow-hidden border mb-2 rounded-sm"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    borderColor: 'var(--color-line)',
                  }}
                >
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-auto max-h-[500px] object-cover aspect-[16/10] sm:aspect-[16/9]"
                  />
                </div>
                {article.coverCaption && (
                  <p className="text-[11px] sm:text-xs text-center italic" style={{ color: 'var(--color-muted)' }}>
                    Foto: {article.coverCaption}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 mb-6 text-center border-2 border-dashed rounded-sm text-xs font-semibold text-amber-600 bg-amber-500/10 border-amber-500/30">
                <AlertCircle size={20} className="mx-auto mb-1.5" />
                <span>Foto sampul (cover) belum diunggah. Sebelum diterbitkan, wajib menyertakan foto cover.</span>
              </div>
            )}

            {/* Article Content Render */}
            <div
              className="article-body article-content prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
              style={{
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-serif)',
              }}
              dangerouslySetInnerHTML={{
                __html:
                  cleanArticleHtml(article.content) ||
                  '<p class="italic text-gray-400">Konten naskah masih kosong...</p>',
              }}
            />

            {/* Tags Pills */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t flex flex-wrap items-center gap-1.5" style={{ borderColor: 'var(--color-line)' }}>
                <span className="text-[11px] font-bold uppercase text-[var(--color-muted)] mr-1 flex items-center gap-1">
                  <Tag size={12} />
                  <span>Topik:</span>
                </span>
                {article.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[10px] font-semibold border rounded-sm"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      borderColor: 'var(--color-line)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MODAL ACTION FOOTER ── */}
        <div
          className="px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0"
          style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-surface)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={14} />
            <span>Kembali Edit Naskah</span>
          </button>

          {canPublish && onConfirmPublish && (
            <button
              type="button"
              disabled={isPublishing || !article.coverImage}
              onClick={() => {
                onConfirmPublish();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 text-xs font-extrabold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {isPublishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menerbitkan ke Publik...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Konfirmasi &amp; Terbitkan Sekarang</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

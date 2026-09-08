'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { Article, ArticleStatus } from '@/lib/db/schema';
import { RUBRIK_META, Rubrik } from '@/lib/data';
import RichEditor from '@/components/editor/RichEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Clock,
  Loader2,
  Eye,
} from 'lucide-react';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import ArticlePreviewModal from '@/components/ui/ArticlePreviewModal';
import { PageTitle } from '@/components/ui/PageTitle';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';

const STATUS_BADGES: Record<ArticleStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draf', bg: '#6b7280', text: '#ffffff' },
  PENDING_REVIEW: { label: 'Menunggu Review', bg: '#ea580c', text: '#ffffff' },
  PUBLISHED: { label: 'Terbit Live', bg: '#059669', text: '#ffffff' },
  REJECTED: { label: 'Ditolak', bg: '#dc2626', text: '#ffffff' },
  REVISION: { label: 'Perlu Revisi', bg: '#d97706', text: '#ffffff' },
};

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, canPublish, canEditArticle, canDeleteArticle, isReadOnlyArticles } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [rubrik, setRubrik] = useState<string>('kabar-kampus');
  const [availableRubriks, setAvailableRubriks] = useState<Array<{ slug: string; name: string }>>([]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverCaption, setCoverCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('DRAFT');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveActionType, setSaveActionType] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const list = db.getRubriks();
    if (list && list.length > 0) {
      setAvailableRubriks(list.map((r) => ({ slug: r.slug, name: r.name })));
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
    if (id) {
      const art = db.getArticleById(id);
      if (art) {
        setArticle(art);
        setTitle(art.title);
        setSlug(art.slug);
        setRubrik(art.rubrik);
        setExcerpt(art.excerpt);
        setContent(art.content);
        setCoverImage(art.coverImage);
        setCoverCaption(art.coverCaption || '');
        setTagsInput(art.tags ? art.tags.join(', ') : '');
        setAuthorName(art.authorName);
        setStatus(art.status);
        setReviewNotes(art.reviewNotes || '');
      } else {
        router.push('/admin/artikel');
      }
    }
  }, [id]);

  const handleSave = (targetStatus?: ArticleStatus) => {
    if (!canEditArticle || isReadOnlyArticles) {
      setNotification({ type: 'error', message: 'Superadmin tidak memiliki akses untuk mengedit artikel.' });
      return;
    }

    if (!title.trim() || !content.trim()) {
      setNotification({ type: 'error', message: 'Judul dan konten artikel tidak boleh kosong.' });
      return;
    }

    const finalStatus = targetStatus || status;

    if (finalStatus === 'PUBLISHED' && !coverImage.trim()) {
      setNotification({
        type: 'error',
        message: 'Peringatan: Foto sampul (cover) wajib diunggah sebelum artikel dapat diterbitkan!',
      });
      document.getElementById('cover-image-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setSaveActionType(finalStatus);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    setTimeout(() => {
      db.saveArticle({
        id,
        title: title.trim(),
        slug: slug.trim(),
        rubrik,
        excerpt: extractCleanExcerpt('', content, 160),
        content: content.trim(),
        coverImage: coverImage.trim(),
        coverCaption: coverCaption.trim(),
        authorName: authorName.trim(),
        status: finalStatus,
        tags,
        reviewNotes: reviewNotes.trim(),
      });

      setNotification({
        type: 'success',
        message: finalStatus === 'PUBLISHED' ? 'Artikel berhasil diterbitkan ke portal publik!' : 'Perubahan artikel berhasil disimpan!',
      });

      setStatus(finalStatus);
      setIsSaving(false);
      setSaveActionType(null);
    }, 600);
  };

  const handleOpenPreview = () => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Isi judul artikel terlebih dahulu untuk melihat pratinjau.' });
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleInitiatePublish = () => {
    if (!canEditArticle || isReadOnlyArticles) {
      setNotification({ type: 'error', message: 'Superadmin tidak memiliki akses untuk mengedit artikel.' });
      return;
    }
    if (!title.trim() || !content.trim()) {
      setNotification({ type: 'error', message: 'Judul dan konten artikel tidak boleh kosong.' });
      return;
    }
    if (!coverImage.trim()) {
      setNotification({
        type: 'error',
        message: 'Peringatan: Foto sampul (cover) wajib diunggah sebelum artikel dapat diterbitkan!',
      });
      document.getElementById('cover-image-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!canDeleteArticle || isReadOnlyArticles) return;
    db.deleteArticle(id);
    router.push('/admin/artikel');
  };

  if (!article) return <div className="p-8 text-center text-xs font-bold uppercase">Memuat artikel...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageTitle title="Edit Artikel" />
      {/* Superadmin Read-Only Alert */}
      {isReadOnlyArticles && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            <strong>Mode Baca Saja (Superadmin):</strong> Anda dapat melihat detail naskah terbit ini, namun tidak memiliki hak akses untuk mengedit atau menghapusnya.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/artikel"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-70"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Artikel</span>
        </Link>

        {article.status === 'PUBLISHED' && (
          <Link
            href={`/artikel/${article.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-600 hover:underline"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>Lihat Live di Web</span>
            <ExternalLink size={13} />
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-extrabold uppercase px-2 py-0.5"
              style={{ backgroundColor: STATUS_BADGES[status].bg, color: STATUS_BADGES[status].text, fontFamily: 'var(--font-display)' }}
            >
              {STATUS_BADGES[status].label}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
              ID: {article.id}
            </span>
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            {isReadOnlyArticles ? 'Pratinjau Artikel' : 'Edit Artikel'}
          </h1>
        </div>

        {/* Action Buttons */}
        {!isReadOnlyArticles ? (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pratinjau Button */}
            <button
              type="button"
              onClick={handleOpenPreview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)', backgroundColor: 'var(--color-wall)' }}
              title="Lihat Pratinjau Tampilan Artikel"
            >
              <Eye size={14} className="text-blue-500" />
              <span>Pratinjau</span>
            </button>

            {canDeleteArticle && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-red-600 hover:opacity-70 border border-red-500/30 text-xs font-bold uppercase"
                title="Hapus Artikel"
              >
                <Trash2 size={14} />
              </button>
            )}

            {canEditArticle && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity disabled:opacity-60"
                style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}
              >
                {isSaving && saveActionType !== 'PUBLISHED' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            )}

            {canPublish && status !== 'PUBLISHED' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleInitiatePublish}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-60"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {isSaving && saveActionType === 'PUBLISHED' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menerbitkan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Terbitkan Sekarang</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)', backgroundColor: 'var(--color-wall)' }}
              title="Lihat Pratinjau Tampilan Artikel"
            >
              <Eye size={14} className="text-blue-500" />
              <span>Pratinjau Tampilan</span>
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div
          className={`p-4 rounded-none flex items-center gap-2 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div
            className="p-5 rounded-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
              Judul Artikel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-3 text-base font-bold focus:outline-none"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
                fontFamily: 'var(--font-display)',
              }}
            />

            <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>
              <span className="font-semibold">Slug URL:</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-xs px-2 py-0.5 bg-transparent border-b"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)' }}
              />
            </div>
          </div>

          {/* Automatic Excerpt Preview */}
          <div
            className="p-4 rounded-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
                Ringkasan Berita (Otomatis untuk Kartu Portal)
              </label>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Auto dari Penggalan Pertama
              </span>
            </div>
            <p className="text-xs italic leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {extractCleanExcerpt('', content, 160) || 'Ringkasan kartu akan otomatis diambil dari penggalan pertama naskah dan hanya ditampilkan pada kartu/cuplikan berita...'}
            </p>
          </div>

          {/* Body Content Editor */}
          <div
            className="p-5 rounded-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Konten Naskah Lengkap &amp; Format *
            </label>
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Tulis atau edit naskah lengkap artikel... Gunakan toolbar untuk formatting."
              minHeight="380px"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div
            className="p-5 rounded-sm space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider pb-2" style={{ borderBottom: '1px solid var(--color-line)', fontFamily: 'var(--font-display)' }}>
              Status &amp; Publikasi
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Status Artikel
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                <option value="DRAFT">Draf</option>
                <option value="PENDING_REVIEW">Menunggu Review</option>
                <option value="PUBLISHED">Terbit Live</option>
                <option value="REVISION">Perlu Revisi</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Rubrik
              </label>
              <select
                value={rubrik}
                onChange={(e) => setRubrik(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {availableRubriks.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Nama Penulis
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Catatan Review Redaksi
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Catatan untuk penulis/kontributor jika ada revisi..."
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none resize-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>
          </div>

          <div
            id="cover-image-section"
            className="p-5 rounded-sm space-y-3.5"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Foto Cover / Thumbnail *
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Wajib Publish
              </span>
            </div>

            <ImageUploader
              value={coverImage}
              onChange={setCoverImage}
              label="Unggah File Foto Cover"
              authorName={authorName}
              aspectRatio="video"
              allowUrlInput={false}
            />

            {/* Kolom Keterangan & Sumber Foto (Manual) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Keterangan & Sumber Foto Cover
              </label>
              <input
                type="text"
                value={coverCaption}
                onChange={(e) => setCoverCaption(e.target.value)}
                placeholder="Contoh: Foto: Dokumentasi LPM Reaksi / Ahmad Maulana"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
              <p className="text-[10.5px] mt-1 text-[var(--color-muted)] leading-relaxed">
                Tuliskan sumber atau fotografer secara spesifik (tidak otomatis). Keterangan ini akan tampil di bawah foto utama artikel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Naskah Artikel"
        itemTitle={title}
        itemRubrik={rubrik}
        itemAuthor={authorName}
        itemImage={coverImage}
        warningMessage="Tindakan ini tidak dapat dibatalkan. Seluruh isi tulisan beserta statistik pembaca akan dihapus secara permanen dari portal LPM Reaksi."
        confirmButtonText="Ya, Hapus Naskah"
      />

      {/* Saving / Publishing Loading Modal */}
      {isSaving && (
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
                {saveActionType === 'PUBLISHED'
                  ? 'Menerbitkan Artikel ke Portal...'
                  : 'Menyimpan Perubahan Naskah...'}
              </h3>
              <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                {saveActionType === 'PUBLISHED'
                  ? 'Menyinkronkan data dan memperbarui status publikasi artikel...'
                  : 'Menyimpan perubahan ke database redaksi...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Article Preview Modal */}
      <ArticlePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        canPublish={canPublish && status !== 'PUBLISHED' && !isReadOnlyArticles}
        isPublishing={isSaving && saveActionType === 'PUBLISHED'}
        onConfirmPublish={() => {
          setIsPreviewOpen(false);
          handleSave('PUBLISHED');
        }}
        article={{
          title,
          rubrik,
          excerpt,
          content,
          coverImage,
          coverCaption,
          authorName: authorName.trim() || user?.name || 'Redaksi LPM Reaksi',
          authorRole: (user?.role as any) || 'superadmin',
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        }}
      />
    </div>
  );
}

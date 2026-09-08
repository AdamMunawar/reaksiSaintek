'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { RUBRIK_META, Rubrik } from '@/lib/data';
import RichEditor from '@/components/editor/RichEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Loader2,
  Eye
} from 'lucide-react';
import ArticlePreviewModal from '@/components/ui/ArticlePreviewModal';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';

export default function WriteArticlePage() {
  const router = useRouter();
  const { user, canPublish, canWriteArticle, role } = useAuth();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [rubrik, setRubrik] = useState<string>('kabar-kampus');
  const [availableRubriks, setAvailableRubriks] = useState<Array<{ slug: string; name: string }>>([]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverCaption, setCoverCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('Kampus, Mahasiswa, Sains');
  const [authorName, setAuthorName] = useState(user?.name || 'Redaksi LPM Reaksi');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveActionType, setSaveActionType] = useState<'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const list = db.getRubriks();
    if (list && list.length > 0) {
      setAvailableRubriks(list.map((r) => ({ slug: r.slug, name: r.name })));
      setRubrik(list[0].slug);
    } else {
      setAvailableRubriks(
        Object.entries(RUBRIK_META).map(([key, meta]) => ({
          slug: key,
          name: meta.label,
        }))
      );
    }
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    setSlug(generatedSlug);
  };

  const handleSave = (status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED') => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Judul artikel wajib diisi.' });
      return;
    }
    if (!content.trim()) {
      setNotification({ type: 'error', message: 'Konten artikel tidak boleh kosong.' });
      return;
    }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    if (status === 'PUBLISHED' && !coverImage.trim()) {
      setNotification({
        type: 'error',
        message: 'Peringatan: Foto sampul (cover) wajib diunggah sebelum artikel dapat diterbitkan!',
      });
      document.getElementById('cover-image-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setSaveActionType(status);

    setTimeout(() => {
      const saved = db.saveArticle({
        title: title.trim(),
        slug: slug.trim() || undefined,
        rubrik,
        excerpt: extractCleanExcerpt('', content, 160),
        content: content.trim(),
        coverImage: coverImage.trim(),
        coverCaption: coverCaption.trim(),
        authorId: user?.id || 'user-superadmin',
        authorName: authorName.trim() || user?.name || 'Redaksi LPM Reaksi',
        authorRole: (user?.role as any) || 'superadmin',
        status,
        tags,
      });

      setNotification({
        type: 'success',
        message:
          status === 'PUBLISHED'
            ? 'Artikel berhasil diterbitkan ke portal publik!'
            : status === 'PENDING_REVIEW'
            ? 'Naskah berhasil diajukan ke meja redaksi!'
            : 'Draf naskah berhasil disimpan!',
      });

      setTimeout(() => {
        router.push('/admin/artikel');
      }, 800);
    }, 600);
  };

  const handleOpenPreview = () => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Tulis judul artikel terlebih dahulu untuk melihat pratinjau.' });
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleInitiatePublish = () => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Judul artikel wajib diisi.' });
      return;
    }
    if (!content.trim()) {
      setNotification({ type: 'error', message: 'Konten artikel tidak boleh kosong.' });
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
    // Buka modal pratinjau sebelum publish!
    setIsPreviewOpen(true);
  };

  if (!canWriteArticle) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4 rounded-sm border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          Akses Menulis Dibatasi
        </h2>
        <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto">
          Peran akun Anda saat ini ({role}) tidak memiliki hak akses untuk membuat naskah artikel baru. Superadmin difokuskan untuk mengakses dan memantau artikel yang telah terbit secara read-only.
        </p>
        <Link
          href="/admin/artikel"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Artikel</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Tulis Artikel" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--color-line)' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/artikel"
            className="p-2 border rounded-none hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1
              className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Tulis Artikel Baru
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
              Buat karya jurnalistik, rilis berita, atau esai editorial LPM Reaksi.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Pratinjau Button */}
          <button
            type="button"
            onClick={handleOpenPreview}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-80 transition-all flex-1 sm:flex-initial"
            style={{
              borderColor: 'var(--color-line)',
              backgroundColor: 'var(--color-wall)',
              fontFamily: 'var(--font-display)',
            }}
            title="Lihat Pratinjau Tampilan Artikel"
          >
            <Eye size={14} className="text-blue-500" />
            <span>Pratinjau</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('DRAFT')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity disabled:opacity-60 flex-1 sm:flex-initial"
            style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}
          >
            {isSaving && saveActionType === 'DRAFT' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Simpan Draf</span>
              </>
            )}
          </button>

          {canPublish ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleInitiatePublish}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-60 flex-1 sm:flex-initial"
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
                  <span>Terbitkan Langsung</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('PENDING_REVIEW')}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-white bg-orange-600 hover:bg-orange-700 shadow-sm disabled:opacity-60 flex-1 sm:flex-initial"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {isSaving && saveActionType === 'PENDING_REVIEW' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Mengajukan...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Ajukan ke Meja Redaksi</span>
                </>
              )}
            </button>
          )}
        </div>
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

      {/* Editor Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title input */}
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
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ketik judul artikel berita yang tajam dan akurat..."
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
              <span className="font-mono">{slug || 'otomatis-dibuat-dari-judul'}</span>
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
              placeholder="Tulis naskah lengkap artikel berita Anda... Gunakan tombol toolbar untuk menebalkan (bold), miring (italic), subjudul (H2/H3), kutipan wawancara (quote), dan daftar poin."
              minHeight="380px"
            />
          </div>
        </div>

        {/* Sidebar Metadata (1 col) */}
        <div className="space-y-5">
          {/* Rubrik & Author */}
          <div
            className="p-5 rounded-sm space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider pb-2" style={{ borderBottom: '1px solid var(--color-line)', fontFamily: 'var(--font-display)' }}>
              Pengaturan Penerbitan
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Rubrik Publikasi *
              </label>
              <select
                value={rubrik}
                onChange={(e) => setRubrik(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                  fontFamily: 'var(--font-display)',
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
                Nama Penulis / Redaktur
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
                Tag / Topik
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="pisahkan dengan koma"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>
          </div>

          {/* Cover Image */}
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
                  : saveActionType === 'PENDING_REVIEW'
                  ? 'Mengajukan Naskah ke Meja Redaksi...'
                  : 'Menyimpan Draf Naskah...'}
              </h3>
              <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                {saveActionType === 'PUBLISHED'
                  ? 'Menyinkronkan aset cover dan mempublikasikan artikel ke pembaca publik...'
                  : 'Menyimpan naskah ke database redaksi...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Article Preview Modal */}
      <ArticlePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        canPublish={canPublish}
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
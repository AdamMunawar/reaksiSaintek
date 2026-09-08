'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { RUBRIK_META, Rubrik } from '@/lib/data';
import RichEditor from '@/components/editor/RichEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  ArrowLeft,
  Send,
  Save,
  User,
  Phone,
  Building,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function ContributorFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuth();

  // Author details
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorInstitution, setAuthorInstitution] = useState(user?.institution || '');
  const [authorPhone, setAuthorPhone] = useState(user?.phone || '');
  const [authorBio, setAuthorBio] = useState(user?.bio || '');

  // Article details
  const [title, setTitle] = useState('');
  const [rubrik, setRubrik] = useState<string>('opini');
  const [availableRubriks, setAvailableRubriks] = useState<Array<{ slug: string; name: string; description: string }>>([]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverCaption, setCoverCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('Opini Mahasiswa, Kampus');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'DRAFT' | 'PENDING_REVIEW' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const list = db.getRubriks();
    if (list && list.length > 0) {
      setAvailableRubriks(list.map((r) => ({ slug: r.slug, name: r.name, description: r.description })));
      if (!editId) {
        setRubrik(list[0].slug);
      }
    } else {
      setAvailableRubriks(
        Object.entries(RUBRIK_META).map(([key, meta]) => ({
          slug: key,
          name: meta.label,
          description: meta.description,
        }))
      );
    }
  }, [editId]);

  useEffect(() => {
    if (editId) {
      const existing = db.getArticleById(editId);
      if (existing) {
        setTitle(existing.title);
        setRubrik(existing.rubrik);
        setExcerpt(existing.excerpt);
        setContent(existing.content);
        setCoverImage(existing.coverImage);
        if (existing.coverCaption) setCoverCaption(existing.coverCaption);
        setTagsInput(existing.tags.join(', '));
        if (existing.authorName) setAuthorName(existing.authorName);
        if (existing.authorInstitution) setAuthorInstitution(existing.authorInstitution);
        if (existing.authorPhone) setAuthorPhone(existing.authorPhone);
        if (existing.authorBio) setAuthorBio(existing.authorBio);
      }
    }
  }, [editId]);

  const handleSubmit = (status: 'DRAFT' | 'PENDING_REVIEW') => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Judul naskah wajib diisi.' });
      return;
    }
    if (!content.trim()) {
      setNotification({ type: 'error', message: 'Naskah tulisan tidak boleh kosong.' });
      return;
    }
    if (!authorName.trim()) {
      setNotification({ type: 'error', message: 'Nama lengkap penulis wajib diisi.' });
      return;
    }

    if (status === 'PENDING_REVIEW' && !coverImage.trim()) {
      setNotification({
        type: 'error',
        message: 'Peringatan: Foto sampul (cover) wajib diunggah sebelum naskah dapat dikirim ke Meja Redaksi!',
      });
      document.getElementById('contributor-cover-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitAction(status);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    setTimeout(() => {
      const saved = db.saveArticle({
        id: editId || undefined,
        title: title.trim(),
        rubrik,
        excerpt: excerpt.trim() || content.slice(0, 160) + '...',
        content: content.trim(),
        coverImage: coverImage.trim(),
        coverCaption: coverCaption.trim(),
        authorId: user?.id || 'user-kontributor',
        authorName: authorName.trim(),
        authorRole: 'kontributor',
        authorInstitution: authorInstitution.trim(),
        authorPhone: authorPhone.trim(),
        authorBio: authorBio.trim(),
        status,
        tags,
        reviewNotes: status === 'PENDING_REVIEW' ? 'Menunggu review dari Pemimpin Redaksi.' : undefined,
      });

      setIsSubmitting(false);
      setSubmitAction(null);

      if (status === 'PENDING_REVIEW') {
        setNotification({
          type: 'success',
          message: 'Naskah Anda berhasil dikirim ke Meja Redaksi untuk ditinjau!',
        });
        setTimeout(() => {
          router.push('/kontributor');
        }, 1000);
      } else {
        setNotification({
          type: 'success',
          message: 'Naskah berhasil disimpan sebagai draf.',
        });
      }
    }, 600);
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title={editId ? 'Edit Naskah Tulisan' : 'Kirim Naskah'} />
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '2px solid var(--color-keyline)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/kontributor"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-70"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Dashboard</span>
          </Link>
          <span
            className="text-[10px] font-extrabold uppercase px-2 py-0.5 text-white"
            style={{ backgroundColor: '#ea580c', fontFamily: 'var(--font-display)' }}
          >
            Form Pengajuan Naskah
          </span>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            {editId ? 'Edit Naskah Tulisan' : 'Kirim Naskah ke LPM Reaksi'}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Lengkapi data diri penulis dan naskah Anda. Naskah yang dikirim akan melalui tahap kurasi redaksi.
          </p>
        </div>

        {notification && (
          <div
            className={`p-4 mb-6 rounded-none flex items-center gap-2.5 text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Section 1: Data Diri Penulis */}
          <div
            className="p-6 rounded-sm space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <User size={18} style={{ color: 'var(--color-accent)' }} />
              <h2
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                1. Data Diri Penulis / Kontributor
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Nama lengkap dan gelar (jika ada)"
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
                  Jurusan / Fakultas / Institusi *
                </label>
                <input
                  type="text"
                  value={authorInstitution}
                  onChange={(e) => setAuthorInstitution(e.target.value)}
                  placeholder="misal: Teknik Informatika 2024 - FST UIN SGD"
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
                  Kontak WhatsApp Aktif *
                </label>
                <input
                  type="text"
                  value={authorPhone}
                  onChange={(e) => setAuthorPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx (untuk konfirmasi redaksi)"
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
                  Bio Singkat (1-2 kalimat)
                </label>
                <input
                  type="text"
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  placeholder="misal: Mahasiswa FST peminat kajian iptek dan sosial"
                  className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Isi Naskah Tulisan */}
          <div
            className="p-6 rounded-sm space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <FileText size={18} style={{ color: 'var(--color-accent)' }} />
              <h2
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                2. Detail &amp; Naskah Tulisan
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Judul Naskah *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tulis judul naskah yang menarik dan lugas..."
                  className="w-full px-3 py-2.5 text-sm font-bold focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                    fontFamily: 'var(--font-display)',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Pilihan Rubrik *
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
                        {r.name} {r.description ? `(${r.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Tag / Topik (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="misal: Opini, Saintek, Lingkungan"
                    className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Ringkasan / Excerpt (1-2 kalimat pengantar)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ringkasan singkat isi tulisan..."
                  className="w-full px-3 py-2 text-xs font-medium focus:outline-none resize-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>

              <div id="contributor-cover-section" className="space-y-2 p-4 rounded border" style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                    Foto Sampul / Cover Naskah *
                  </label>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Wajib Ada
                  </span>
                </div>

                <ImageUploader
                  value={coverImage}
                  onChange={setCoverImage}
                  label="Upload Foto Thumbnail / Cover"
                  authorName={authorName || 'Kontributor'}
                  aspectRatio="video"
                  allowUrlInput={false}
                  helperText=""
                />

                <div className="pt-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Keterangan & Sumber Foto Cover
                  </label>
                  <input
                    type="text"
                    value={coverCaption}
                    onChange={(e) => setCoverCaption(e.target.value)}
                    placeholder="Contoh: Foto: Dokumentasi Pribadi Penulis / Nama Fotografer"
                    className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                  <p className="text-[10.5px] mt-1 text-[var(--color-muted)] leading-relaxed">
                    Sertakan sumber atau fotografer karya foto (tidak otomatis).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Naskah Tulisan Lengkap &amp; Format *
                </label>
                <RichEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Ketik naskah opini, esai, atau karya sastra Anda di sini... Anda dapat menebalkan teks, membuat miring, subjudul (H2/H3), kutipan wawancara (quote), dan daftar poin."
                  minHeight="350px"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('DRAFT')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity disabled:opacity-60"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {isSubmitting && submitAction === 'DRAFT' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Simpan Draf</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('PENDING_REVIEW')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {isSubmitting && submitAction === 'PENDING_REVIEW' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Mengirim Naskah...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Kirim Naskah ke Meja Redaksi</span>
                </>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* Submitting Loading Modal Overlay */}
      {isSubmitting && (
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
                {submitAction === 'PENDING_REVIEW'
                  ? 'Mengirim Naskah ke Meja Redaksi...'
                  : 'Menyimpan Draf Naskah...'}
              </h3>
              <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                {submitAction === 'PENDING_REVIEW'
                  ? 'Menyinkronkan data naskah untuk ditinjau oleh Pemimpin Redaksi...'
                  : 'Menyimpan perubahan naskah ke draf kontributor...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContributorSubmitPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold">Memuat formulir...</div>}>
      <ContributorFormContent />
    </Suspense>
  );
}
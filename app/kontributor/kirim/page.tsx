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
  ArrowRight,
  PenTool,
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
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Article } from '@/lib/db/schema';
import { InlineCommentSystem } from '@/components/editorial/InlineCommentSystem';

function ContributorFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuth();
  const [articleDetail, setArticleDetail] = useState<Article | null>(null);
  const [isReviewNotesOpen, setIsReviewNotesOpen] = useState(true);

  // Author details
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorInstitution, setAuthorInstitution] = useState(user?.institution || '');
  const [authorPhone, setAuthorPhone] = useState(user?.phone || '');
  const [authorBio, setAuthorBio] = useState(user?.bio || '');

  // Article details
  const [title, setTitle] = useState('');
  const [rubrik, setRubrik] = useState<string>('opini');
  const [subRubrik, setSubRubrik] = useState<string>('');
  const [availableRubriks, setAvailableRubriks] = useState<Array<{ slug: string; name: string; description: string; subRubriks?: string[] }>>([]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverCaption, setCoverCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('Opini Mahasiswa, Kampus');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'DRAFT' | 'PENDING_REVIEW' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedArticleTitle, setSubmittedArticleTitle] = useState('');

  useEffect(() => {
    const list = db.getRubriks();
    if (list && list.length > 0) {
      setAvailableRubriks(list.map((r) => ({ slug: r.slug, name: r.name, description: r.description, subRubriks: r.subRubriks || [] })));
      if (!editId) {
        setRubrik(list[0].slug);
      }
    } else {
      setAvailableRubriks([]);
      if (!editId) {
        setRubrik('');
      }
    }

    fetch('/api/rubriks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((r: any) => ({ slug: r.slug, name: r.name, description: r.description, subRubriks: r.subRubriks || [] }));
          setAvailableRubriks(mapped);
          if (mapped.length > 0 && !editId) {
            setRubrik((prev) => prev || mapped[0].slug);
          }
        }
      })
      .catch(() => {});
  }, [editId]);

  useEffect(() => {
    if (editId) {
      const existing = db.getArticleById(editId);
      if (existing) {
        setArticleDetail(existing);
        setTitle(existing.title);
        setRubrik(existing.rubrik);
        if (existing.subRubrik) setSubRubrik(existing.subRubrik);
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

      fetch(`/api/articles/${editId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((remote) => {
          if (remote) {
            setArticleDetail(remote);
            setTitle(remote.title);
            setRubrik(remote.rubrik);
            setExcerpt(remote.excerpt);
            setContent(remote.content);
            setCoverImage(remote.coverImage || remote.cover_image || '');
            if (remote.coverCaption || remote.cover_caption) setCoverCaption(remote.coverCaption || remote.cover_caption);
            if (remote.tags) setTagsInput(Array.isArray(remote.tags) ? remote.tags.join(', ') : remote.tags);
            if (remote.authorName || remote.author_name) setAuthorName(remote.authorName || remote.author_name);
            if (remote.authorInstitution) setAuthorInstitution(remote.authorInstitution);
            if (remote.authorPhone) setAuthorPhone(remote.authorPhone);
            if (remote.authorBio) setAuthorBio(remote.authorBio);
          }
        })
        .catch((e) => console.warn('Fetch edit article error:', e));
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

    const payload = {
      id: editId || undefined,
      title: title.trim(),
      rubrik,
      subRubrik: subRubrik ? subRubrik.trim() : undefined,
      excerpt: excerpt.trim() || content.slice(0, 160) + '...',
      content: content.trim(),
      coverImage: coverImage.trim(),
      coverCaption: coverCaption.trim(),
      authorId: user?.id || 'user-kontributor',
      authorName: authorName.trim(),
      authorRole: 'kontributor' as any,
      authorInstitution: authorInstitution.trim(),
      authorPhone: authorPhone.trim(),
      authorBio: authorBio.trim(),
      status,
      tags,
      reviewNotes: status === 'PENDING_REVIEW' ? 'Menunggu review dari Pemimpin Redaksi.' : undefined,
    };

    fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const saved = await res.json();
        db.saveArticle((saved || payload) as any);
      })
      .catch((err) => {
        console.warn('Post to server failed, saving local:', err);
        db.saveArticle(payload as any);
      })
      .finally(() => {
        setIsSubmitting(false);
        setSubmitAction(null);

        if (status === 'PENDING_REVIEW') {
          setSubmittedArticleTitle(title);
          setIsSubmittedSuccess(true);
        } else {
          setNotification({
            type: 'success',
            message: 'Naskah berhasil disimpan sebagai draf.',
          });
        }
      });
  };

  if (isSubmittedSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors"
        style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
      >
        <PageTitle title="Naskah Berhasil Dikirim" />
        <div
          className="w-full max-w-xl p-8 sm:p-10 rounded-sm text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard-lg)',
          }}
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={34} />
          </div>

          <span
            className="text-[10px] font-extrabold uppercase px-2.5 py-1 text-white inline-block mb-3"
            style={{ backgroundColor: '#059669', fontFamily: 'var(--font-display)' }}
          >
            Pengajuan Naskah Terkirim
          </span>

          <h2
            className="text-2xl font-extrabold uppercase tracking-tight mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Naskah Anda Berhasil Masuk Meja Redaksi
          </h2>

          <div
            className="p-4 my-5 text-left text-xs space-y-2 rounded-sm"
            style={{
              backgroundColor: 'var(--color-wall)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div>
              <span className="font-bold text-[10px] uppercase text-[var(--color-muted)] block">Judul Naskah</span>
              <span className="font-bold text-sm text-[var(--color-foreground)] line-clamp-2">"{submittedArticleTitle || title}"</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-line)' }}>
              <div>
                <span className="font-bold text-[10px] uppercase text-[var(--color-muted)] block">Penulis</span>
                <span className="font-semibold text-[var(--color-foreground)]">{authorName || 'Kontributor'}</span>
              </div>
              <div>
                <span className="font-bold text-[10px] uppercase text-[var(--color-muted)] block">Rubrik</span>
                <span className="font-semibold text-[var(--color-foreground)] capitalize">{rubrik}</span>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Terima kasih telah berpartisipasi menyuarakan gagasan bersama <strong>LPM Reaksi</strong>. Tim kurator redaksi kami akan meninjau tulisan Anda dan segera mengonfirmasi melalui kontak WhatsApp yang telah Anda cantumkan (<strong>{authorPhone || 'nomor kontak aktif'}</strong>).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <span>Kembali ke Web Berita</span>
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={() => {
                setTitle('');
                setContent('');
                setExcerpt('');
                setCoverImage('');
                setIsSubmittedSuccess(false);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-wall)',
                border: '1px solid var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <PenTool size={14} />
              <span>Kirim Naskah Baru</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            href="/kirim-tulisan"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-70"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}
            title="Kembali ke halaman Kirim Tulisan"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Web Utama</span>
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
        {/* Editorial Notes & Annotations Section if reviewing/revising */}
        {articleDetail && ((articleDetail.reviewComments && articleDetail.reviewComments.length > 0) || articleDetail.reviewNotes || articleDetail.status === 'REVISION') && (
          <div className="mb-8 rounded-sm overflow-hidden border-2 border-amber-500 bg-[var(--color-surface)] shadow-md">
            <div
              onClick={() => setIsReviewNotesOpen(!isReviewNotesOpen)}
              className="p-4 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-amber-600" />
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200" style={{ fontFamily: 'var(--font-display)' }}>
                    Catatan Redaksi & Anotasi Naskah
                  </h2>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    {articleDetail.reviewComments?.length || 0} catatan kata/kalimat & komentar tim redaksi
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-300"
              >
                {isReviewNotesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {isReviewNotesOpen && (
              <div className="p-4 sm:p-6 space-y-4">
                {articleDetail.reviewNotes && (
                  <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 text-xs">
                    <span className="font-bold block text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-1">
                      Instruksi Umum Redaktur:
                    </span>
                    <p className="italic text-[var(--color-foreground)] leading-relaxed">
                      &ldquo;{articleDetail.reviewNotes}&rdquo;
                    </p>
                  </div>
                )}

                <InlineCommentSystem
                  key={articleDetail.id}
                  articleId={articleDetail.id}
                  content={articleDetail.content}
                  initialComments={articleDetail.reviewComments || []}
                  isEditor={false}
                  onCommentsChange={(newComms) => {
                    setArticleDetail((prev) => (prev ? { ...prev, reviewComments: newComms } : null));
                  }}
                />
              </div>
            )}
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
                  {availableRubriks.length > 0 ? (
                    <select
                      value={rubrik}
                      onChange={(e) => {
                        setRubrik(e.target.value);
                        setSubRubrik('');
                      }}
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
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-sm">
                      <p className="font-semibold">Belum ada rubrik aktif yang dibuka oleh redaksi.</p>
                    </div>
                  )}
                </div>

                {(() => {
                  const selected = availableRubriks.find((r) => r.slug === rubrik);
                  if (selected && selected.subRubriks && selected.subRubriks.length > 0) {
                    return (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                          Sub-Rubrik / Kategori Khusus
                        </label>
                        <select
                          value={subRubrik}
                          onChange={(e) => setSubRubrik(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold focus:outline-none"
                          style={{
                            backgroundColor: 'var(--color-wall)',
                            color: 'var(--color-foreground)',
                            border: '1px solid var(--color-line)',
                          }}
                        >
                          <option value="">-- Tanpa Sub-Rubrik (Utama) --</option>
                          {selected.subRubriks.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

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
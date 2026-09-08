'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/repository';
import { EPaperItem } from '@/lib/db/schema';
import ImageUploader from '@/components/ui/ImageUploader';
import PdfUploader from '@/components/ui/PdfUploader';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  Newspaper,
  Plus,
  FileText,
  Download,
  Eye,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';

const CATEGORIES = [
  { id: 'BULETIN', label: 'Buletin Cetak/Digital', color: '#2563EB' },
  { id: 'TABLOID', label: 'Tabloid Mahasiswa', color: '#7C3AED' },
  { id: 'MAJALAH', label: 'Majalah Eksklusif', color: '#059669' },
] as const;

export default function AdminEPaperPage() {
  const [epapers, setEpapers] = useState<EPaperItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [epaperToDelete, setEpaperToDelete] = useState<EPaperItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [edition, setEdition] = useState('');
  const [category, setCategory] = useState<'BULETIN' | 'TABLOID' | 'MAJALAH'>('BULETIN');
  const [coverImage, setCoverImage] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [description, setDescription] = useState('');
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split('T')[0]);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEpapers(db.getEPapers());
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setTitle('');
    setEdition(`Edisi ${epapers.length + 1} / ${new Date().getFullYear()}`);
    setCategory('BULETIN');
    setCoverImage('');
    setPdfUrl('');
    setPdfFileName('');
    setPdfFileSize('');
    setDescription('');
    setPublishedAt(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EPaperItem) => {
    setEditId(item.id);
    setTitle(item.title);
    setEdition(item.edition);
    setCategory(item.category);
    setCoverImage(item.coverImage);
    setPdfUrl(item.pdfUrl);
    setPdfFileName(`${item.title}.pdf`);
    setPdfFileSize(item.fileSize || '');
    setDescription(item.description || '');
    setPublishedAt(item.publishedAt);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Judul terbitan E-Paper wajib diisi.' });
      return;
    }
    if (!edition.trim()) {
      setNotification({ type: 'error', message: 'Nomor edisi / periode wajib diisi.' });
      return;
    }
    if (!coverImage.trim()) {
      setNotification({ type: 'error', message: 'Foto sampul depan (cover) wajib diunggah.' });
      return;
    }
    if (!pdfUrl.trim()) {
      setNotification({ type: 'error', message: 'Berkas PDF E-Paper wajib diunggah.' });
      return;
    }

    db.saveEPaper({
      id: editId || undefined,
      title: title.trim(),
      edition: edition.trim(),
      category,
      coverImage: coverImage.trim(),
      pdfUrl: pdfUrl.trim(),
      description: description.trim(),
      fileSize: pdfFileSize || 'Unknown',
      publishedAt,
    });

    setNotification({
      type: 'success',
      message: editId ? 'E-Paper berhasil diperbarui!' : 'Terbitan E-Paper baru berhasil dipublikasikan!',
    });
    setIsModalOpen(false);
    loadData();
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!epaperToDelete) return;
    db.deleteEPaper(epaperToDelete.id);
    setNotification({
      type: 'success',
      message: `Terbitan "${epaperToDelete.title}" berhasil dihapus.`,
    });
    setEpaperToDelete(null);
    loadData();
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Kelola E-Paper & Buletin" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
            <Newspaper size={13} />
            <span>Publikasi Cetak &amp; Digital</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Kelola E-Paper, Buletin &amp; Tabloid
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Unggah dan publikasikan edisi buletin tabloid PDF resmi LPM Reaksi agar dapat dibaca dan diunduh pembaca.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/e-paper"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase border hover:opacity-75"
            style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
          >
            <span>Lihat Live di Web</span>
            <ExternalLink size={13} />
          </Link>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            <Plus size={14} />
            <span>Unggah E-Paper Baru</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-none flex items-center gap-2.5 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-sm border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <BookOpen size={14} />
            <span>Total Edisi Terbit</span>
          </div>
          <p className="text-2xl font-black mt-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
            {epapers.length}
          </p>
        </div>

        <div
          className="p-4 rounded-sm border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <FileText size={14} />
            <span>Kategori Publikasi</span>
          </div>
          <p className="text-xs font-bold mt-3" style={{ color: 'var(--color-foreground)' }}>
            Buletin, Tabloid, Majalah
          </p>
        </div>

        <div
          className="p-4 rounded-sm border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <Download size={14} />
            <span>Total Unduhan Pembaca</span>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'var(--font-display)' }}>
            {epapers.reduce((sum, e) => sum + (e.downloads || 0), 0)} kali
          </p>
        </div>
      </div>

      {/* E-Paper Table */}
      <div
        className="rounded-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-keyline)',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-line)' }}>
          <h2
            className="text-xs font-extrabold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Arsip E-Paper ({epapers.length} Edisi)
          </h2>
          <span className="text-[11px] font-medium text-[var(--color-muted)]">
            Format PDF Interaktif untuk web publik
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-wall)', borderBottom: '1px solid var(--color-line)' }}>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px] w-20">Sampul</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Judul &amp; Edisi</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Kategori</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Ukuran Berkas</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px]">Tanggal Terbit</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {epapers.length > 0 ? (
                epapers.map((item) => {
                  const cat = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
                  return (
                    <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="w-14 h-18 bg-black/10 overflow-hidden border" style={{ borderColor: 'var(--color-line)' }}>
                          <img
                            src={item.coverImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <span className="font-bold text-xs block" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)] block mt-0.5">
                          {item.edition}
                        </span>
                        {item.description && (
                          <p className="text-[11px] text-[var(--color-muted)] line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 text-[9px] font-extrabold uppercase text-white"
                          style={{ backgroundColor: cat.color, fontFamily: 'var(--font-display)' }}
                        >
                          {cat.label}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {item.fileSize || 'PDF'}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {item.publishedAt}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-right space-x-2">
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:opacity-75 inline-block"
                          title="Buka PDF"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-blue-600 hover:opacity-75"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEpaperToDelete(item)}
                          className="p-1.5 text-red-600 hover:opacity-75"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-16 text-center space-y-2" style={{ color: 'var(--color-muted)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-foreground)' }}>
                      Belum Ada Terbitan E-Paper / Buletin
                    </p>
                    <p className="text-[11px] max-w-sm mx-auto">
                      Klik tombol &ldquo;Unggah E-Paper Baru&rdquo; di atas untuk menerbitkan buletin atau tabloid PDF pertama.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="w-full max-w-xl p-6 sm:p-8 rounded-sm my-8 space-y-5"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-lg)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {editId ? 'Edit Terbitan E-Paper' : 'Unggah Terbitan E-Paper / Buletin Baru'}
                </h3>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Lengkapi data sampul depan dan berkas PDF resmi untuk publikasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold uppercase hover:opacity-75"
                style={{ color: 'var(--color-muted)' }}
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  Judul Terbitan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="misal: Buletin Reaksi Edisi 24 - Menatap Masa Depan Sains Kampus"
                  required
                  className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    Edisi / Periode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="misal: Edisi XXIV / Maret 2026"
                    required
                    className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    Kategori Terbitan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover Image Upload */}
              <ImageUploader
                value={coverImage}
                onChange={setCoverImage}
                label="Unggah Foto Sampul Depan (Cover) *"
                helperText="Pilih foto halaman sampul depan buletin/tabloid (format JPG, PNG, atau WebP)."
              />

              {/* PDF File Upload */}
              <PdfUploader
                value={pdfUrl}
                fileName={pdfFileName}
                fileSize={pdfFileSize}
                onChange={(url, info) => {
                  setPdfUrl(url);
                  if (info) {
                    setPdfFileName(info.name);
                    setPdfFileSize(info.size);
                  }
                }}
                label="Unggah Berkas PDF E-Paper"
                required={true}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  Deskripsi / Catatan Redaksi
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ringkasan liputan utama atau topik yang diulas dalam edisi ini..."
                  className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase border hover:opacity-75"
                  style={{ borderColor: 'var(--color-line)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                >
                  {editId ? 'Simpan Perubahan' : 'Terbitkan E-Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(epaperToDelete)}
        onClose={() => setEpaperToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Terbitan E-Paper"
        itemTitle={epaperToDelete?.title}
        itemRubrik={epaperToDelete?.edition}
        itemImage={epaperToDelete?.coverImage}
        warningMessage="Tindakan ini tidak dapat dibatalkan. Berkas PDF dan sampul e-paper akan dihapus permanen dari portal."
        confirmButtonText="Ya, Hapus E-Paper"
      />
    </div>
  );
}

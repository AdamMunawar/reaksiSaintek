'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/repository';
import { RubrikItem, Article } from '@/lib/db/schema';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Palette,
  Smile,
  X
} from 'lucide-react';

const PRESET_COLORS = [
  '#2563EB', // Blue
  '#0891B2', // Cyan
  '#7C3AED', // Purple
  '#059669', // Emerald
  '#DB2777', // Pink
  '#EA580C', // Orange
  '#D97706', // Amber
  '#DC2626', // Red
  '#475569', // Slate
  '#4F46E5', // Indigo
  '#0D9488', // Teal
  '#BE185D', // Rose
];

import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { PageTitle } from '@/components/ui/PageTitle';

export default function AdminRubrikPage() {
  const [rubriks, setRubriks] = useState<RubrikItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [rubrikToDelete, setRubrikToDelete] = useState<RubrikItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [isAutoSlug, setIsAutoSlug] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = db.getRubriks();
    setRubriks(list);
    setArticles(db.getArticles());
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setIsAutoSlug(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RubrikItem) => {
    setEditId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description);
    setColor(item.color);
    setIsAutoSlug(false);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (isAutoSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ type: 'error', message: 'Nama rubrik tidak boleh kosong.' });
      return;
    }
    if (!slug.trim()) {
      setNotification({ type: 'error', message: 'Slug URL rubrik tidak boleh kosong.' });
      return;
    }

    // Check duplicate slug
    const duplicate = rubriks.find(
      (r) => r.slug.toLowerCase() === slug.trim().toLowerCase() && r.id !== editId
    );
    if (duplicate) {
      setNotification({ type: 'error', message: `Slug "${slug}" sudah digunakan oleh rubrik lain.` });
      return;
    }

    db.saveRubrik({
      id: editId || undefined,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      color,
      emoji: '',
    });

    setNotification({
      type: 'success',
      message: editId ? 'Rubrik berhasil diperbarui!' : 'Rubrik baru berhasil ditambahkan!',
    });
    setIsModalOpen(false);
    loadData();
    setTimeout(() => setNotification(null), 3000);
  };

  const confirmDeleteRubrik = () => {
    if (!rubrikToDelete) return;
    db.deleteRubrik(rubrikToDelete.id);
    loadData();
    setNotification({ type: 'success', message: `Rubrik "${rubrikToDelete.name}" berhasil dihapus.` });
    setRubrikToDelete(null);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rubriks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newRubriks = [...rubriks];
    const temp = newRubriks[index];
    newRubriks[index] = newRubriks[targetIndex];
    newRubriks[targetIndex] = temp;

    db.reorderRubriks(newRubriks.map((r) => r.id));
    loadData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageTitle title="Kelola Rubrik" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Kelola Rubrik &amp; Kategori
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Atur rubrik portal berita secara dinamis â€” tambah rubrik baru, ubah warna, emoji, urutan, atau hapus rubrik.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:opacity-90 transition-all self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--color-accent)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <Plus size={16} />
          <span>Tambah Rubrik</span>
        </button>
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
            <Layers size={14} />
            <span>Total Rubrik Aktif</span>
          </div>
          <p className="text-2xl font-black mt-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
            {rubriks.length}
          </p>
        </div>

        <div
          className="p-4 rounded-sm border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <Tags size={14} />
            <span>Total Naskah / Artikel</span>
          </div>
          <p className="text-2xl font-black mt-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
            {articles.length}
          </p>
        </div>

        <div
          className="p-4 rounded-sm border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <Sparkles size={14} />
            <span>Status Sinkronisasi</span>
          </div>
          <p className="text-sm font-bold mt-3 text-emerald-600 dark:text-emerald-400">
            ✓ Live di Header &amp; Navigasi
          </p>
        </div>
      </div>

      {/* Rubriks List Table */}
      <div
        className="rounded-sm border overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-keyline)',
          boxShadow: 'var(--shadow-hard-sm)',
        }}
      >
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--color-line)' }}>
          <h2
            className="text-xs font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Daftar Rubrik ({rubriks.length})
          </h2>
          <span className="text-[11px] text-[var(--color-muted)] font-medium">
            Gunakan tombol panah untuk mengubah urutan menu navigasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-wall)', borderBottom: '1px solid var(--color-line)' }}>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] w-14 text-center">Urutan</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Rubrik &amp; Tampilan</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Slug URL</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Deskripsi</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-center">Artikel</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {rubriks.map((r, index) => {
                const count = articles.filter((a) => a.rubrik === r.slug).length;
                return (
                  <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    {/* Order buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-20 transition-opacity"
                          title="Pindah ke atas"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <span className="font-mono font-bold text-[11px] text-[var(--color-muted)] w-4 text-center">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          disabled={index === rubriks.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-20 transition-opacity"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Rubrik Badge Preview & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white rounded-none"
                          style={{ backgroundColor: r.color, fontFamily: 'var(--font-display)' }}
                        >
                          {r.name}
                        </span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      /{r.slug}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-[11px] max-w-xs truncate" style={{ color: 'var(--color-muted)' }}>
                      {r.description || '-'}
                    </td>

                    {/* Article count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold border rounded-full" style={{ borderColor: 'var(--color-line)' }}>
                        {count} artikel
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/${r.slug}`}
                          target="_blank"
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Edit Rubrik"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setRubrikToDelete(r)}
                          className="p-1.5 hover:bg-red-500/10 text-red-600 transition-colors"
                          title="Hapus Rubrik"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-sm border p-6 space-y-5"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
              <div className="flex items-center gap-2">
                <Tags size={18} style={{ color: 'var(--color-accent)' }} />
                <h3
                  className="text-sm font-extrabold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  {editId ? 'Edit Rubrik' : 'Tambah Rubrik Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:opacity-70 text-[var(--color-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Live Preview */}
              <div className="p-3 border rounded-sm" style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                  Preview Badge Rubrik:
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm"
                    style={{ backgroundColor: color, fontFamily: 'var(--font-display)' }}
                  >
                    {name || 'Nama Rubrik'}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--color-muted)]">
                    /{slug || 'slug-rubrik'}
                  </span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Nama Rubrik *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="misal: Kabar Kampus, Saintek, dll."
                  required
                  className="w-full px-3 py-2 font-bold focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                    Slug URL (Alamat Path) *
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-[var(--color-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoSlug}
                      onChange={(e) => setIsAutoSlug(e.target.checked)}
                      className="rounded"
                    />
                    <span>Otomatis dari nama</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <span
                    className="px-2.5 py-2 text-xs border border-r-0 font-mono text-[var(--color-muted)]"
                    style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}
                  >
                    /
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsAutoSlug(false);
                      setSlug(e.target.value);
                    }}
                    placeholder="kabar-kampus"
                    required
                    className="flex-1 px-3 py-2 font-mono focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </div>
              </div>

              {/* Color Picker & Presets */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Warna Identitas Rubrik
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-8 p-0 cursor-pointer border rounded"
                    style={{ borderColor: 'var(--color-line)' }}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-28 px-2 py-1.5 font-mono text-xs uppercase focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-wall)',
                      color: 'var(--color-foreground)',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110 relative"
                      style={{
                        backgroundColor: c,
                        border: color === c ? '2px solid white' : '1px solid rgba(0,0,0,0.1)',
                        boxShadow: color === c ? '0 0 0 2px var(--color-accent)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Deskripsi / Tagline Singkat Rubrik
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ringkasan fokus bahasan naskah di rubrik ini..."
                  className="w-full px-3 py-2 focus:outline-none resize-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 font-bold uppercase tracking-wider border hover:opacity-75 transition-opacity"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                >
                  {editId ? 'Simpan Perubahan' : 'Tambahkan Rubrik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!rubrikToDelete}
        onClose={() => setRubrikToDelete(null)}
        onConfirm={confirmDeleteRubrik}
        title="Konfirmasi Hapus Rubrik"
        itemTitle={rubrikToDelete?.name}
        itemRubrik={`/${rubrikToDelete?.slug || ''}`}
        itemAuthor={rubrikToDelete?.description || undefined}
        warningMessage={
          rubrikToDelete && articles.filter((a) => a.rubrik === rubrikToDelete.slug).length > 0
            ? `Rubrik "${rubrikToDelete.name}" saat ini terhubung dengan ${
                articles.filter((a) => a.rubrik === rubrikToDelete.slug).length
              } artikel. Menghapus rubrik ini akan melepas pengkategorian artikel terkait dari rubrik ini.`
            : `Apakah Anda yakin ingin menghapus rubrik "${rubrikToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmButtonText="Ya, Hapus Rubrik"
      />
    </div>
  );
}
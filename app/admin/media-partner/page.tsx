'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/db/repository';
import { MediaPartnerConfig, MediaPartnerPackage, MediaPartnerStep } from '@/lib/db/schema';
import { DEFAULT_MEDIA_PARTNER } from '@/backend/db/seed';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  Handshake,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Mail,
  MessageCircle,
  Layers,
  ListOrdered,
  FileCheck,
  Sparkles,
  Loader2,
  Check,
  ChevronRight,
  ShieldCheck,
  Upload
} from 'lucide-react';

export default function AdminMediaPartnerPage() {
  const { user, canManagePages } = useAuth();

  const [config, setConfig] = useState<MediaPartnerConfig>(DEFAULT_MEDIA_PARTNER);
  const [activeTab, setActiveTab] = useState<'info' | 'metrics' | 'packages' | 'steps' | 'terms'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit/Add Package Modal or Section State
  const [editingPkg, setEditingPkg] = useState<MediaPartnerPackage | null>(null);
  const [pkgFeatureInput, setPkgFeatureInput] = useState('');

  // Term item input
  const [newTermInput, setNewTermInput] = useState('');

  useEffect(() => {
    try {
      const data = db.getMediaPartnerConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error loading media partner config:', err);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        const updated = db.saveMediaPartnerConfig(config);
        setConfig(updated);
        setNotification({
          type: 'success',
          message: 'Konfigurasi Media Partner & SOP Kerjasama berhasil disimpan dan diperbarui di portal publik!',
        });
        setTimeout(() => setNotification(null), 4000);
      } catch (err) {
        setNotification({
          type: 'error',
          message: 'Terjadi kesalahan saat menyimpan pengaturan.',
        });
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh pengaturan Media Partner ke standar bawaan?')) {
      const reset = db.saveMediaPartnerConfig(DEFAULT_MEDIA_PARTNER);
      setConfig(reset);
      setNotification({
        type: 'success',
        message: 'Pengaturan Media Partner telah dikembalikan ke standar bawaan.',
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Package helpers
  const handleOpenAddPackage = () => {
    setEditingPkg({
      id: `pkg-${Date.now()}`,
      name: '',
      badge: 'Publikasi',
      description: '',
      features: ['Penayangan materi di media sosial', 'Penyebaran informasi broadcast'],
      contraprestasi: 'Pencantuman Logo LPM Reaksi pada poster/banner.',
      highlighted: false,
    });
    setPkgFeatureInput('');
  };

  const handleSavePackage = () => {
    if (!editingPkg || !editingPkg.name.trim()) {
      alert('Nama paket kerjasama wajib diisi.');
      return;
    }

    const exists = config.packages.some((p) => p.id === editingPkg.id);
    let updatedPackages: MediaPartnerPackage[];
    if (exists) {
      updatedPackages = config.packages.map((p) => (p.id === editingPkg.id ? editingPkg : p));
    } else {
      updatedPackages = [...config.packages, editingPkg];
    }

    setConfig({ ...config, packages: updatedPackages });
    setEditingPkg(null);
  };

  const handleDeletePackage = (id: string) => {
    if (window.confirm('Hapus paket kerjasama ini?')) {
      setConfig({
        ...config,
        packages: config.packages.filter((p) => p.id !== id),
      });
    }
  };

  const handleAddFeatureToEditingPkg = () => {
    if (!pkgFeatureInput.trim() || !editingPkg) return;
    setEditingPkg({
      ...editingPkg,
      features: [...editingPkg.features, pkgFeatureInput.trim()],
    });
    setPkgFeatureInput('');
  };

  const handleRemoveFeatureFromEditingPkg = (index: number) => {
    if (!editingPkg) return;
    const feats = [...editingPkg.features];
    feats.splice(index, 1);
    setEditingPkg({ ...editingPkg, features: feats });
  };

  // Terms helpers
  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    setConfig({
      ...config,
      terms: [...config.terms, newTermInput.trim()],
    });
    setNewTermInput('');
  };

  const handleRemoveTerm = (index: number) => {
    const nextTerms = [...config.terms];
    nextTerms.splice(index, 1);
    setConfig({ ...config, terms: nextTerms });
  };

  const handleUpdateStep = (index: number, field: 'title' | 'description', val: string) => {
    const nextSteps = [...config.steps];
    if (nextSteps[index]) {
      nextSteps[index] = { ...nextSteps[index], [field]: val };
      setConfig({ ...config, steps: nextSteps });
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Kelola Media Partner & SOP" />

      {/* Top Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: 'var(--color-line)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
          >
            <Handshake size={20} />
          </div>
          <div>
            <h1
              className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Kelola Media Partner &amp; SOP
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Kelola kontak humas, paket kemitraan, alur pengajuan, dan syarat kerjasama publikasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/media-partner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-75 transition-opacity"
            style={{
              borderColor: 'var(--color-line)',
              backgroundColor: 'var(--color-surface)',
              fontFamily: 'var(--font-display)',
              color: 'var(--color-foreground)',
            }}
          >
            <span>Lihat Halaman Publik</span>
            <ExternalLink size={13} />
          </Link>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-75 transition-opacity text-amber-600 dark:text-amber-400"
            style={{
              borderColor: 'var(--color-line)',
              backgroundColor: 'var(--color-surface)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* Navigation Tabs */}
      <div className="flex border-b overflow-x-auto no-scrollbar gap-1" style={{ borderColor: 'var(--color-line)' }}>
        {[
          { id: 'info', label: 'Kontak & Informasi Utama', icon: MessageCircle },
          { id: 'metrics', label: 'Statistik Audiens', icon: Sparkles },
          { id: 'packages', label: `Paket Kemitraan (${config.packages.length})`, icon: Layers },
          { id: 'steps', label: 'Alur & Prosedur SOP', icon: ListOrdered },
          { id: 'terms', label: 'Syarat & Ketentuan', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-extrabold'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KONTAK & INFORMASI UTAMA */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="p-5 rounded-sm space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <h2 className="text-xs font-extrabold uppercase tracking-wider pb-2 border-b" style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}>
              Teks Judul &amp; Sambutan Hero
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                Judul Utama Halaman
              </label>
              <input
                type="text"
                value={config.heroTitle}
                onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
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
                Deskripsi / Subjudul Hero
              </label>
              <textarea
                rows={4}
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none resize-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                Tautan Berkas Unduh Logo (.PNG)
              </label>
              <input
                type="text"
                value={config.logoDownloadUrl}
                onChange={(e) => setConfig({ ...config, logoDownloadUrl: e.target.value })}
                placeholder="/images/reaksi.png"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>
          </div>

          <div
            className="p-5 rounded-sm space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            <h2 className="text-xs font-extrabold uppercase tracking-wider pb-2 border-b" style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}>
              Kontak Resmi Humas &amp; Kemitraan
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                Nomor WhatsApp Humas
              </label>
              <input
                type="text"
                value={config.whatsappNumber}
                onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                placeholder="Contoh: 6281234567890"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
              <p className="text-[10px] text-[var(--color-muted)] mt-1">
                Gunakan kode negara (62) di awal tanpa tanda plus atau spasi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                Template Pesan Awal WhatsApp
              </label>
              <textarea
                rows={3}
                value={config.whatsappText}
                onChange={(e) => setConfig({ ...config, whatsappText: e.target.value })}
                placeholder="Pesan salam pembuka otomatis saat tombol WA ditekan..."
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none resize-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                Email Pengajuan Proposal Kemitraan
              </label>
              <input
                type="email"
                value={config.contactEmail}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                placeholder="redaksi@reaksi.id"
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
      )}

      {/* TAB 2: STATISTIK AUDIENS */}
      {activeTab === 'metrics' && (
        <div
          className="p-6 rounded-sm space-y-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Statistik &amp; Kredibilitas Audiens
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Data ini ditampilkan pada 3 kotak sorotan di bagian atas halaman publik untuk meyakinkan calon mitra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metrik 1 */}
            <div className="p-4 border space-y-3" style={{ borderColor: 'var(--color-line)' }}>
              <span className="text-[11px] font-extrabold uppercase text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
                Kartu 1: Target Pembaca
              </span>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Angka / Judul</label>
                <input
                  type="text"
                  value={config.metricAudience}
                  onChange={(e) => setConfig({ ...config, metricAudience: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold"
                  style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Keterangan Singkat</label>
                <textarea
                  rows={2}
                  value={config.metricAudienceDesc}
                  onChange={(e) => setConfig({ ...config, metricAudienceDesc: e.target.value })}
                  className="w-full px-3 py-2 text-xs"
                  style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                />
              </div>
            </div>

            {/* Metrik 2 */}
            <div className="p-4 border space-y-3" style={{ borderColor: 'var(--color-line)' }}>
              <span className="text-[11px] font-extrabold uppercase text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
                Kartu 2: Multi-Channel
              </span>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Judul Saluran</label>
                <input
                  type="text"
                  value={config.metricChannels}
                  onChange={(e) => setConfig({ ...config, metricChannels: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold"
                  style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Keterangan Saluran</label>
                <textarea
                  rows={2}
                  value={config.metricChannelsDesc}
                  onChange={(e) => setConfig({ ...config, metricChannelsDesc: e.target.value })}
                  className="w-full px-3 py-2 text-xs"
                  style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                />
              </div>
            </div>

            {/* Metrik 3 */}
            <div className="p-4 border space-y-3" style={{ borderColor: 'var(--color-line)' }}>
              <span className="text-[11px] font-extrabold uppercase text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>
                Kartu 3: Standar Pers
              </span>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Judul Kredibilitas</label>
                <input
                  type="text"
                  value={config.metricStandard}
                  onChange={(e) => setConfig({ ...config, metricStandard: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-600"
                  style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Keterangan Standar</label>
                <textarea
                  rows={2}
                  value={config.metricStandardDesc}
                  onChange={(e) => setConfig({ ...config, metricStandardDesc: e.target.value })}
                  className="w-full px-3 py-2 text-xs"
                  style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAKET KEMITRAAN */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Daftar Paket Kerjasama
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Kelola opsi paket publikasi, liputan, dan kolaborasi strategis yang ditawarkan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddPackage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <Plus size={14} />
              <span>Tambah Paket Baru</span>
            </button>
          </div>

          {/* List Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-5 rounded-sm flex flex-col justify-between relative transition-all"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: pkg.highlighted ? '2px solid var(--color-accent)' : '1px solid var(--color-line)',
                  boxShadow: pkg.highlighted ? 'var(--shadow-hard-sm)' : 'none',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 ${
                        pkg.highlighted ? 'bg-[var(--color-accent)] text-white' : 'bg-blue-500/10 text-blue-600'
                      }`}
                    >
                      {pkg.badge || 'Paket'}
                    </span>

                    {pkg.highlighted && (
                      <span className="text-[9px] font-extrabold uppercase text-amber-500 flex items-center gap-1">
                        <Sparkles size={11} />
                        <span>Sorotan</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="space-y-1.5 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      Layanan &amp; Fasilitas:
                    </p>
                    <ul className="space-y-1 text-xs">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px]">
                          <Check size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-none text-[10px] text-[var(--color-muted)] mb-4">
                    <strong>Kontraprestasi:</strong> {pkg.contraprestasi}
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--color-line)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPkg({ ...pkg });
                      setPkgFeatureInput('');
                    }}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider border hover:opacity-80"
                    style={{ borderColor: 'var(--color-line)' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="p-1 text-red-600 hover:opacity-75"
                    title="Hapus Paket"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Form Edit Paket */}
          {editingPkg && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                className="w-full max-w-lg p-6 rounded-sm space-y-4 max-h-[90vh] overflow-y-auto"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-keyline)',
                  boxShadow: 'var(--shadow-hard)',
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
                  <h3 className="text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {config.packages.some((p) => p.id === editingPkg.id) ? 'Edit Paket Kemitraan' : 'Tambah Paket Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPkg(null)}
                    className="text-xs font-bold px-2 py-1 border hover:opacity-70"
                    style={{ borderColor: 'var(--color-line)' }}
                  >
                    Tutup
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold uppercase mb-1">Nama Paket *</label>
                    <input
                      type="text"
                      value={editingPkg.name}
                      onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                      placeholder="Contoh: Paket Publikasi Media"
                      className="w-full px-3 py-2 font-medium"
                      style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase mb-1">Badge Kategori</label>
                    <input
                      type="text"
                      value={editingPkg.badge || ''}
                      onChange={(e) => setEditingPkg({ ...editingPkg, badge: e.target.value })}
                      placeholder="Contoh: Publikasi Poster / Liputan Jurnalis"
                      className="w-full px-3 py-2 font-medium"
                      style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase mb-1">Deskripsi Ringkas</label>
                    <textarea
                      rows={2}
                      value={editingPkg.description}
                      onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                      placeholder="Penjelasan sasaran acara untuk paket ini..."
                      className="w-full px-3 py-2 font-medium resize-none"
                      style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase mb-1">Fasilitas / Manfaat Kerjasama</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={pkgFeatureInput}
                        onChange={(e) => setPkgFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeatureToEditingPkg();
                          }
                        }}
                        placeholder="Ketik butir fasilitas lalu klik Tambah..."
                        className="flex-1 px-3 py-1.5"
                        style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddFeatureToEditingPkg}
                        className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs"
                      >
                        Tambah
                      </button>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {editingPkg.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 border text-[11px]"
                          style={{ borderColor: 'var(--color-line)' }}
                        >
                          <span className="flex-1 pr-2 truncate">{feat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeatureFromEditingPkg(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase mb-1">Kewajiban / Kontraprestasi Mitra</label>
                    <input
                      type="text"
                      value={editingPkg.contraprestasi}
                      onChange={(e) => setEditingPkg({ ...editingPkg, contraprestasi: e.target.value })}
                      placeholder="Contoh: Pencantuman Logo LPM Reaksi pada poster acara..."
                      className="w-full px-3 py-2 font-medium"
                      style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="highlight-checkbox"
                      checked={!!editingPkg.highlighted}
                      onChange={(e) => setEditingPkg({ ...editingPkg, highlighted: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="highlight-checkbox" className="font-bold text-xs cursor-pointer">
                      Jadikan Paket Pilihan Utama / Sorotan (Highlight)
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-line)' }}>
                  <button
                    type="button"
                    onClick={() => setEditingPkg(null)}
                    className="px-4 py-2 text-xs font-bold uppercase border"
                    style={{ borderColor: 'var(--color-line)' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePackage}
                    className="px-5 py-2 text-xs font-extrabold uppercase text-white"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    Simpan Paket
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ALUR & PROSEDUR SOP */}
      {activeTab === 'steps' && (
        <div
          className="p-6 rounded-sm space-y-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Prosedur &amp; Alur Pengajuan Kemitraan (4 Langkah SOP)
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Sesuaikan tahapan baku permohonan kerjasama bagi panitia atau organisasi luar.
            </p>
          </div>

          <div className="space-y-4">
            {config.steps.map((st, i) => (
              <div
                key={i}
                className="p-4 border rounded-sm flex gap-4 items-start"
                style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-wall)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {st.step || i + 1}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Judul Tahapan Langkah {i + 1}
                    </label>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => handleUpdateStep(i, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Deskripsi Prosedur
                    </label>
                    <textarea
                      rows={2}
                      value={st.description}
                      onChange={(e) => handleUpdateStep(i, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs resize-none"
                      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SYARAT & KETENTUAN */}
      {activeTab === 'terms' && (
        <div
          className="p-6 rounded-sm space-y-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Syarat &amp; Ketentuan Umum Kemitraan
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Aturan kepatuhan hukum, integritas kode etik pers, dan batas waktu pengiriman materi publikasi.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTermInput}
                onChange={(e) => setNewTermInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
                placeholder="Ketik butir syarat baru lalu klik Tambah..."
                className="flex-1 px-3 py-2 text-xs font-medium"
                style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider"
              >
                Tambah Syarat
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {config.terms.map((term, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 p-3 border rounded-sm"
                  style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-wall)' }}
                >
                  <div className="flex items-start gap-2 flex-1">
                    <span className="font-bold text-xs text-[var(--color-accent)]">{index + 1}.</span>
                    <p className="text-xs leading-relaxed">{term}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Hapus butir syarat ini"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

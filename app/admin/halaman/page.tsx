'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/repository';
import { SitePageContent } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  Save,
  CheckCircle2,
  BookOpen,
  Target,
  Send,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AdminPagesManager() {
  const [activeTab, setActiveTab] = useState<'tentang' | 'visi-misi' | 'kirim-tulisan'>('tentang');

  // Form states for Tentang
  const [tentangTitle, setTentangTitle] = useState('');
  const [tentangDesc, setTentangDesc] = useState('');
  const [tentangMainText, setTentangMainText] = useState('');

  // Form states for Visi Misi
  const [visiText, setVisiText] = useState('');
  const [misiList, setMisiList] = useState<string[]>([]);

  // Form states for Kirim Tulisan
  const [kirimTitle, setKirimTitle] = useState('');
  const [kirimDesc, setKirimDesc] = useState('');
  const [kirimMainText, setKirimMainText] = useState('');
  const [kirimEmail, setKirimEmail] = useState('');
  const [kirimWhatsapp, setKirimWhatsapp] = useState('');
  const [kirimRules, setKirimRules] = useState<string[]>([]);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadPagesData();
  }, []);

  const loadPagesData = () => {
    const tentang = db.getPageBySlug('tentang');
    if (tentang) {
      setTentangTitle(tentang.title);
      setTentangDesc(tentang.description);
      setTentangMainText(tentang.mainText);
      if (tentang.extraContent) {
        setVisiText(tentang.extraContent.visi || '');
        setMisiList(tentang.extraContent.misi || []);
      }
    }

    const kirim = db.getPageBySlug('kirim-tulisan');
    if (kirim) {
      setKirimTitle(kirim.title);
      setKirimDesc(kirim.description);
      setKirimMainText(kirim.mainText);
      if (kirim.extraContent) {
        setKirimEmail(kirim.extraContent.emailTarget || '');
        setKirimWhatsapp(kirim.extraContent.whatsappTarget || '');
        setKirimRules(kirim.extraContent.rules || []);
      }
    }
  };

  const handleSaveTentang = () => {
    db.savePage('tentang', {
      title: tentangTitle,
      description: tentangDesc,
      mainText: tentangMainText,
      extraContent: {
        visi: visiText,
        misi: misiList,
      },
    });
    setNotification('Konten halaman "Tentang Kami & Visi Misi" berhasil disimpan dan live!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveKirim = () => {
    db.savePage('kirim-tulisan', {
      title: kirimTitle,
      description: kirimDesc,
      mainText: kirimMainText,
      extraContent: {
        emailTarget: kirimEmail,
        whatsappTarget: kirimWhatsapp,
        rules: kirimRules,
      },
    });
    setNotification('Panduan "Kirim Tulisan" berhasil disimpan dan live!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle title="Kelola Halaman Statis" />
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-600" style={{ fontFamily: 'var(--font-display)' }}>
          <Sparkles size={13} />
          <span>Khusus Superadmin</span>
        </div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
        >
          Kelola Halaman Lembaga
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
          Edit konten teks profil Tentang Kami, Visi &amp; Misi, serta Panduan Kirim Tulisan secara dinamis tanpa hardcode.
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-none flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b overflow-x-auto whitespace-nowrap pb-0.5" style={{ borderColor: 'var(--color-line)' }}>
        <button
          onClick={() => setActiveTab('tentang')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'tentang'
              ? 'border-[var(--color-accent)] text-[var(--color-foreground)]'
              : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tentang Kami &amp; Visi Misi
        </button>

        <button
          onClick={() => setActiveTab('kirim-tulisan')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'kirim-tulisan'
              ? 'border-[var(--color-accent)] text-[var(--color-foreground)]'
              : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Panduan Kirim Tulisan
        </button>
      </div>

      {/* TAB 1: Tentang Kami & Visi Misi */}
      {activeTab === 'tentang' && (
        <div
          className="p-6 rounded-sm space-y-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Profil Lembaga &amp; Deskripsi
            </h2>
            <Link
              href="/tentang"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[var(--color-accent)] hover:underline"
            >
              <span>Lihat Halaman Live</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Judul Halaman
            </label>
            <input
              type="text"
              value={tentangTitle}
              onChange={(e) => setTentangTitle(e.target.value)}
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
              Sub-Deskripsi Singkat
            </label>
            <input
              type="text"
              value={tentangDesc}
              onChange={(e) => setTentangDesc(e.target.value)}
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
              Teks Narasi Profil Lembaga
            </label>
            <textarea
              rows={6}
              value={tentangMainText}
              onChange={(e) => setTentangMainText(e.target.value)}
              className="w-full p-3 text-xs font-normal leading-relaxed focus:outline-none"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Visi &amp; Misi Lembaga
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
                  Pernyataan Visi
                </label>
                <textarea
                  rows={2}
                  value={visiText}
                  onChange={(e) => setVisiText(e.target.value)}
                  className="w-full p-2.5 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
                  Poin-Poin Misi (1 baris per misi)
                </label>
                <textarea
                  rows={4}
                  value={misiList.join('\n')}
                  onChange={(e) => setMisiList(e.target.value.split('\n').filter((l) => l.trim().length > 0))}
                  className="w-full p-2.5 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleSaveTentang}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <Save size={15} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Panduan Kirim Tulisan */}
      {activeTab === 'kirim-tulisan' && (
        <div
          className="p-6 rounded-sm space-y-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Pengaturan Panduan Kirim Tulisan
            </h2>
            <Link
              href="/kirim-tulisan"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[var(--color-accent)] hover:underline"
            >
              <span>Lihat Halaman Live</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Judul Halaman
            </label>
            <input
              type="text"
              value={kirimTitle}
              onChange={(e) => setKirimTitle(e.target.value)}
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Email Target Redaksi
              </label>
              <input
                type="email"
                value={kirimEmail}
                onChange={(e) => setKirimEmail(e.target.value)}
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
                Nomor WhatsApp Kontak
              </label>
              <input
                type="text"
                value={kirimWhatsapp}
                onChange={(e) => setKirimWhatsapp(e.target.value)}
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
              Syarat &amp; Ketentuan Naskah (1 baris per aturan)
            </label>
            <textarea
              rows={5}
              value={kirimRules.join('\n')}
              onChange={(e) => setKirimRules(e.target.value.split('\n').filter((l) => l.trim().length > 0))}
              className="w-full p-3 text-xs font-medium focus:outline-none leading-relaxed"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
              }}
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleSaveKirim}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              <Save size={15} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
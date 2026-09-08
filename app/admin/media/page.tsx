'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/db/repository';
import { MediaItem } from '@/lib/db/schema';
import ImageUploader from '@/components/ui/ImageUploader';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  Upload,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

export default function MediaLibraryPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = () => {
    setMediaList(db.getMedia());
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const filename = newFilename.trim() || newUrl.split('/').pop()?.split('?')[0] || `media-${Date.now()}.png`;

    db.saveMedia({
      filename,
      url: newUrl.trim(),
      size: 120000,
      mimeType: 'image/jpeg',
      uploadedBy: 'Redaksi',
    });

    setNewUrl('');
    setNewFilename('');
    setIsAdding(false);
    loadMedia();
  };

  const confirmDelete = () => {
    if (mediaToDelete) {
      db.deleteMedia(mediaToDelete.id);
      setMediaToDelete(null);
      loadMedia();
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Pustaka Media" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Media Library
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Galeri gambar, cover artikel, dan aset visual portal berita LPM Reaksi.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
        >
          <Plus size={15} />
          <span>Tambah Media Baru</span>
        </button>
      </div>

      {/* Add Media Box */}
      {isAdding && (
        <div
          className="p-5 rounded-sm space-y-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-line)' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Unggah File Foto atau Input URL
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs font-bold uppercase hover:opacity-70"
              style={{ color: 'var(--color-muted)' }}
            >
              Tutup
            </button>
          </div>

          <ImageUploader
            value={newUrl}
            onChange={(url) => {
              setNewUrl(url);
              loadMedia();
            }}
            label="Unggah File Foto (Otomatis Kompresi Ringan)"
            helperText="Foto otomatis dikompresi menjadi WebP ringan di browser sebelum diunggah (hemat storage hosting)."
            saveToMediaLibrary={true}
          />
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mediaList.map((m) => (
          <div
            key={m.id}
            className="group rounded-sm overflow-hidden flex flex-col justify-between transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
            }}
          >
            <div className="aspect-square relative bg-gray-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={m.url}
                alt={m.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-2.5 space-y-2">
              <span className="text-[10px] font-bold block truncate" style={{ color: 'var(--color-foreground)' }}>
                {m.filename}
              </span>

              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(m.url, m.id)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase hover:opacity-70"
                  style={{ color: copiedId === m.id ? '#059669' : 'var(--color-accent)' }}
                >
                  {copiedId === m.id ? (
                    <>
                      <Check size={12} />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Salin URL</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMediaToDelete(m)}
                  className="text-red-500 hover:opacity-70 p-1"
                  title="Hapus Media"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!mediaToDelete}
        onClose={() => setMediaToDelete(null)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Media"
        itemTitle={mediaToDelete?.filename}
        itemImage={mediaToDelete?.url}
        itemRubrik="Media Library"
        itemAuthor={mediaToDelete?.uploadedBy || 'Redaksi'}
        warningMessage={`File foto "${mediaToDelete?.filename}" akan dihapus permanen dari media library portal LPM Reaksi. Gambar tidak akan dapat diakses kembali.`}
        confirmButtonText="Ya, Hapus Media"
      />
    </div>
  );
}
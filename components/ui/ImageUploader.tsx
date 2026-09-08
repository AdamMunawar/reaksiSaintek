'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { optimizeImageInBrowser, formatBytes, OptimizedResult } from '@/lib/utils/imageOptimizer';
import { db } from '@/lib/db/repository';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  authorName?: string;
  maxWidth?: number;
  quality?: number;
  aspectRatio?: 'video' | 'square' | 'auto';
  helperText?: string;
  saveToMediaLibrary?: boolean;
  allowUrlInput?: boolean;
  required?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Foto / Gambar',
  authorName = 'Redaksi',
  maxWidth = 1400,
  quality = 0.8,
  aspectRatio = 'video',
  helperText = '',
  saveToMediaLibrary = true,
  allowUrlInput = false,
  required = false,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [optimizationStats, setOptimizationStats] = useState<OptimizedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap pilih file gambar yang valid (JPG, PNG, WebP).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setStatusMessage('Mengoptimasi & mengompresi gambar di browser...');

    try {
      // 1. Kompresi di browser (Canvas WebP) -> 0% CPU server!
      const optimized = await optimizeImageInBrowser(file, {
        maxWidth,
        quality,
        targetFormat: 'image/webp',
      });

      setOptimizationStats(optimized);
      setStatusMessage('Mengunggah file terkompresi...');

      // 2. Upload via API Route
      const formData = new FormData();
      formData.append('file', optimized.file);
      formData.append('author', authorName);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        onChange(data.url);
        setStatusMessage('Foto berhasil diunggah & siap digunakan!');

        // Optional: otomatis simpan ke media library
        if (saveToMediaLibrary) {
          try {
            db.saveMedia({
              filename: data.filename || optimized.file.name,
              url: data.url,
              size: optimized.compressedSize,
              mimeType: 'image/webp',
              uploadedBy: authorName,
            });
          } catch (e) {
            console.warn('Gagal menyimpan ke repo media lokal:', e);
          }
        }
      } else {
        // Fallback jika API gagal: gunakan data URL langsung
        onChange(optimized.dataUrl);
        setStatusMessage('Foto berhasil dioptimasi.');
      }
    } catch (err: any) {
      console.error('Gagal memproses gambar:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange('');
    setOptimizationStats(null);
    setStatusMessage(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Label and Mode Switch */}
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-bold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {allowUrlInput && (
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${
                mode === 'upload'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${
                mode === 'url'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Input URL
            </button>
          </div>
        )}
      </div>

      {/* Mode 1: File Upload with Browser Compression */}
      {mode === 'upload' || !allowUrlInput ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={onFileInputChange}
            className="hidden"
          />

          {!value ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-[var(--color-accent)] bg-blue-500/5'
                  : 'hover:border-[var(--color-accent)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                borderColor: isDragging ? 'var(--color-accent)' : 'var(--color-line)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {isProcessing ? (
                <div className="py-2 flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {statusMessage || 'Memproses gambar...'}
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-wall)', border: '1px solid var(--color-line)' }}
                  >
                    <UploadCloud size={20} style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>
                    Upload Foto
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Uploaded Preview */
            <div
              className="p-3 border rounded-sm space-y-3 overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
              }}
            >
              {/* Image Preview */}
              <div
                className={`w-full relative overflow-hidden bg-gray-100 dark:bg-slate-800 border ${
                  aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
                }`}
                style={{ borderColor: 'var(--color-line)' }}
              >
                <img
                  src={value}
                  alt="Preview Unggahan"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Status & Stats */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} className="flex-shrink-0" />
                  <span>Foto Siap Digunakan</span>
                </div>

                {/* Compression Stats Badge */}
                {optimizationStats && (
                  <div className="w-full text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2.5 py-1.5 border border-blue-500/20 flex flex-wrap items-center justify-between gap-1">
                    <span className="flex items-center gap-1">
                      <span>Asli: <b>{formatBytes(optimizationStats.originalSize)}</b></span>
                      <ArrowRight size={10} />
                      <span>WebP: <b>{formatBytes(optimizationStats.compressedSize)}</b></span>
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      Hemat {optimizationStats.compressionRatio}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: 2-column grid, neat and clean */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-2 text-[11px] font-bold uppercase border hover:opacity-80 flex items-center justify-center gap-1.5 transition-opacity"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', backgroundColor: 'var(--color-wall)' }}
                >
                  <RefreshCw size={12} />
                  <span>Ganti Foto</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full py-1.5 px-2 text-[11px] font-bold uppercase text-red-600 hover:bg-red-500/10 flex items-center justify-center gap-1.5 border border-red-500/25 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Direct URL Input */
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: 'var(--color-wall)',
                color: 'var(--color-foreground)',
                border: '1px solid var(--color-line)',
              }}
            />
          </div>
          {value && (
            <div className="aspect-video max-h-48 bg-gray-100 dark:bg-slate-800 overflow-hidden border" style={{ borderColor: 'var(--color-line)' }}>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

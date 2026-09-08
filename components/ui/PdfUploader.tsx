'use client';

import React, { useState, useRef } from 'react';
import { FileText, Upload, X, CheckCircle2, AlertCircle, Eye, Download } from 'lucide-react';

interface PdfUploaderProps {
  value: string; // PDF data URL or external URL
  onChange: (url: string, fileInfo?: { name: string; size: string; pages?: number }) => void;
  fileName?: string;
  fileSize?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export default function PdfUploader({
  value,
  onChange,
  fileName,
  fileSize,
  label = 'Unggah Berkas PDF E-Paper / Buletin / Tabloid',
  helperText = 'Format berkas wajib .PDF. Maksimal ukuran disarankan hingga 25MB.',
  required = false,
}: PdfUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentName, setCurrentName] = useState(fileName || '');
  const [currentSize, setCurrentSize] = useState(fileSize || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = (file: File) => {
    setError(null);

    // Validate mime type or extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Format berkas tidak valid! Harap pilih berkas dengan format .PDF.');
      return;
    }

    // 35MB limit
    if (file.size > 35 * 1024 * 1024) {
      setError('Ukuran berkas melebihi batas 35MB. Silakan kompresi PDF terlebih dahulu.');
      return;
    }

    setLoading(true);

    // 1. Inspect Magic Bytes (%PDF-)
    const headerSlice = file.slice(0, 5);
    const headerReader = new FileReader();
    headerReader.onload = () => {
      const arr = new Uint8Array(headerReader.result as ArrayBuffer);
      // '%PDF' in ASCII is 0x25 0x50 0x44 0x46
      const isMagicPdf = arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46;
      if (!isMagicPdf) {
        setLoading(false);
        setError('Validasi keamanan gagal: Berkas ini bukan dokumen PDF yang sah (Magic Bytes mismatch).');
        return;
      }

      // 2. Magic bytes valid, proceed to read full file
      const sizeStr = formatBytes(file.size);
      setCurrentName(file.name);
      setCurrentSize(sizeStr);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLoading(false);
        onChange(result, {
          name: file.name,
          size: sizeStr,
        });
      };
      reader.onerror = () => {
        setLoading(false);
        setError('Gagal membaca berkas PDF. Silakan coba lagi.');
      };
      reader.readAsDataURL(file);
    };

    headerReader.onerror = () => {
      setLoading(false);
      setError('Gagal memverifikasi integritas berkas.');
    };

    headerReader.readAsArrayBuffer(headerSlice);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('', undefined);
    setCurrentName('');
    setCurrentSize('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-bold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>PDF Terpasang</span>
          </span>
        )}
      </div>

      {value ? (
        /* PDF Attached Box */
        <div
          className="p-4 rounded-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--color-wall)',
            borderColor: 'var(--color-line)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sm bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs truncate block" style={{ color: 'var(--color-foreground)' }}>
                {currentName || 'Berkas E-Paper LPM Reaksi.pdf'}
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-muted)]">
                {currentSize ? `Ukuran: ${currentSize}` : 'Siap dipublikasikan'} &bull; Format PDF
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 text-xs font-bold uppercase border hover:opacity-75 inline-flex items-center gap-1"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)' }}
            >
              <Eye size={12} />
              <span>Pratinjau</span>
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-red-600 hover:opacity-75 border border-red-500/30"
              title="Hapus / Ganti Berkas PDF"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-sm border-2 border-dashed text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[var(--color-accent)] bg-blue-500/5'
              : 'border-[var(--color-line)] hover:border-[var(--color-accent)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{ backgroundColor: 'var(--color-wall)' }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-red-500/10 text-red-600 mb-3">
            {loading ? (
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={22} />
            )}
          </div>

          <p className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}>
            {loading ? 'Memproses Berkas PDF...' : 'Klik atau Tarik Berkas PDF ke Sini'}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
            {helperText}
          </p>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

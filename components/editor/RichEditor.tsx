'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  X,
  Check,
  Type,
} from 'lucide-react';
import { optimizeImageInBrowser } from '@/lib/utils/imageOptimizer';
import { cleanArticleHtml } from '@/lib/utils/cleanHtml';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// Convert legacy markdown into HTML for initial load if existing article has markdown syntax
function convertLegacyMarkdownToHtml(text: string): string {
  if (!text) return '';
  const isHtml =
    /^\s*<[a-z]/i.test(text) ||
    text.includes('<p>') ||
    text.includes('<div') ||
    text.includes('<figure') ||
    text.includes('<blockquote');
  if (isHtml) return text;

  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<figure') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<blockquote')
      ) {
        return trimmed;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2>${trimmed.replace(/^## /, '')}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3>${trimmed.replace(/^### /, '')}</h3>`;
      }
      if (trimmed.startsWith('> ')) {
        return `<blockquote>${trimmed.replace(/^> /, '')}</blockquote>`;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed
          .split('\n')
          .map((li) => `<li>${li.replace(/^[-*]\s+/, '')}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed
          .split('\n')
          .map((li) => `<li>${li.replace(/^\d+\.\s+/, '')}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }
      const formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; height:auto;" />')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n/g, '<br />');

      return `<p>${formatted}</p>`;
    })
    .join('');
}

export default function RichEditor({
  value,
  onChange,
  placeholder = 'Tulis naskah artikel Anda di sini...',
  minHeight = '340px',
}: RichEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isInternalChangeRef = useRef(false);

  // Modal Atur Sisipkan Foto di Sela-sela Artikel
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalCaption, setModalCaption] = useState('');
  const [modalAlign, setModalAlign] = useState<'center' | 'left' | 'right'>('center');
  const [modalSize, setModalSize] = useState<'100%' | '75%' | '50%' | '35%'>('100%');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hitung jumlah kata & status kosong
  const updateStats = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const trimmed = text.trim();
    const count = trimmed ? trimmed.split(/\s+/).length : 0;
    setWordCount(count);

    const html = editorRef.current.innerHTML.trim();
    setIsEmpty(!trimmed && (!html || html === '<br>' || html === '<p><br></p>'));
  }, []);

  // Simpan seleksi kursor saat ini sebelum membuka dialog/modal
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Pulihkan seleksi kursor
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // Sync perubahan konten editor ke parent
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    isInternalChangeRef.current = true;
    const html = editorRef.current.innerHTML;
    // Bersihkan wrapper dan inline style yang tidak sesuai standar web
    const cleaned = cleanArticleHtml(html);
    onChange(cleaned);
    updateStats();
  };

  // Tangani paste secara cerdas (misal: copy dari Google Docs atau Word)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      const cleaned = cleanArticleHtml(html);
      document.execCommand('insertHTML', false, cleaned);
      handleEditorInput();
      return;
    }
  };

  // Eksekusi formatting WYSIWYG
  const executeCommand = (command: string, cmdValue: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand(command, false, cmdValue);
    } catch (e) {
      console.error('Command failed:', command, e);
    }
    handleEditorInput();
  };

  // Inisialisasi konten pertama kali atau jika diubah dari luar secara signifikan
  useEffect(() => {
    if (editorRef.current) {
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        return;
      }
      const formattedHtml = convertLegacyMarkdownToHtml(value || '');
      if (editorRef.current.innerHTML !== formattedHtml) {
        editorRef.current.innerHTML = formattedHtml;
        updateStats();
      }
    }
  }, [value, updateStats]);

  // Upload foto inline di naskah
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saveSelection();
    setIsUploadingImage(true);
    try {
      // 1. Kompresi gambar di browser
      const optimized = await optimizeImageInBrowser(file, {
        maxWidth: 1200,
        quality: 0.8,
        targetFormat: 'image/webp',
      });

      // 2. Upload ke server API
      const formData = new FormData();
      formData.append('file', optimized.file);
      formData.append('author', 'Penulis Naskah');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const finalUrl = data.url || optimized.dataUrl;
      const desc = file.name.replace(/\.[^/.]+$/, '');

      // Buka modal pengaturan posisi & ukuran foto
      setModalImageUrl(finalUrl);
      setModalCaption(`Foto: Dokumentasi LPM Reaksi / ${desc}`);
      setModalAlign('center');
      setModalSize('100%');
      setImageModalOpen(true);
    } catch (err) {
      console.error('Gagal mengunggah foto naskah:', err);
      setUploadError('Gagal memproses dan mengunggah foto naskah. Pastikan format file adalah gambar valid.');
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sisipkan foto terkonfigurasi ke dalam konten WYSIWYG
  const handleInsertConfiguredImage = () => {
    if (!modalImageUrl || !editorRef.current) return;

    const cleanCaption = modalCaption.trim();
    const capHtml = cleanCaption
      ? `<figcaption style="font-size: 11.5px; color: var(--color-muted); font-style: italic; margin-top: 6px; text-align: ${modalAlign}; font-family: var(--font-body);">${cleanCaption}</figcaption>`
      : '';

    let figureHtml = '';
    if (modalAlign === 'center') {
      figureHtml = `<figure style="text-align: center; max-width: ${modalSize}; margin: 1.5rem auto; clear: both;"><img src="${modalImageUrl}" alt="${cleanCaption || 'Foto Artikel'}" style="width: 100%; height: auto; border-radius: 4px; display: block; margin: 0 auto;" />${capHtml}</figure><p><br></p>`;
    } else if (modalAlign === 'left') {
      figureHtml = `<figure style="float: left; max-width: ${modalSize}; margin: 0.5rem 1.5rem 1rem 0;"><img src="${modalImageUrl}" alt="${cleanCaption || 'Foto Artikel'}" style="width: 100%; height: auto; border-radius: 4px;" />${capHtml}</figure><p><br></p>`;
    } else {
      figureHtml = `<figure style="float: right; max-width: ${modalSize}; margin: 0.5rem 0 1rem 1.5rem;"><img src="${modalImageUrl}" alt="${cleanCaption || 'Foto Artikel'}" style="width: 100%; height: auto; border-radius: 4px;" />${capHtml}</figure><p><br></p>`;
    }

    editorRef.current.focus();
    restoreSelection();

    try {
      // Coba masukkan di posisi kursor
      const success = document.execCommand('insertHTML', false, figureHtml);
      if (!success) {
        editorRef.current.innerHTML += figureHtml;
      }
    } catch {
      editorRef.current.innerHTML += figureHtml;
    }

    handleEditorInput();
    setImageModalOpen(false);
    setModalImageUrl('');
    setModalCaption('');
    savedRangeRef.current = null;
  };

  const handleInsertLink = () => {
    saveSelection();
    const url = prompt('Masukkan URL tautan web (misal: https://...):');
    if (url && url.trim()) {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand('createLink', false, url.trim());
      handleEditorInput();
    }
  };

  const handleOpenImageUrlModal = () => {
    saveSelection();
    const url = prompt('Masukkan URL Gambar (misal: https://...):');
    if (url && url.trim()) {
      setModalImageUrl(url.trim());
      setModalCaption('Foto: Dokumentasi LPM Reaksi');
      setModalAlign('center');
      setModalSize('100%');
      setImageModalOpen(true);
    }
  };

  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className="rounded-sm overflow-hidden relative"
      style={{
        border: '1px solid var(--color-line)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* ── Scoped CSS styling for live visual WYSIWYG ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .reaksi-wysiwyg h2 {
              font-size: 1.5rem !important;
              font-weight: 800 !important;
              margin-top: 1.5rem !important;
              margin-bottom: 0.5rem !important;
              font-family: var(--font-display) !important;
              line-height: 1.3 !important;
              color: var(--color-foreground) !important;
            }
            .reaksi-wysiwyg h3 {
              font-size: 1.25rem !important;
              font-weight: 700 !important;
              margin-top: 1.25rem !important;
              margin-bottom: 0.4rem !important;
              font-family: var(--font-display) !important;
              line-height: 1.3 !important;
              color: var(--color-foreground) !important;
            }
            .reaksi-wysiwyg p {
              margin-bottom: 1rem !important;
              line-height: 1.75 !important;
            }
            .reaksi-wysiwyg blockquote {
              border-left: 4px solid var(--color-accent) !important;
              padding: 0.5rem 1rem !important;
              margin: 1.25rem 0 !important;
              font-style: italic !important;
              background-color: rgba(59, 130, 246, 0.05) !important;
              font-size: 1.05rem !important;
            }
            .reaksi-wysiwyg ul {
              list-style-type: disc !important;
              margin-left: 1.5rem !important;
              margin-bottom: 1rem !important;
            }
            .reaksi-wysiwyg ol {
              list-style-type: decimal !important;
              margin-left: 1.5rem !important;
              margin-bottom: 1rem !important;
            }
            .reaksi-wysiwyg li {
              margin-bottom: 0.35rem !important;
            }
            .reaksi-wysiwyg a {
              color: var(--color-accent) !important;
              text-decoration: underline !important;
              font-weight: 600 !important;
            }
            .reaksi-wysiwyg figure {
              margin: 1.5rem auto !important;
            }
          `,
        }}
      />

      {/* ── WYSIWYG Toolbar ── */}
      <div
        className="px-3 py-2 flex flex-wrap items-center justify-between gap-1.5"
        style={{
          backgroundColor: 'var(--color-wall)',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
          {/* Bold */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('bold')}
            title="Tebal (Bold)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Bold size={15} />
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('italic')}
            title="Miring (Italic)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Italic size={15} />
          </button>

          {/* Underline */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('underline')}
            title="Garis Bawah (Underline)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <UnderlineIcon size={15} />
          </button>

          <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-line)' }} />

          {/* Align Left */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyLeft')}
            title="Rata Kiri"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <AlignLeft size={15} />
          </button>

          {/* Align Center */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyCenter')}
            title="Rata Tengah"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <AlignCenter size={15} />
          </button>

          {/* Align Right */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyRight')}
            title="Rata Kanan"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <AlignRight size={15} />
          </button>

          {/* Align Justify */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyFull')}
            title="Rata Kanan-Kiri (Justify)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <AlignJustify size={15} />
          </button>

          <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-line)' }} />

          {/* Heading 2 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('formatBlock', '<h2>')}
            title="Subjudul (H2)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Heading2 size={16} />
          </button>

          {/* Heading 3 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('formatBlock', '<h3>')}
            title="Poin Subbagian (H3)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Heading3 size={16} />
          </button>

          {/* Normal Paragraph */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('formatBlock', '<p>')}
            title="Paragraf Biasa"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Type size={15} />
          </button>

          <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-line)' }} />

          {/* Quote */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            title="Kutipan Pernyataan (Blockquote)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-bold"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Quote size={15} />
            <span className="hidden md:inline">Kutipan</span>
          </button>

          {/* Bullet list */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertUnorderedList')}
            title="Daftar Poin (Bullet List)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <List size={15} />
          </button>

          {/* Numbered list */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertOrderedList')}
            title="Daftar Bernomor (Numbered List)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <ListOrdered size={15} />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={handleInsertLink}
            title="Sisipkan Tautan Web"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-foreground)' }}
          >
            <LinkIcon size={15} />
          </button>

          <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-line)' }} />

          {/* Direct File Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInlineImageUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              saveSelection();
              fileInputRef.current?.click();
            }}
            disabled={isUploadingImage}
            title="Upload Foto di Sela Naskah (Atur Posisi & Ukuran)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-bold"
            style={{ color: 'var(--color-accent)' }}
          >
            {isUploadingImage ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span className="hidden sm:inline">Mengunggah...</span>
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                <span className="hidden sm:inline">Upload Foto</span>
              </>
            )}
          </button>

          {/* Image by URL */}
          <button
            type="button"
            onClick={handleOpenImageUrlModal}
            title="Sisipkan Foto via URL Web (Atur Posisi & Ukuran)"
            className="p-1.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-bold"
            style={{ color: 'var(--color-foreground)' }}
          >
            <ImageIcon size={15} />
            <span className="hidden sm:inline">URL Foto</span>
          </button>
        </div>

        {/* Clean WYSIWYG Badge */}
        <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Visual Editor</span>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-4 py-2 text-xs font-semibold bg-red-500/10 text-red-600 border-b border-red-500/20">
          {uploadError}
        </div>
      )}

      {/* ── Editor Body (Pure Visual WYSIWYG - ContentEditable) ── */}
      <div className="relative">
        {isEmpty && (
          <div
            className="absolute top-4 left-4 pointer-events-none text-sm text-[var(--color-muted)] select-none italic"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          onPaste={handlePaste}
          onKeyUp={updateStats}
          onMouseUp={updateStats}
          className="reaksi-wysiwyg w-full p-4 sm:p-5 text-sm sm:text-base leading-relaxed focus:outline-none overflow-y-auto transition-colors"
          style={{
            minHeight,
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-foreground)',
            fontFamily: 'var(--font-serif), Georgia, serif',
          }}
        />
      </div>

      {/* ── Footer Stats ── */}
      <div
        className="px-3 py-1.5 flex items-center justify-between text-[10px] font-medium"
        style={{
          backgroundColor: 'var(--color-wall)',
          borderTop: '1px solid var(--color-line)',
          color: 'var(--color-muted)',
        }}
      >
        <div className="flex items-center gap-3">
          <span>{wordCount} Kata</span>
          <span>&bull;</span>
          <span>Estimasi baca: &plusmn;{readTimeEst} menit</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>Format instan: Blok teks lalu klik tombol di toolbar atas</span>
        </div>
      </div>

      {/* ── Modal Pengaturan Sisipkan Foto di Sela Naskah ── */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="max-w-lg w-full p-6 rounded-sm shadow-2xl space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              color: 'var(--color-foreground)',
            }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <div className="flex items-center gap-2">
                <ImageIcon size={18} style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                  Atur Foto di Sela Artikel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="relative aspect-video w-full rounded overflow-hidden border bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <img
                src={modalImageUrl}
                alt="Pratinjau"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Keterangan / Sumber Foto */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Keterangan / Sumber Foto
              </label>
              <input
                type="text"
                value={modalCaption}
                onChange={(e) => setModalCaption(e.target.value)}
                placeholder="Contoh: Foto: Dokumentasi LPM Reaksi / Ahmad Maulana"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>

            {/* Pilihan Pemosisian */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Pemosisian (Alignment)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'center', label: 'Tengah (Center)', icon: AlignCenter },
                  { id: 'left', label: 'Rata Kiri (Left)', icon: AlignLeft },
                  { id: 'right', label: 'Rata Kanan (Right)', icon: AlignRight },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = modalAlign === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModalAlign(item.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 text-[11px] font-bold border transition-all ${
                        isSelected
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                          : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                      }`}
                    >
                      <Icon size={16} className="mb-1" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilihan Ukuran */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Ukuran Foto
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: '100%', label: 'Penuh (100%)' },
                  { val: '75%', label: 'Besar (75%)' },
                  { val: '50%', label: 'Sedang (50%)' },
                  { val: '35%', label: 'Kecil (35%)' },
                ].map((sz) => {
                  const isSelected = modalSize === sz.val;
                  return (
                    <button
                      key={sz.val}
                      type="button"
                      onClick={() => setModalSize(sz.val as any)}
                      className={`p-2 text-center text-[10px] font-bold border transition-all ${
                        isSelected
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                          : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                      }`}
                    >
                      {sz.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--color-line)' }}>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-70 transition-opacity"
                style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInsertConfiguredImage}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
              >
                <Check size={14} />
                <span>Sisipkan ke Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

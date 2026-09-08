'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, FileText } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemTitle?: string;
  itemRubrik?: string;
  itemAuthor?: string;
  itemImage?: string;
  warningMessage?: string;
  confirmButtonText?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus Artikel',
  itemTitle,
  itemRubrik,
  itemAuthor,
  itemImage,
  warningMessage = 'Tindakan ini tidak dapat dibatalkan. Seluruh isi tulisan beserta statistik pembaca akan dihapus secara permanen dari portal LPM Reaksi.',
  confirmButtonText = 'Ya, Hapus Artikel',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-sm border p-6 space-y-5"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-keyline)',
          boxShadow: 'var(--shadow-hard)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning Icon */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3
                className="text-sm font-extrabold uppercase tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                {title}
              </h3>
              <p className="text-[11px] text-[var(--color-muted)]">
                Harap periksa kembali naskah sebelum menghapus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Item Preview Card */}
        {itemTitle && (
          <div
            className="p-3 border rounded-sm flex items-start gap-3"
            style={{
              backgroundColor: 'var(--color-wall)',
              borderColor: 'var(--color-line)',
            }}
          >
            {itemImage ? (
              <img
                src={itemImage}
                alt="Thumbnail"
                className="w-14 h-12 object-cover rounded-none border flex-shrink-0"
                style={{ borderColor: 'var(--color-line)' }}
              />
            ) : (
              <div
                className="w-12 h-12 flex items-center justify-center border rounded-none flex-shrink-0"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
              >
                <FileText size={18} style={{ color: 'var(--color-muted)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {itemRubrik && (
                <span
                  className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 mb-1 bg-black/10 dark:bg-white/10"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  {itemRubrik}
                </span>
              )}
              <h4
                className="text-xs font-bold line-clamp-2 leading-snug"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                {itemTitle}
              </h4>
              {itemAuthor && (
                <p className="text-[10px] mt-0.5 text-[var(--color-muted)]">
                  Oleh: <span className="font-semibold">{itemAuthor}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warning Text */}
        <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-300 text-xs font-medium leading-relaxed">
          {warningMessage}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border hover:opacity-75 transition-opacity"
            style={{
              borderColor: 'var(--color-line)',
              color: 'var(--color-foreground)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Trash2 size={14} />
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

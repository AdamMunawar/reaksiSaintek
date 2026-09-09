'use client';

import React from 'react';
import { AlertCircle, Send, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';

interface RedakturPublishAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitToEditorial: () => void;
  onProceedDirectPublish: () => void;
  isProcessing?: boolean;
}

export function RedakturPublishAlertModal({
  isOpen,
  onClose,
  onSubmitToEditorial,
  onProceedDirectPublish,
  isProcessing = false,
}: RedakturPublishAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg rounded-sm border shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-keyline)',
          boxShadow: 'var(--shadow-hard-lg)',
        }}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <span
              className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              SOP Alur Redaksi
            </span>
            <h3
              className="text-base sm:text-lg font-extrabold uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              Konfirmasi Penerbitan Naskah
            </h3>
          </div>
        </div>

        {/* Advisory Message Body */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-2">
          <p className="font-semibold">
            Sebagai Redaktur, Anda memiliki wewenang untuk menerbitkan naskah secara langsung.
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            Namun, sesuai SOP Redaksi LPM Reaksi, naskah sangat direkomendasikan untuk <strong>diserahkan ke Meja Redaksi terlebih dahulu</strong> agar dapat melalui tahap kurasi akhir dan peninjauan bersama Pemimpin Redaksi sebelum dipublikasikan ke pembaca umum.
          </p>
        </div>

        <p className="text-xs text-[var(--color-muted)]">
          Pilih langkah yang ingin Anda ambil untuk naskah ini:
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Primary Recommended Option: Send to Editorial Desk */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={onSubmitToEditorial}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Send size={14} />
            <span>Serahkan ke Meja Redaksi (Direkomendasikan)</span>
          </button>

          {/* Secondary Option: Direct Publish Anyway */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={onProceedDirectPublish}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <CheckCircle2 size={14} />
            <span>Tetap Terbitkan Langsung ke Publik</span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Kembali ke Editor Naskah</span>
          </button>
        </div>
      </div>
    </div>
  );
}

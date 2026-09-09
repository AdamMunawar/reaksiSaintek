'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { ReviewComment, ReviewReply } from '@/lib/db/schema';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  CornerDownRight,
  X,
  Check,
  Quote,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InlineCommentSystemProps {
  articleId: string;
  content: string;
  initialComments?: ReviewComment[];
  isEditor?: boolean;
  onCommentsChange?: (comments: ReviewComment[]) => void;
}

export function InlineCommentSystem({
  articleId,
  content,
  initialComments = [],
  isEditor = false,
  onCommentsChange,
}: InlineCommentSystemProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReviewComment[]>(initialComments);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ top: number; left: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [filterState, setFilterState] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [isSideOpen, setIsSideOpen] = useState(true);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial comments or fetch live
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    } else {
      fetchComments();
    }
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.comments)) {
          setComments(data.comments);
          onCommentsChange?.(data.comments);
        }
      }
    } catch (e) {
      console.warn('Failed to load review comments:', e);
    }
  };

  // Text selection handler
  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentContainerRef.current) {
      if (!isComposing) {
        setSelectionRange(null);
        setSelectedText('');
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      if (!isComposing) {
        setSelectionRange(null);
        setSelectedText('');
      }
      return;
    }

    // Check if selection is within our content container
    const range = selection.getRangeAt(0);
    const container = contentContainerRef.current;
    if (!container.contains(range.commonAncestorContainer)) {
      if (!isComposing) {
        setSelectionRange(null);
        setSelectedText('');
      }
      return;
    }

    // Get position relative to container
    const containerRect = container.getBoundingClientRect();
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setSelectionRange({
      top: rect.top - containerRect.top - 46,
      left: Math.max(10, rect.left - containerRect.left + rect.width / 2 - 80),
    });
  };

  // Start new comment on selected text
  const startComment = () => {
    setIsComposing(true);
    setCommentText('');
  };

  const cancelComment = () => {
    setIsComposing(false);
    setCommentText('');
    setSelectionRange(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  // Submit comment
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !selectedText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highlightedText: selectedText.trim(),
          content: commentText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setComments(data.comments);
          onCommentsChange?.(data.comments);
        } else if (data.comment) {
          const updated = [...comments, data.comment];
          setComments(updated);
          onCommentsChange?.(updated);
        }
        cancelComment();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send reply
  const handleSendReply = async (commentId: string) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          commentId,
          replyContent: text.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setComments(data.comments);
          onCommentsChange?.(data.comments);
        }
        setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
      }
    } catch (err) {
      console.error('Error replying to comment:', err);
    }
  };

  // Toggle resolved status
  const handleToggleResolve = async (commentId: string, currentResolved?: boolean) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_resolve',
          commentId,
          resolved: !currentResolved,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setComments(data.comments);
          onCommentsChange?.(data.comments);
        }
      }
    } catch (err) {
      console.error('Error toggling resolve status:', err);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Hapus catatan review ini?')) return;
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          commentId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setComments(data.comments);
          onCommentsChange?.(data.comments);
        }
        if (activeCommentId === commentId) {
          setActiveCommentId(null);
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    if (filterState === 'unresolved') return comments.filter((c) => !c.resolved);
    if (filterState === 'resolved') return comments.filter((c) => c.resolved);
    return comments;
  }, [comments, filterState]);

  const unresolvedCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;

  // Render article content with highlighted spans for commented snippets
  const renderedContent = useMemo(() => {
    if (!content) return null;
    const cleanContent = content.trim();

    // If there are no comments, render standard paragraphs
    if (comments.length === 0) {
      return (
        <div className="whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--color-foreground)' }}>
          {cleanContent}
        </div>
      );
    }

    // Split paragraphs
    const paragraphs = cleanContent.split('\n');

    return paragraphs.map((para, pIdx) => {
      if (!para.trim()) {
        return <div key={pIdx} className="h-4" />;
      }

      // Check if any comments match this paragraph
      let segments: { text: string; commentId?: string; isResolved?: boolean }[] = [{ text: para }];

      comments.forEach((com) => {
        const target = com.highlightedText.trim();
        if (!target) return;

        const newSegments: typeof segments = [];
        segments.forEach((seg) => {
          if (seg.commentId || !seg.text.includes(target)) {
            newSegments.push(seg);
            return;
          }

          const parts = seg.text.split(target);
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              newSegments.push({ text: parts[i] });
            }
            if (i < parts.length - 1) {
              newSegments.push({
                text: target,
                commentId: com.id,
                isResolved: !!com.resolved,
              });
            }
          }
        });
        segments = newSegments;
      });

      return (
        <p key={pIdx} className="text-sm leading-relaxed mb-3">
          {segments.map((seg, sIdx) => {
            if (seg.commentId) {
              const isActive = activeCommentId === seg.commentId;
              return (
                <mark
                  key={sIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentId(seg.commentId || null);
                    // Scroll comment into view
                    const el = document.getElementById(`comment-card-${seg.commentId}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                  className={`cursor-pointer px-1 py-0.5 rounded-none font-medium transition-all inline-flex items-center gap-1 ${
                    seg.isResolved
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border-b-2 border-emerald-500'
                      : isActive
                      ? 'bg-amber-300 text-amber-950 dark:bg-amber-800 dark:text-white border-b-2 border-amber-600 ring-2 ring-amber-500/50'
                      : 'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200 border-b-2 border-amber-500 hover:bg-amber-200'
                  }`}
                  title="Klik untuk melihat catatan komentar ini"
                >
                  <span>{seg.text}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 font-mono font-bold tracking-tight rounded-none ${
                      seg.isResolved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    💬
                  </span>
                </mark>
              );
            }
            return <span key={sIdx}>{seg.text}</span>;
          })}
        </p>
      );
    });
  }, [content, comments, activeCommentId]);

  return (
    <div className="space-y-4">
      {/* Top Banner / Controls */}
      <div
        className="flex items-center justify-between p-3 border text-xs"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
            Catatan Redaksi & Anotasi Naskah
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {comments.length} Catatan ({unresolvedCount} Perlu Revisi)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {comments.length > 0 && (
            <div className="flex items-center border border-[var(--color-line)] text-[11px] overflow-hidden">
              <button
                type="button"
                onClick={() => setFilterState('all')}
                className={`px-2.5 py-1 font-semibold transition-colors ${
                  filterState === 'all' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-black/5'
                }`}
              >
                Semua ({comments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterState('unresolved')}
                className={`px-2.5 py-1 font-semibold transition-colors ${
                  filterState === 'unresolved' ? 'bg-amber-600 text-white' : 'hover:bg-black/5'
                }`}
              >
                Revisi ({unresolvedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterState('resolved')}
                className={`px-2.5 py-1 font-semibold transition-colors ${
                  filterState === 'resolved' ? 'bg-emerald-600 text-white' : 'hover:bg-black/5'
                }`}
              >
                Selesai ({resolvedCount})
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSideOpen(!isSideOpen)}
            className="px-2.5 py-1 text-[11px] font-bold border border-[var(--color-line)] flex items-center gap-1 hover:bg-black/5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isSideOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{isSideOpen ? 'Sembunyikan Panel' : 'Lihat Diskusi'}</span>
          </button>
        </div>
      </div>

      {/* Tip for editor & author */}
      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
        <Quote size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
        <div>
          <span className="font-bold">Tips Kolaborasi:</span> Tandai (blok) kata, kalimat, atau paragraf naskah di bawah untuk memunculkan tombol{' '}
          <strong className="underline">💬 Beri Catatan Revisi</strong>. Penulis dan tim redaksi dapat membalas dan mendiskusikan perbaikan langsung di setiap catatan.
        </div>
      </div>

      {/* Main Grid: Content (with inline highlight) + Comments Thread Panel */}
      <div className={`grid grid-cols-1 ${isSideOpen ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        {/* Article Reading View with Text Selection */}
        <div
          className={`${isSideOpen ? 'lg:col-span-7' : 'w-full'} relative p-5 sm:p-7 border bg-white dark:bg-black/30 select-text`}
          style={{ borderColor: 'var(--color-line)' }}
          ref={contentContainerRef}
          onMouseUp={handleSelection}
          onTouchEnd={handleSelection}
        >
          {/* Floating Action Button on Text Selection */}
          {selectionRange && !isComposing && (
            <div
              className="absolute z-30 transform -translate-y-full animate-in fade-in zoom-in duration-150 shadow-xl"
              style={{
                top: `${selectionRange.top}px`,
                left: `${selectionRange.left}px`,
              }}
            >
              <button
                type="button"
                onClick={startComment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg uppercase tracking-wider transition-transform active:scale-95"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <MessageSquare size={13} />
                <span>Beri Catatan Revisi</span>
              </button>
            </div>
          )}

          {/* Inline Composer Popup when clicking the floating button */}
          {isComposing && selectionRange && (
            <div
              className="absolute z-40 p-4 border bg-[var(--color-surface)] shadow-2xl space-y-3 w-80 max-w-[90vw]"
              style={{
                top: `${selectionRange.top + 45}px`,
                left: `${Math.min(selectionRange.left, 20)}px`,
                borderColor: 'var(--color-line)',
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} /> Catatan untuk Teks Terpilih:
                </span>
                <button type="button" onClick={cancelComment} className="text-gray-400 hover:text-black dark:hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="p-2 text-[11px] italic bg-black/5 dark:bg-white/5 border-l-2 border-amber-500 line-clamp-3 text-[var(--color-foreground)]">
                &ldquo;{selectedText}&rdquo;
              </div>

              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis instruksi atau kritik revisi (misal: perlu perjelas narasumber, typo, dsb)..."
                autoFocus
                className="w-full p-2 text-xs border border-[var(--color-line)] bg-[var(--color-wall)] text-[var(--color-foreground)] focus:outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={cancelComment}
                  className="px-3 py-1 text-gray-500 hover:text-black dark:hover:text-white font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !commentText.trim()}
                  onClick={() => handleSubmitComment()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase flex items-center gap-1 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </div>
          )}

          {/* Rendered Text with Highlight Marks */}
          <div className="prose dark:prose-invert max-w-none">{renderedContent}</div>
        </div>

        {/* Side Panel: Comment & Discussion Threads */}
        {isSideOpen && (
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-line)]">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Daftar Catatan ({filteredComments.length})
              </span>
              <span className="text-[10px] text-gray-500">Klik sorotan teks untuk navigasi</span>
            </div>

            {filteredComments.length === 0 ? (
              <div
                className="p-8 text-center border border-dashed text-xs text-gray-500 space-y-2"
                style={{ borderColor: 'var(--color-line)' }}
              >
                <MessageSquare size={28} className="mx-auto text-gray-400 opacity-60" />
                <p className="font-medium">Belum ada catatan revisi pada filter ini.</p>
                <p className="text-[11px] text-gray-400">
                  Pilih kata atau kalimat pada naskah sebelah kiri untuk memberi catatan revisi pertama.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {filteredComments.map((com) => {
                  const isActive = activeCommentId === com.id;
                  const replies = com.replies || [];
                  const replyText = replyTextMap[com.id] || '';

                  return (
                    <div
                      key={com.id}
                      id={`comment-card-${com.id}`}
                      onClick={() => setActiveCommentId(com.id)}
                      className={`p-4 border transition-all ${
                        isActive
                          ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
                          : com.resolved
                          ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-[var(--color-line)] bg-[var(--color-surface)]'
                      }`}
                    >
                      {/* Highlighted Quote Preview */}
                      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[var(--color-line)]/50">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 line-clamp-1">
                          <Quote size={12} className="flex-shrink-0" />
                          <span className="truncate">&ldquo;{com.highlightedText}&rdquo;</span>
                        </div>

                        {/* Resolve Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleResolve(com.id, com.resolved);
                          }}
                          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                            com.resolved
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                          style={{ fontFamily: 'var(--font-display)' }}
                          title={com.resolved ? 'Tandai belum selesai' : 'Tandai sudah direvisi'}
                        >
                          <Check size={11} />
                          <span>{com.resolved ? 'Selesai' : 'Belum Selesai'}</span>
                        </button>
                      </div>

                      {/* Comment Author Header */}
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--color-foreground)]">{com.authorName}</span>
                          <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                            {com.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {com.createdAt ? com.createdAt.replace('T', ' ').slice(0, 16) : ''}
                        </span>
                      </div>

                      {/* Comment Body */}
                      <p className="text-xs text-[var(--color-foreground)] leading-relaxed mb-3 whitespace-pre-line">
                        {com.content}
                      </p>

                      {/* Thread Replies */}
                      {replies.length > 0 && (
                        <div className="space-y-2.5 my-3 pl-3 border-l-2 border-amber-500/40">
                          {replies.map((rep) => (
                            <div key={rep.id} className="text-xs space-y-1 bg-black/5 dark:bg-white/5 p-2 rounded-none">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-[var(--color-foreground)] flex items-center gap-1">
                                  <CornerDownRight size={10} className="text-amber-600" />
                                  {rep.authorName} ({rep.authorRole})
                                </span>
                                <span className="text-gray-400">{rep.createdAt?.slice(11, 16)}</span>
                              </div>
                              <p className="text-[11px] text-[var(--color-foreground)] pl-3 leading-relaxed">
                                {rep.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input Box */}
                      <div className="pt-2 border-t border-[var(--color-line)]/50">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [com.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendReply(com.id);
                              }
                            }}
                            placeholder="Balas catatan ini..."
                            className="flex-1 p-1.5 text-xs bg-[var(--color-wall)] border border-[var(--color-line)] text-[var(--color-foreground)] focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={!replyText.trim()}
                            onClick={() => handleSendReply(com.id)}
                            className="px-2.5 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase hover:opacity-80 disabled:opacity-40 flex items-center gap-1"
                            title="Kirim Balasan"
                          >
                            <Send size={11} />
                          </button>
                          {(user?.role === 'superadmin' ||
                            user?.role === 'pemred' ||
                            user?.role === 'redaktur' ||
                            user?.id === com.authorId) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(com.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Hapus Catatan"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

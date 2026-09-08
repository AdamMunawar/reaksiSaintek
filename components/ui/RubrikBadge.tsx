'use client';

import { RUBRIK_META, type Rubrik } from '@/lib/data';

interface RubrikBadgeProps {
  rubrik: Rubrik;
  size?: 'sm' | 'md';
  className?: string;
}

export default function RubrikBadge({ rubrik, size = 'md', className = '' }: RubrikBadgeProps) {
  const meta = RUBRIK_META[rubrik];

  const base = 'inline-flex items-center font-bold uppercase tracking-wider border-l-[3px]';
  const sizeClass = size === 'sm'
    ? 'text-[9px] px-2 py-0.5 gap-1.5'
    : 'text-[10px] px-2.5 py-1 gap-2';

  return (
    <span
      className={`${base} ${sizeClass} ${className} bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]`}
      style={{ borderLeftColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}

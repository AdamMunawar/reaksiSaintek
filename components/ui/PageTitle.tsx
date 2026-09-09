'use client';

import { useEffect } from 'react';

export const DEFAULT_SITE_TITLE = 'LPM Reaksi | Portal Berita';

export function PageTitle({ title }: { title?: string }) {
  const fullTitle = title && title.trim()
    ? `${title.trim()} | LPM Reaksi`
    : DEFAULT_SITE_TITLE;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = fullTitle;
    }
  }, [fullTitle]);

  return null;
}

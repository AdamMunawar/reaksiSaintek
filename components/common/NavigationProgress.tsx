'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Ignore external, empty, hash, download, or modifier key clicks
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        targetAttr === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's internal
      const isInternal =
        href.startsWith('/') ||
        href.startsWith(window.location.origin);

      if (!isInternal) return;

      // Don't trigger if it's current URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) return;

      // Start progress
      setIsLoading(true);
      setProgress(25);

      // Trickle animation
      const t1 = setTimeout(() => setProgress(65), 180);
      const t2 = setTimeout(() => setProgress(85), 450);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[999999]"
      aria-hidden="true"
    >
      {/* Glow Top Progress Bar */}
      <div
        className="h-[3px] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 60%, #60a5fa 100%)',
          boxShadow: '0 0 12px rgba(37, 99, 235, 0.8), 0 0 4px rgba(96, 165, 250, 0.9)',
          opacity: progress === 100 ? 0.6 : 1,
        }}
      >
        {/* Glow point at leading edge */}
        <div
          className="absolute right-0 top-0 h-[3px] w-24 -translate-y-0.5"
          style={{
            background: 'radial-gradient(ellipse at right, rgba(96, 165, 250, 1) 0%, transparent 80%)',
            filter: 'blur(1px)',
          }}
        />
      </div>

      {/* Subtle Top-Right Floating Spinner */}
      <div
        className={`fixed top-3.5 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg border transition-opacity duration-200 ${
          progress > 0 && progress < 100 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: 'var(--color-line)',
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-display)',
        }}
      >
        <svg
          className="animate-spin h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Memuat...</span>
      </div>
    </div>
  );
}

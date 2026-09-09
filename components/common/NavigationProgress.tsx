'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Complete progress bar whenever route changes
  useEffect(() => {
    clearAllTimers();

    if (visible) {
      setProgress(100);
      const dismissTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      timersRef.current.push(dismissTimer);
    } else {
      setProgress(0);
      setVisible(false);
    }

    return () => clearAllTimers();
  }, [pathname, searchParams]);

  // Intercept clicks on internal links to start progress
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Ignore external, anchor hash, download, or modifier key clicks
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

      // Don't trigger if already on current URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === window.location.pathname) return;

      // Clear any pending timers
      clearAllTimers();

      // Start progress animation
      setVisible(true);
      setProgress(25);

      const t1 = setTimeout(() => setProgress(60), 150);
      const t2 = setTimeout(() => setProgress(85), 400);
      // Hard safety timeout: auto-dismiss after 2.5s if route does not complete
      const tSafety = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
      }, 2500);

      timersRef.current.push(t1, t2, tSafety);
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      clearAllTimers();
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[999999]"
      aria-hidden="true"
    >
      {/* Sleek Top Glow Progress Bar */}
      <div
        className="h-[2.5px] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #60a5fa 100%)',
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.8), 0 0 3px rgba(96, 165, 250, 0.9)',
          opacity: progress === 100 ? 0.3 : 1,
        }}
      >
        {/* Glow head point */}
        <div
          className="absolute right-0 top-0 h-[2.5px] w-20"
          style={{
            background: 'radial-gradient(ellipse at right, rgba(96, 165, 250, 1) 0%, transparent 80%)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </div>
  );
}

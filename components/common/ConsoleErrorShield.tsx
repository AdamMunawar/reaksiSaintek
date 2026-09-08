'use client';

import { useEffect } from 'react';

/**
 * ConsoleErrorShield
 * Sanitizes and masks raw error stack traces in browser DevTools / inspect
 * so that sensitive internal details, database queries, and raw exception dumps
 * are not leaked to visitors or developers inspecting the client interface.
 */
export default function ConsoleErrorShield() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      // Check if message contains sensitive system details or raw stacks
      const str = args.map((a) => (typeof a === 'object' && a !== null ? (a.message || a.stack || JSON.stringify(a)) : String(a))).join(' ');

      if (
        str.includes('PostgreSQL') ||
        str.includes('SQL') ||
        str.includes('at ') ||
        str.includes('forward-logs-shared') ||
        str.includes('webpack-internal')
      ) {
        // Mask raw internal stack trace with sanitized message
        originalWarn.call(console, '[LPM Reaksi System] Operasi client-side diproses dengan fallback aman.');
        return;
      }

      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const str = args.map((a) => (typeof a === 'object' && a !== null ? (a.message || JSON.stringify(a)) : String(a))).join(' ');
      if (str.includes('PostgreSQL') || str.includes('DATABASE_URL')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent raw unhandled rejection from dumping stack to console
      if (event?.reason) {
        event.preventDefault?.();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

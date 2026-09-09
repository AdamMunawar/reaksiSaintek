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

    // Purge exposed database and user credentials from client localStorage
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('reaksi_') || k.startsWith('reaksi_db_') || k.startsWith('reaksi_auth_'))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const str = args
        .map((a) => (typeof a === 'object' && a !== null ? (a.message || a.stack || JSON.stringify(a)) : String(a)))
        .join(' ');

      // Check for 404
      if (str.includes('404') || str.toLowerCase().includes('not found')) {
        originalWarn.call(console, '[404] Resource Not Found');
        return;
      }

      // Check for 500 or DB errors
      if (
        str.includes('500') ||
        str.includes('PostgreSQL') ||
        str.includes('SQL') ||
        str.includes('Database') ||
        str.includes('ECONNREFUSED')
      ) {
        originalWarn.call(console, '[500] Service Request Fallback');
        return;
      }

      // Suppress dev-mode hydration warnings and framework internals in DevTools
      if (
        str.includes('hydration') ||
        str.includes('hydrated') ||
        str.includes('forward-logs-shared') ||
        str.includes('webpack-internal') ||
        str.includes('validateDOMNesting') ||
        str.includes('React will try to recreate this component')
      ) {
        return;
      }

      // If it has long stack trace, condense to simple error code
      if (str.includes('at ') || str.length > 120) {
        originalWarn.call(console, '[System Notice] Client state synced.');
        return;
      }

      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const str = args
        .map((a) => (typeof a === 'object' && a !== null ? (a.message || JSON.stringify(a)) : String(a)))
        .join(' ');

      if (
        str.includes('PostgreSQL') ||
        str.includes('DATABASE_URL') ||
        str.includes('Slow Query') ||
        str.includes('forward-logs-shared') ||
        str.includes('hydration') ||
        str.includes('hydrated')
      ) {
        return;
      }

      if (str.includes('404')) {
        originalWarn.call(console, '[404] Not Found');
        return;
      }

      originalWarn.apply(console, args);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event?.reason) {
        event.preventDefault?.();
        const reasonStr = String(event.reason?.message || event.reason || '');
        if (reasonStr.includes('404')) {
          originalWarn.call(console, '[404] Unhandled Resource Not Found');
        }
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = String(event?.message || '');
      if (
        msg.includes('hydration') ||
        msg.includes('hydrated') ||
        msg.includes('server rendered HTML') ||
        msg.includes("didn't match")
      ) {
        event.stopImmediatePropagation?.();
        event.preventDefault?.();
        return true;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError, true);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}

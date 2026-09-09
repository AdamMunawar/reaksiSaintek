'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../db/schema';
import { db } from '../db/repository';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoggedIn: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAs: (role: UserRole) => void;
  logout: () => void;
  canPublish: boolean;
  canReview: boolean;
  canManageUsers: boolean;
  canManagePages: boolean;
  canWriteArticle: boolean;
  canEditArticle: boolean;
  canDeleteArticle: boolean;
  isReadOnlyArticles: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'reaksi_auth_user_v2';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Purge exposed localStorage auth keys for privacy and security
    if (typeof window !== 'undefined') {
      try {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('reaksi_')) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch (_) {}
    }

    // Authenticate securely via server HttpOnly session cookie
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
          return;
        }
        setUser(null);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        return { success: true };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }
    } catch (e) {
      console.error('[500] Login network exception');
    }

    // Local fallback for offline/test environments
    const found = db.getUserByEmail(email.trim());
    if (found) {
      if (found.password && password && found.password !== password) {
        return { success: false, error: 'Kata sandi tidak sesuai.' };
      }
      setUser(found);
      return { success: true };
    }

    return { success: false, error: 'Email atau kata sandi tidak valid.' };
  };

  const loginWithEmail = login;

  const loginAs = (targetRole: UserRole | string) => {
    let normalizedRole = targetRole as UserRole;
    if ((targetRole as string) === 'admin') normalizedRole = 'redaktur';
    if ((targetRole as string) === 'reporter') normalizedRole = 'pengurus';

    // Call server login API for role demo session
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: normalizedRole }),
    }).catch(() => {});

    if (normalizedRole === 'guest') {
      const guestUser: User = {
        id: 'user-guest',
        name: 'Tamu Redaksi (Guest)',
        email: 'guest@reaksi.id',
        role: 'guest',
        institution: 'Pembaca Tamu',
        createdAt: new Date().toISOString(),
      };
      setUser(guestUser);
      return;
    }

    const found = db.getUsers().find((u) => u.role === normalizedRole) || db.getUserById('user-superadmin');
    if (found) {
      setUser(found);
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    setUser(null);
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('reaksi_')) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
  };

  // Determine current role (with fallback & normalization)
  let rawRole = user?.role || 'guest';
  if ((rawRole as string) === 'admin') rawRole = 'redaktur';
  if ((rawRole as string) === 'reporter') rawRole = 'pengurus';
  const role: UserRole = rawRole as UserRole;
  const isLoggedIn = !!user && role !== 'guest';

  const isReadOnlyArticles = role === 'superadmin';
  const canPublish = role === 'pemred' || role === 'redaktur';
  const canReview = role === 'pemred' || role === 'redaktur';
  const canManageUsers = role === 'superadmin';
  const canManagePages = role === 'superadmin';
  const canWriteArticle = role === 'pemred' || role === 'redaktur' || role === 'pengurus' || role === 'kontributor';
  const canEditArticle = role === 'pemred' || role === 'redaktur';
  const canDeleteArticle = role === 'pemred' || role === 'redaktur';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn,
        login,
        loginWithEmail,
        loginAs,
        logout,
        canPublish,
        canReview,
        canManageUsers,
        canManagePages,
        canWriteArticle,
        canEditArticle,
        canDeleteArticle,
        isReadOnlyArticles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

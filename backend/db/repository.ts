import { Article, ArticleStatus, MediaItem, RubrikItem, SitePageContent, StaffMember, User, UserRole, EPaperItem, MediaPartnerConfig } from './schema';
import { SEED_ARTICLES, SEED_MEDIA, SEED_PAGES, SEED_RUBRIKS, SEED_STAFF, SEED_USERS, SEED_EPAPERS, DEFAULT_MEDIA_PARTNER } from './seed';
import { cleanArticleHtml, extractCleanExcerpt } from '@/lib/utils/cleanHtml';

const STORAGE_KEYS = {
  ARTICLES: 'reaksi_db_articles_v2',
  USERS: 'reaksi_db_users_v3',
  PAGES: 'reaksi_db_pages_v1',
  STAFF: 'reaksi_db_staff_v2',
  MEDIA: 'reaksi_db_media_v1',
  RUBRIKS: 'reaksi_db_rubriks_v1',
  EPAPERS: 'reaksi_db_epapers_v1',
  MEDIA_PARTNER: 'reaksi_db_media_partner_v1',
};

// In-memory fallback / SSR storage (Server-driven data architecture)
let memoryStore: Record<string, any> = {
  articles: [...SEED_ARTICLES],
  users: [...SEED_USERS],
  pages: [...SEED_PAGES],
  staff: [...SEED_STAFF],
  media: [...SEED_MEDIA],
  rubriks: [...SEED_RUBRIKS],
  epapers: [...SEED_EPAPERS],
  mediaPartner: { ...DEFAULT_MEDIA_PARTNER },
};

function getLocal<T>(key: string, fallback: T): T {
  const storeKey = key.replace('reaksi_db_', '').replace(/_v\d+$/, '');
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed !== null && parsed !== undefined) {
          memoryStore[storeKey] = parsed;
          return parsed as T;
        }
      }
    } catch (_) {}
  }
  if (storeKey in memoryStore && memoryStore[storeKey] !== undefined) {
    if (!Array.isArray(memoryStore[storeKey]) || memoryStore[storeKey].length > 0) {
      return memoryStore[storeKey] as T;
    }
  }
  if (storeKey in memoryStore) {
    return memoryStore[storeKey] as T;
  }
  return fallback;
}

function setLocal<T>(key: string, value: T): void {
  const storeKey = key.replace('reaksi_db_', '').replace(/_v\d+$/, '');
  memoryStore[storeKey] = value;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }
}

function sanitizeArticle(art: Article): Article {
  const content = cleanArticleHtml(art.content || '');
  const excerpt = extractCleanExcerpt(art.excerpt, content, 160);
  return {
    ...art,
    excerpt,
    content,
  };
}

export const db = {
  /* ── ARTICLES ── */
  getArticles(filter?: {
    status?: ArticleStatus | 'ALL';
    rubrik?: string;
    authorId?: string;
    search?: string;
  }): Article[] {
    const rawAll = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const all = rawAll.map(sanitizeArticle);
    memoryStore.articles = all;

    return all
      .filter((art) => {
        if (filter?.status && filter.status !== 'ALL' && art.status !== filter.status) {
          return false;
        }
        if (filter?.rubrik && filter.rubrik !== 'semua' && art.rubrik !== filter.rubrik) {
          return false;
        }
        if (filter?.authorId && art.authorId !== filter.authorId) {
          return false;
        }
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          const matchTitle = art.title.toLowerCase().includes(q);
          const matchExcerpt = art.excerpt.toLowerCase().includes(q);
          const matchAuthor = art.authorName.toLowerCase().includes(q);
          const matchTag = art.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchExcerpt && !matchAuthor && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || a.createdAt).getTime();
        const timeB = new Date(b.publishedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
  },

  getPublishedArticles(rubrik?: string): Article[] {
    return this.getArticles({ status: 'PUBLISHED', rubrik });
  },

  getArticleBySlug(slug: string): Article | undefined {
    const rawAll = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const art = rawAll.find((a) => a.slug === slug);
    return art ? sanitizeArticle(art) : undefined;
  },

  getArticleById(id: string): Article | undefined {
    const rawAll = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const art = rawAll.find((a) => a.id === id);
    return art ? sanitizeArticle(art) : undefined;
  },

  saveArticle(article: Partial<Article>): Article {
    const all = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const now = new Date().toISOString();

    const cleanContent = cleanArticleHtml(article.content || '');
    const cleanExcerptText = extractCleanExcerpt(article.excerpt, cleanContent);

    if (article.id) {
      const idx = all.findIndex((a) => a.id === article.id);
      if (idx !== -1) {
        const existing = all[idx];
        const content = article.content !== undefined ? cleanContent : existing.content;
        const excerpt = article.excerpt !== undefined ? cleanExcerptText : existing.excerpt;
        const updated: Article = {
          ...existing,
          ...article,
          content,
          excerpt,
          updatedAt: now,
        };
        all[idx] = updated;
        memoryStore.articles = all;
        setLocal(STORAGE_KEYS.ARTICLES, all);
        return updated;
      }
    }

    const title = article.title || 'Naskah Baru';
    const content = cleanContent;

    // Auto-generate slug from title
    const slugBase = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    const slug = article.slug || `${slugBase}-${Date.now().toString().slice(-4)}`;

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const newArticle: Article = {
      id: article.id || `art-${Date.now()}`,
      title,
      slug,
      excerpt: cleanExcerptText,
      content,
      coverImage: article.coverImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      rubrik: article.rubrik || (this.getRubriks()[0]?.slug || 'kabar'),
      subRubrik: article.subRubrik,
      authorId: article.authorId || 'user-superadmin',
      authorName: article.authorName || 'Redaksi LPM Reaksi',
      authorRole: (article.authorRole as UserRole) || 'superadmin',
      authorBio: article.authorBio,
      authorInstitution: article.authorInstitution,
      authorPhone: article.authorPhone,
      status: article.status || 'DRAFT',
      views: 0,
      readTime: article.readTime || readTime,
      tags: article.tags || [],
      publishedAt: article.status === 'PUBLISHED' ? now.split('T')[0] : undefined,
      createdAt: now,
      updatedAt: now,
      reviewNotes: article.reviewNotes,
    };

    all.unshift(newArticle);
    memoryStore.articles = all;
    setLocal(STORAGE_KEYS.ARTICLES, all);
    return newArticle;
  },

  updateArticleStatus(id: string, status: ArticleStatus, reviewNotes?: string): Article | null {
    const all = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    all[idx] = {
      ...all[idx],
      status,
      reviewNotes: reviewNotes !== undefined ? reviewNotes : all[idx].reviewNotes,
      publishedAt: status === 'PUBLISHED' ? (all[idx].publishedAt || now.split('T')[0]) : all[idx].publishedAt,
      updatedAt: now,
    };
    memoryStore.articles = all;
    setLocal(STORAGE_KEYS.ARTICLES, all);
    return all[idx];
  },

  deleteArticle(id: string): boolean {
    let all = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const initialLen = all.length;
    all = all.filter((a) => a.id !== id);
    if (all.length !== initialLen) {
      memoryStore.articles = all;
      setLocal(STORAGE_KEYS.ARTICLES, all);
      return true;
    }
    return false;
  },

  syncArticlesFromRemote(remoteArticles: any[]): void {
    if (!Array.isArray(remoteArticles) || remoteArticles.length === 0) return;
    const normalized: Article[] = remoteArticles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      rubrik: a.rubrik,
      excerpt: a.excerpt || '',
      content: a.content || '',
      coverImage: a.coverImage || a.cover_image || '',
      coverCaption: a.coverCaption || a.cover_caption || '',
      authorId: a.authorId || a.author_id,
      authorName: a.authorName || a.author_name || 'Redaksi LPM Reaksi',
      authorRole: a.authorRole || a.author_role || 'pengurus',
      status: a.status || 'PUBLISHED',
      tags: Array.isArray(a.tags) ? a.tags : [],
      publishedAt: a.publishedAt || a.published_at || a.createdAt || a.created_at,
      readTime: a.readTime || a.read_time || 3,
      views: a.views || 0,
      reviewNotes: a.reviewNotes || a.review_notes,
      createdAt: a.createdAt || a.created_at || new Date().toISOString(),
      updatedAt: a.updatedAt || a.updated_at || new Date().toISOString(),
    }));

    memoryStore.articles = normalized;
    if (typeof window !== 'undefined') {
      setLocal(STORAGE_KEYS.ARTICLES, normalized);
      window.dispatchEvent(new Event('storage'));
    }
  },

  incrementViews(id: string): void {
    const all = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const idx = all.findIndex((a) => a.id === id);
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        views: (all[idx].views || 0) + 1,
      };
      memoryStore.articles = all;
      setLocal(STORAGE_KEYS.ARTICLES, all);
    }
  },

  incrementArticleViews(slug: string): void {
    const all = getLocal<Article[]>(STORAGE_KEYS.ARTICLES, memoryStore.articles);
    const idx = all.findIndex((a) => a.slug === slug);
    if (idx !== -1) {
      all[idx].views = (all[idx].views || 0) + 1;
      memoryStore.articles = all;
      setLocal(STORAGE_KEYS.ARTICLES, all);
    }
  },

  /* ── USERS ── */
  getUsers(): User[] {
    const users = getLocal<User[]>(STORAGE_KEYS.USERS, memoryStore.users);
    memoryStore.users = users;
    return users;
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  saveUser(user: Partial<User> & { name: string; email: string; role: UserRole }): User {
    const all = this.getUsers();
    if (user.id) {
      const idx = all.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...user };
        memoryStore.users = all;
        setLocal(STORAGE_KEYS.USERS, all);
        return all[idx];
      }
    }
    const newUser: User = {
      id: user.id || `user-${Date.now()}`,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      institution: user.institution,
      phone: user.phone,
      bio: user.bio,
      createdAt: new Date().toISOString(),
    };
    all.push(newUser);
    memoryStore.users = all;
    setLocal(STORAGE_KEYS.USERS, all);
    return newUser;
  },

  deleteUser(id: string): boolean {
    let all = this.getUsers();
    const initialLen = all.length;
    all = all.filter((u) => u.id !== id);
    if (all.length !== initialLen) {
      memoryStore.users = all;
      setLocal(STORAGE_KEYS.USERS, all);
      return true;
    }
    return false;
  },

  /* ── SITE PAGES ── */
  getPages(): SitePageContent[] {
    const pages = getLocal<SitePageContent[]>(STORAGE_KEYS.PAGES, memoryStore.pages);
    memoryStore.pages = pages;
    return pages;
  },

  getPageBySlug(slug: string): SitePageContent | undefined {
    return this.getPages().find((p) => p.slug === slug);
  },

  savePage(slug: string, updates: Partial<SitePageContent>, updatedBy: string = 'Superadmin'): SitePageContent {
    const all = this.getPages();
    const idx = all.findIndex((p) => p.slug === slug);
    const now = new Date().toISOString();

    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...updates,
        updatedAt: now,
        updatedBy,
      };
      memoryStore.pages = all;
      setLocal(STORAGE_KEYS.PAGES, all);
      return all[idx];
    } else {
      const newPage: SitePageContent = {
        id: `page-${slug}`,
        slug: slug as any,
        title: updates.title || slug,
        description: updates.description || '',
        mainText: updates.mainText || '',
        extraContent: updates.extraContent,
        updatedAt: now,
        updatedBy,
      };
      all.push(newPage);
      memoryStore.pages = all;
      setLocal(STORAGE_KEYS.PAGES, all);
      return newPage;
    }
  },

  /* ── STAFF ── */
  getStaff(): StaffMember[] {
    const staff = getLocal<StaffMember[]>(STORAGE_KEYS.STAFF, memoryStore.staff);
    memoryStore.staff = staff;
    return staff.sort((a, b) => a.order - b.order);
  },

  saveStaff(staffItem: Partial<StaffMember> & { name: string; roleTitle: string; department?: any; division?: any }): StaffMember {
    const all = this.getStaff();
    const dept = staffItem.department || staffItem.division || 'Pembina';
    if (staffItem.id) {
      const idx = all.findIndex((s) => s.id === staffItem.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...staffItem,
          department: dept,
          division: dept,
          bidang: staffItem.bidang || all[idx].bidang || '',
        };
        memoryStore.staff = all;
        setLocal(STORAGE_KEYS.STAFF, all);
        return all[idx];
      }
    }
    const newStaff: StaffMember = {
      id: staffItem.id || `staff-${Date.now()}`,
      name: staffItem.name,
      roleTitle: staffItem.roleTitle,
      department: dept,
      division: dept,
      bidang: staffItem.bidang || '',
      order: staffItem.order || all.length + 1,
      avatar: staffItem.avatar,
      period: staffItem.period || '',
      createdAt: new Date().toISOString(),
    };
    all.push(newStaff);
    memoryStore.staff = all;
    setLocal(STORAGE_KEYS.STAFF, all);
    return newStaff;
  },

  deleteStaff(id: string): boolean {
    let all = this.getStaff();
    const initialLen = all.length;
    all = all.filter((s) => s.id !== id);
    if (all.length !== initialLen) {
      memoryStore.staff = all;
      setLocal(STORAGE_KEYS.STAFF, all);
      return true;
    }
    return false;
  },

  /* ── MEDIA ── */
  getMedia(): MediaItem[] {
    const media = getLocal<MediaItem[]>(STORAGE_KEYS.MEDIA, memoryStore.media);
    memoryStore.media = media;
    return media;
  },

  saveMedia(item: { filename: string; url: string; size: number; mimeType: string; uploadedBy: string }): MediaItem {
    const all = this.getMedia();
    const newItem: MediaItem = {
      id: `med-${Date.now()}`,
      ...item,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newItem);
    memoryStore.media = all;
    setLocal(STORAGE_KEYS.MEDIA, all);
    return newItem;
  },

  deleteMedia(id: string): boolean {
    let all = this.getMedia();
    const initialLen = all.length;
    all = all.filter((m) => m.id !== id);
    if (all.length !== initialLen) {
      memoryStore.media = all;
      setLocal(STORAGE_KEYS.MEDIA, all);
      return true;
    }
    return false;
  },

  /* ── RUBRIKS ── */
  getRubriks(): RubrikItem[] {
    const rubriks = getLocal<RubrikItem[]>(STORAGE_KEYS.RUBRIKS, memoryStore.rubriks);
    memoryStore.rubriks = rubriks;
    return rubriks.sort((a, b) => a.order - b.order);
  },

  getRubrikBySlug(slug: string): RubrikItem | undefined {
    const all = this.getRubriks();
    return all.find((r) => r.slug === slug);
  },

  saveRubrik(rubrik: Partial<RubrikItem> & { name: string; slug?: string }): RubrikItem {
    const all = this.getRubriks();
    const slug = (
      rubrik.slug ||
      rubrik.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );

    if (rubrik.id) {
      const idx = all.findIndex((r) => r.id === rubrik.id);
      if (idx !== -1) {
        const updated: RubrikItem = {
          ...all[idx],
          ...rubrik,
          name: rubrik.name,
          slug,
          description: rubrik.description ?? all[idx].description,
          color: rubrik.color ?? all[idx].color,
          emoji: rubrik.emoji ?? all[idx].emoji,
          order: rubrik.order ?? all[idx].order,
          subRubriks: rubrik.subRubriks !== undefined ? rubrik.subRubriks : (all[idx].subRubriks || []),
        };
        all[idx] = updated;
        memoryStore.rubriks = all;
        setLocal(STORAGE_KEYS.RUBRIKS, all);
        return updated;
      }
    }

    const nextOrder = all.length > 0 ? Math.max(...all.map((r) => r.order || 0)) + 1 : 1;
    const newItem: RubrikItem = {
      id: `rubrik-${Date.now()}`,
      name: rubrik.name,
      slug,
      description: rubrik.description || '',
      color: rubrik.color || '#2563EB',
      emoji: rubrik.emoji || '',
      order: rubrik.order ?? nextOrder,
      subRubriks: rubrik.subRubriks || [],
    };
    all.push(newItem);
    memoryStore.rubriks = all;
    setLocal(STORAGE_KEYS.RUBRIKS, all);
    return newItem;
  },

  deleteRubrik(id: string): boolean {
    let all = this.getRubriks();
    const initialLen = all.length;
    all = all.filter((r) => r.id !== id);
    if (all.length !== initialLen) {
      memoryStore.rubriks = all;
      setLocal(STORAGE_KEYS.RUBRIKS, all);
      return true;
    }
    return false;
  },

  reorderRubriks(orderedIds: string[]): void {
    const all = this.getRubriks();
    const updated = all.map((r) => {
      const idx = orderedIds.indexOf(r.id);
      return {
        ...r,
        order: idx !== -1 ? idx + 1 : r.order,
      };
    });
    memoryStore.rubriks = updated;
    setLocal(STORAGE_KEYS.RUBRIKS, updated);
  },

  syncRubriksFromRemote(remoteList: RubrikItem[]): void {
    if (Array.isArray(remoteList)) {
      memoryStore.rubriks = remoteList;
      setLocal(STORAGE_KEYS.RUBRIKS, remoteList);
    }
  },

  /* ── E-PAPER & TABLOID ── */
  getEPapers(filter?: { category?: string }): EPaperItem[] {
    let list = getLocal<EPaperItem[]>(STORAGE_KEYS.EPAPERS, memoryStore.epapers);
    memoryStore.epapers = list;
    if (filter?.category && filter.category !== 'ALL') {
      list = list.filter((e) => e.category === filter.category);
    }
    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  getEPaperById(id: string): EPaperItem | undefined {
    return this.getEPapers().find((e) => e.id === id);
  },

  saveEPaper(item: Partial<EPaperItem> & { title: string; edition: string; pdfUrl: string; coverImage: string }): EPaperItem {
    const all = getLocal<EPaperItem[]>(STORAGE_KEYS.EPAPERS, memoryStore.epapers);
    const now = new Date().toISOString();

    if (item.id) {
      const idx = all.findIndex((e) => e.id === item.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...item,
        };
        memoryStore.epapers = all;
        setLocal(STORAGE_KEYS.EPAPERS, all);
        return all[idx];
      }
    }

    const newItem: EPaperItem = {
      id: item.id || `epaper-${Date.now()}`,
      title: item.title,
      edition: item.edition,
      category: item.category || 'BULETIN',
      coverImage: item.coverImage,
      pdfUrl: item.pdfUrl,
      description: item.description || '',
      pageCount: item.pageCount || 1,
      fileSize: item.fileSize || 'Unknown',
      publishedAt: item.publishedAt || now.split('T')[0],
      downloads: item.downloads || 0,
      createdAt: now,
    };

    all.unshift(newItem);
    memoryStore.epapers = all;
    setLocal(STORAGE_KEYS.EPAPERS, all);
    return newItem;
  },

  deleteEPaper(id: string): boolean {
    let all = getLocal<EPaperItem[]>(STORAGE_KEYS.EPAPERS, memoryStore.epapers);
    const initialLen = all.length;
    all = all.filter((e) => e.id !== id);
    if (all.length !== initialLen) {
      memoryStore.epapers = all;
      setLocal(STORAGE_KEYS.EPAPERS, all);
      return true;
    }
    return false;
  },

  incrementEPaperDownloads(id: string): void {
    const all = getLocal<EPaperItem[]>(STORAGE_KEYS.EPAPERS, memoryStore.epapers);
    const idx = all.findIndex((e) => e.id === id);
    if (idx !== -1) {
      all[idx].downloads = (all[idx].downloads || 0) + 1;
      memoryStore.epapers = all;
      setLocal(STORAGE_KEYS.EPAPERS, all);
    }
  },

  /* ── MEDIA PARTNER & SOP CONFIG ── */
  getMediaPartnerConfig(): MediaPartnerConfig {
    const config = getLocal<MediaPartnerConfig>(STORAGE_KEYS.MEDIA_PARTNER, memoryStore.mediaPartner);
    // Ensure all array fields exist
    const safeConfig: MediaPartnerConfig = {
      ...DEFAULT_MEDIA_PARTNER,
      ...config,
      packages: config.packages && config.packages.length > 0 ? config.packages : DEFAULT_MEDIA_PARTNER.packages,
      steps: config.steps && config.steps.length > 0 ? config.steps : DEFAULT_MEDIA_PARTNER.steps,
      terms: config.terms && config.terms.length > 0 ? config.terms : DEFAULT_MEDIA_PARTNER.terms,
    };
    memoryStore.mediaPartner = safeConfig;
    return safeConfig;
  },

  saveMediaPartnerConfig(update: Partial<MediaPartnerConfig>): MediaPartnerConfig {
    const current = this.getMediaPartnerConfig();
    const updated: MediaPartnerConfig = {
      ...current,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.mediaPartner = updated;
    setLocal(STORAGE_KEYS.MEDIA_PARTNER, updated);
    return updated;
  },
};


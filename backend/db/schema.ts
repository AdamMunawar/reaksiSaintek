/**
 * Data Models & Schemas for LPM Reaksi Portal
 */

export type UserRole = 'superadmin' | 'pemred' | 'redaktur' | 'pengurus' | 'kontributor' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  password?: string;
  avatar?: string;
  institution?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'REVISION';

export interface ReviewReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  articleId: string;
  highlightedText: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
  resolved?: boolean;
  replies?: ReviewReply[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverCaption?: string;
  rubrik: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorInstitution?: string;
  authorPhone?: string;
  authorBio?: string;
  status: ArticleStatus;
  reviewNotes?: string;
  reviewComments?: ReviewComment[];
  tags: string[];
  views?: number;
  readTime?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SitePageContent {
  id: string;
  slug: 'tentang' | 'visi-misi' | 'pedoman-media-siber' | 'kirim-tulisan';
  title: string;
  description: string;
  mainText: string;
  extraContent?: Record<string, any>;
  updatedAt: string;
  updatedBy: string;
}

export type StaffDepartment =
  | 'Pembina'
  | 'Ex-Officio'
  | 'Departemen Redaksi dan Penerbitan'
  | 'Departemen Penelitian dan Pengembangan'
  | 'Departemen Marketing dan Komunikasi';

export interface StaffMember {
  id: string;
  name: string;
  roleTitle: string;
  department: StaffDepartment | string;
  bidang?: string;
  division?: string;
  order: number;
  avatar?: string;
  period?: string;
  createdAt?: string;
}

export interface EPaperItem {
  id: string;
  title: string;
  edition: string;
  category: 'BULETIN' | 'TABLOID' | 'MAJALAH';
  coverImage: string;
  pdfUrl: string;
  description?: string;
  pageCount?: number;
  fileSize?: string;
  publishedAt: string;
  downloads?: number;
  createdAt?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface RubrikItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  order: number;
}

export interface MediaPartnerPackage {
  id: string;
  name: string;
  badge?: string;
  description: string;
  features: string[];
  contraprestasi: string;
  highlighted?: boolean;
}

export interface MediaPartnerStep {
  step: number;
  title: string;
  description: string;
}

export interface MediaPartnerConfig {
  heroTitle: string;
  heroSubtitle: string;
  whatsappNumber: string;
  whatsappText: string;
  contactEmail: string;
  metricAudience: string;
  metricAudienceDesc: string;
  metricChannels: string;
  metricChannelsDesc: string;
  metricStandard: string;
  metricStandardDesc: string;
  packages: MediaPartnerPackage[];
  steps: MediaPartnerStep[];
  terms: string[];
  logoDownloadUrl: string;
  updatedAt?: string;
}



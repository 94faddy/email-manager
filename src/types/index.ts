// src/types/index.ts

// ======== Plesk API Types ========

export interface PleskDomain {
  id: number;
  name: string;
  ascii_name: string;
  guid: string;
  hosting_type: string;
  created: string;
}

export interface PleskMailAccount {
  id: number;
  name: string;
  mailbox: boolean;
  redirect?: string[];
}

export interface PleskApiResponse<T = unknown> {
  code: number;
  stdout?: string;
  stderr?: string;
  data?: T;
}

// ======== App Types ========

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
}

export interface Website {
  id: number;
  pleskDomainId: number;
  domainName: string;
  asciiName: string | null;
  hostingType: string | null;
  isActive: boolean;
}

export interface UserWebsite {
  id: number;
  userId: number;
  websiteId: number;
  canCreate: boolean;
  canDelete: boolean;
  maxEmails: number;
  website?: Website;
}

export interface EmailAccount {
  id: number;
  emailAddress: string;
  mailName: string;
  userId: number;
  websiteId: number;
  hasMailbox: boolean;
  quotaMb: number;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  website?: Website;
  user?: User;
}

// ======== API Request/Response Types ========

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface CreateEmailRequest {
  mailName: string; // ส่วนก่อน @
  websiteId: number;
  password: string;
  description?: string;
  quotaMb?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ======== Session Types ========

export interface JWTPayload {
  userId: number;
  username: string;
  role: 'ADMIN' | 'USER';
  iat: number;
  exp: number;
}

// ======== Form Types ========

export interface EmailFormData {
  mailName: string;
  websiteId: number;
  password: string;
  confirmPassword: string;
  description?: string;
  quotaMb: number;
}

// ======== Dashboard Stats ========

export interface DashboardStats {
  totalEmails: number;
  totalWebsites: number;
  recentEmails: EmailAccount[];
}

/**
 * MangaWild Exclusive - Authentication & Role-Based Access Control
 */

export type UserRole = 'admin' | 'creator' | 'subscriber' | 'free_user';

export type Permission =
  // Admin permissions
  | 'MANAGE_USERS'
  | 'MANAGE_ALL_MANGA'
  | 'APPROVE_CONTENT'
  | 'MANAGE_PLATFORM_SETTINGS'
  | 'MANAGE_PAYMENTS'
  | 'VIEW_AUDIT_LOGS'
  // Creator permissions
  | 'PUBLISH_OWN_MANGA'
  | 'MANAGE_CHAPTER_PANELS'
  | 'SUBMIT_FOR_REVIEW'
  | 'VIEW_CREATOR_ANALYTICS'
  | 'MANAGE_PAYOUT_DETAILS'
  // Subscriber permissions
  | 'READ_EXCLUSIVE_CHAPTERS'
  | 'DOWNLOAD_OFFLINE'
  | 'VIP_BADGE'
  | 'AD_FREE'
  // Free User permissions
  | 'READ_FREE_CHAPTERS'
  | 'MANAGE_LIBRARY'
  | 'SUBMIT_COMMENTS'
  | 'RECEIVE_NOTIFICATIONS';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string; // e.g. @akira_senshi
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  isVIP: boolean;
  subscription?: {
    planId: 'monthly' | 'yearly';
    status: 'active' | 'canceled' | 'expired';
    startDate: string;
    expiresAt: string;
    razorpayPaymentId?: string;
  };
  creatorProfileId?: string;
  createdAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'MANAGE_USERS',
    'MANAGE_ALL_MANGA',
    'APPROVE_CONTENT',
    'MANAGE_PLATFORM_SETTINGS',
    'MANAGE_PAYMENTS',
    'VIEW_AUDIT_LOGS',
    'PUBLISH_OWN_MANGA',
    'MANAGE_CHAPTER_PANELS',
    'SUBMIT_FOR_REVIEW',
    'VIEW_CREATOR_ANALYTICS',
    'MANAGE_PAYOUT_DETAILS',
    'READ_EXCLUSIVE_CHAPTERS',
    'DOWNLOAD_OFFLINE',
    'VIP_BADGE',
    'AD_FREE',
    'READ_FREE_CHAPTERS',
    'MANAGE_LIBRARY',
    'SUBMIT_COMMENTS',
    'RECEIVE_NOTIFICATIONS',
  ],
  creator: [
    'PUBLISH_OWN_MANGA',
    'MANAGE_CHAPTER_PANELS',
    'SUBMIT_FOR_REVIEW',
    'VIEW_CREATOR_ANALYTICS',
    'MANAGE_PAYOUT_DETAILS',
    'READ_FREE_CHAPTERS',
    'MANAGE_LIBRARY',
    'SUBMIT_COMMENTS',
    'RECEIVE_NOTIFICATIONS',
  ],
  subscriber: [
    'READ_EXCLUSIVE_CHAPTERS',
    'DOWNLOAD_OFFLINE',
    'VIP_BADGE',
    'AD_FREE',
    'READ_FREE_CHAPTERS',
    'MANAGE_LIBRARY',
    'SUBMIT_COMMENTS',
    'RECEIVE_NOTIFICATIONS',
  ],
  free_user: [
    'READ_FREE_CHAPTERS',
    'MANAGE_LIBRARY',
    'SUBMIT_COMMENTS',
    'RECEIVE_NOTIFICATIONS',
  ],
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

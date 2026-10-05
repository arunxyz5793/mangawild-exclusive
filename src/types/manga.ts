/**
 * MangaWild Exclusive - Manga, Chapter, Panel & Payment Models
 */

export type MangaGenre =
  | 'Supernatural'
  | 'Action'
  | 'Mythology'
  | 'Horror'
  | 'Comedy'
  | 'Romance'
  | 'Thriller'
  | 'Slice of Life'
  | 'Sci-Fi'
  | 'Dark Fantasy'
  | 'Mystery'
  | 'Adventure'
  | 'Dark Comedy'
  | 'Adult'
  | 'Fantasy'
  | 'Drama';

export type ModerationStatus = 'approved' | 'pending_review' | 'rejected' | 'draft';

export interface ChapterPanel {
  id: string;
  panelNumber: number;
  imageUrl: string;
  width?: number;
  height?: number;
  caption?: string;
  hasError?: boolean;
  errorNote?: string;
}

export interface Chapter {
  id: string;
  seriesId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  releaseDate: string;
  isExclusiveVIP: boolean;
  moderationStatus: ModerationStatus;
  reviewerNotes?: string;
  viewsCount: number;
  likesCount: number;
  panels: ChapterPanel[];
}

export interface MangaSeries {
  id: string;
  title: string;
  titleJapanese?: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl?: string;
  author: string;
  artist: string;
  creatorId: string;
  genres: MangaGenre[];
  status: 'ongoing' | 'completed' | 'hiatus';
  moderationStatus: ModerationStatus;
  reviewerNotes?: string;
  totalViews: number;
  totalReads: number;
  likesCount?: number;
  bookmarkedCount?: number;
  rating: number; // e.g. 9.4
  releaseYear: number;
  isExclusive: boolean;
  isTrending?: boolean;
  rankNumber?: number; // 1 to 5 for trending
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatorSocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  discord?: string;
  website?: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  penName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  bannerUrl?: string;
  socialLinks?: CreatorSocialLinks;
  followersCount: number;
  seriesCount: number;
  totalReads: number;
  monthlyEarningsInr: number;
  revenueSharePercent: number; // usually 70
  upiId?: string;
  bankAccountHolder?: string;
  verified: boolean;
  joinedAt: string;
}

export interface Comment {
  id: string;
  chapterId?: string;
  seriesId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  isVIP?: boolean;
  content: string;
  createdAt: string;
  likes: number;
  likedByUsers?: string[];
  status?: 'approved' | 'hidden';
}

export interface ReviewFlagReport {
  id: string;
  userId: string;
  userName: string;
  reason: 'spoiler' | 'inappropriate' | 'spam' | 'harassment' | 'other';
  reasonText?: string;
  createdAt: string;
}

export interface SeriesReview {
  id: string;
  seriesId: string;
  seriesTitle: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  userRole: string;
  isVIP: boolean;
  rating: number; // 1 to 5
  reviewTitle: string;
  reviewText: string;
  likesCount: number;
  likedByUsers?: string[];
  status: 'approved' | 'flagged' | 'hidden';
  isFlagged?: boolean;
  flagCount?: number;
  flags?: ReviewFlagReport[];
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt?: string;
  isNew?: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  ratingBreakdown?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReadingHistoryItem {
  seriesId: string;
  chapterId: string;
  chapterNumber: number;
  panelIndex: number;
  totalPanels: number;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: 'monthly' | 'yearly';
  name: string;
  priceInr: number;
  originalPriceInr?: number;
  billingPeriod: string;
  durationDays: number;
  savingsBadge?: string;
  features: string[];
}

export interface PaymentRecord {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  userId: string;
  userEmail: string;
  planId: 'monthly' | 'yearly';
  amountInr: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  paymentMethod: 'UPI' | 'Card' | 'Netbanking' | 'Razorpay';
  createdAt: string;
  invoiceNumber: string;
}

export interface PlatformNotification {
  id: string;
  userId: string; // or 'all'
  title: string;
  message: string;
  type: 'chapter' | 'moderation' | 'payment' | 'system' | 'series' | 'creator';
  read: boolean;
  createdAt: string;
  link?: string;
  seriesId?: string;
  chapterId?: string;
  creatorId?: string;
}

export interface UserReport {
  id: string;
  category: 'panel_issue' | 'broken_page' | 'website_bug' | 'subscription_payment' | 'copyright_concern' | 'other';
  categoryLabel: string;
  subject: string;
  description: string;
  instagramHandle?: string;
  contactEmail?: string;
  seriesId?: string;
  seriesTitle?: string;
  chapterNumber?: number;
  userId?: string;
  userName?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface WorldwideMangaNews {
  id: string;
  title: string;
  timeAgo: string;
  source: string;
  category: string;
  coverUrl?: string;
  summary: string;
}

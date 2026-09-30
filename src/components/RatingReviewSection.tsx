import React, { useState, useMemo } from 'react';
import {
  Star,
  ShieldAlert,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Flag,
  Trash2,
  Edit3,
  X,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  User as UserIcon,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { SeriesReview, ReviewFlagReport } from '../types/manga';

interface RatingReviewSectionProps {
  seriesId: string;
  seriesTitle: string;
}

const RATING_LABELS: Record<number, string> = {
  1: '1/5 - Poor / Not recommended',
  2: '2/5 - Fair / Needs work',
  3: '3/5 - Good / Average read',
  4: '4/5 - Very Good / Highly recommended',
  5: '5/5 - Masterpiece! / Essential read',
};

export const RatingReviewSection: React.FC<RatingReviewSectionProps> = ({ seriesId, seriesTitle }) => {
  const { user, isVIP, hasPerm } = useAuth();
  const isAdmin = hasPerm('APPROVE_CONTENT') || user.role === 'admin';

  // State
  const [reviews, setReviews] = useState<SeriesReview[]>(() => StorageService.getReviews(seriesId));
  const [summary, setSummary] = useState(() => StorageService.getReviewSummary(seriesId));

  // Active User's existing review
  const userExistingReview = useMemo(
    () => reviews.find(r => r.userId === user.id),
    [reviews, user.id]
  );

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(() => userExistingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState(() => userExistingReview?.reviewTitle || '');
  const [reviewText, setReviewText] = useState(() => userExistingReview?.reviewText || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Filter & Sort State
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'flagged'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');

  // Flag Report Modal State
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<'spoiler' | 'inappropriate' | 'spam' | 'harassment' | 'other'>('spoiler');
  const [flagDetails, setFlagDetails] = useState('');
  const [flagSuccessMsg, setFlagSuccessMsg] = useState('');

  const refreshReviews = () => {
    const updated = StorageService.getReviews(seriesId);
    setReviews(updated);
    setSummary(StorageService.getReviewSummary(seriesId));
  };

  const handleStartEdit = () => {
    if (userExistingReview) {
      setSelectedRating(userExistingReview.rating);
      setReviewTitle(userExistingReview.reviewTitle);
      setReviewText(userExistingReview.reviewText);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userExistingReview) {
      setSelectedRating(userExistingReview.rating);
      setReviewTitle(userExistingReview.reviewTitle);
      setReviewText(userExistingReview.reviewText);
    } else {
      setSelectedRating(5);
      setReviewTitle('');
      setReviewText('');
    }
    setErrorMessage('');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewText.trim()) {
      setErrorMessage('Please provide both a headline and your review comments.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = StorageService.addOrUpdateReview({
        seriesId,
        seriesTitle,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatarUrl,
        userRole: user.role,
        isVIP,
        rating: selectedRating,
        reviewTitle: reviewTitle.trim(),
        reviewText: reviewText.trim(),
      });

      setIsSubmitting(false);
      setIsEditing(false);
      setSubmitSuccessMsg(
        result.isNew
          ? 'Your review was published to MangaWild!'
          : 'Your review was updated successfully!'
      );
      refreshReviews();

      setTimeout(() => setSubmitSuccessMsg(''), 3500);
    }, 300);
  };

  const handleDeleteUserReview = (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      StorageService.deleteReview(reviewId);
      setReviewTitle('');
      setReviewText('');
      setSelectedRating(5);
      setIsEditing(false);
      refreshReviews();
    }
  };

  const handleToggleLike = (reviewId: string) => {
    StorageService.toggleLikeReview(reviewId, user.id);
    refreshReviews();
  };

  // User Reporting / Flagging
  const handleOpenFlagModal = (reviewId: string) => {
    setFlaggingReviewId(reviewId);
    setFlagReason('spoiler');
    setFlagDetails('');
    setFlagSuccessMsg('');
  };

  const handleSubmitFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingReviewId) return;

    StorageService.flagReview(
      flaggingReviewId,
      user.id,
      user.name,
      flagReason,
      flagDetails.trim() || undefined
    );

    setFlagSuccessMsg('Report submitted. Our moderation desk will review this flag.');
    refreshReviews();

    setTimeout(() => {
      setFlaggingReviewId(null);
      setFlagSuccessMsg('');
    }, 2000);
  };

  // Admin Direct Controls
  const handleAdminToggleFlag = (reviewId: string) => {
    StorageService.toggleReviewFlagStatus(reviewId, user.name);
    refreshReviews();
  };

  const handleAdminModerate = (reviewId: string, status: 'approved' | 'hidden' | 'flagged') => {
    StorageService.updateReviewStatus(reviewId, status, `Moderated by admin ${user.name}`, user.name);
    refreshReviews();
  };

  const handleAdminDelete = (reviewId: string) => {
    if (window.confirm('Admin action: Permanently remove this review?')) {
      StorageService.deleteReview(reviewId);
      refreshReviews();
    }
  };

  // Filtered & Sorted Reviews
  const visibleReviews = useMemo(() => {
    let list = reviews;

    // Visibility filter (non-admins only see approved reviews)
    if (!isAdmin) {
      list = list.filter(r => r.status === 'approved');
    }

    // Rating / Flag filters
    if (selectedFilter === 'flagged') {
      list = list.filter(r => r.isFlagged === true || r.status === 'flagged');
    } else if (selectedFilter !== 'all') {
      const star = parseInt(selectedFilter, 10);
      list = list.filter(r => r.rating === star);
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'helpful') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortBy === 'highest') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lowest') {
        return a.rating - b.rating;
      }
      // 'recent' default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, isAdmin, selectedFilter, sortBy]);

  const flaggedCount = useMemo(() => reviews.filter(r => r.isFlagged || r.status === 'flagged').length, [reviews]);

  return (
    <div className="space-y-8 py-6">
      {/* 1. Header Bar with Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2">
                <span>Reader Ratings & Reviews</span>
              </h3>
              <p className="text-xs text-stone-400">
                Community impressions, panel critique & verified subscriber feedback
              </p>
            </div>
          </div>
        </div>

        {/* Big Overall Star Score Display */}
        <div className="flex items-center gap-4 bg-stone-900/90 border border-white/10 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center text-amber-400">
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
            <div className="ml-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-display leading-none">
                  {summary.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-stone-400 font-mono">/ 5.0</span>
              </div>
              <span className="text-[11px] text-stone-400 block font-sans">
                {summary.totalReviews} verified {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          {isAdmin && flaggedCount > 0 && (
            <div className="border-l border-white/10 pl-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Flagged
              </span>
              <span className="text-sm font-black text-amber-300 font-display">
                {flaggedCount} to review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Rating Breakdown Bar & Review Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Star Rating Distribution Progress Bars */}
        <div className="lg:col-span-5 bg-stone-900/40 border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 font-mono">
              Rating Breakdown
            </h4>
            <span className="text-[11px] text-stone-500">Click row to filter</span>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = summary.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              const isSelected = selectedFilter === String(stars);

              return (
                <button
                  type="button"
                  key={stars}
                  onClick={() => setSelectedFilter(isSelected ? 'all' : (String(stars) as any))}
                  className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-lg transition-all text-left ${
                    isSelected ? 'bg-amber-400/10 border border-amber-400/30' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="w-12 text-stone-300 flex items-center gap-1 font-mono font-bold shrink-0">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-stone-400 font-mono text-[11px] shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-stone-500 border-t border-white/5 pt-3 flex items-center justify-between">
            <span>Score formula: Weighted Bayesian average</span>
            {selectedFilter !== 'all' && (
              <button
                onClick={() => setSelectedFilter('all')}
                className="text-zinc-300 dark:text-zinc-200 hover:underline font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Right: Write or Edit Review Form (Linked to User Profile) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-xl">
          {/* Linked User Profile Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  {user.role === 'subscriber' && (
                    <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono">
                      SUBSCRIBER
                    </span>
                  )}
                  {user.role === 'creator' && (
                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono">
                      CREATOR
                    </span>
                  )}
                  {user.role === 'free_user' && (
                    <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] font-medium px-1.5 py-0.2 rounded uppercase font-mono">
                      READER
                    </span>
                  )}
                  {isAdmin && (
                    <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-400 block">
                  {userExistingReview && !isEditing
                    ? 'You have already reviewed this manga'
                    : 'Posting review linked to your MangaWild account'}
                </span>
              </div>
            </div>

            {userExistingReview && !isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-white/10"
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUserReview(userExistingReview.id)}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-white/10"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* If user already reviewed and is not in editing mode, show their existing review banner */}
          {userExistingReview && !isEditing ? (
            <div className="bg-white/[0.02] border border-emerald-500/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < userExistingReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white ml-1">
                    {userExistingReview.reviewTitle}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Published {new Date(userExistingReview.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {userExistingReview.reviewText}
              </p>
              <div className="text-[11px] text-stone-500 flex items-center gap-4 pt-1">
                <span>{userExistingReview.likesCount || 0} readers found this helpful</span>
                {userExistingReview.isFlagged && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Flag className="w-3 h-3" /> Under moderation review
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Interactive Star Rating Form */
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider font-mono">
                    Your Rating:
                  </label>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {RATING_LABELS[hoverRating || selectedRating]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2.5 rounded-xl border border-white/10">
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = (hoverRating || selectedRating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        className="p-1.5 hover:scale-125 transition-transform cursor-pointer"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : 'text-stone-700 hover:text-stone-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-sm font-black text-white ml-2 font-display">
                    {selectedRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Headline: Sum up your impression (e.g. Masterpiece art and kinetic combat!)"
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Share details on the storyline, character development, art style, pacing, or emotional impact..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                  <span>Please follow community guidelines (no unannounced spoilers).</span>
                  <span>{reviewText.length}/1000</span>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {submitSuccessMsg && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-200 bg-zinc-900 p-2.5 rounded-lg border border-zinc-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{submitSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : isEditing
                      ? 'Update Review'
                      : 'Publish Review'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 3. Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/10 p-3 rounded-xl text-xs">
        {/* Star Rating Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-1" />
          <span className="text-stone-400 font-medium shrink-0">Filter:</span>
          {(['all', '5', '4', '3', '2', '1'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedFilter === f
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              {f === 'all' ? 'All Reviews' : `${f} ★`}
            </button>
          ))}

          {/* Admin Flagged filter toggle */}
          {isAdmin && (
            <button
              onClick={() => setSelectedFilter(selectedFilter === 'flagged' ? 'all' : 'flagged')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ml-1 text-xs ${
                selectedFilter === 'flagged'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'
              }`}
            >
              <Flag className="w-3 h-3" />
              <span>Flagged ({flaggedCount})</span>
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-stone-900 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:outline-none focus:border-white"
          >
            <option value="recent">Newest First</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating (5-1)</option>
            <option value="lowest">Lowest Rating (1-5)</option>
          </select>
        </div>
      </div>

      {/* 4. Review Cards List */}
      <div className="space-y-4">
        {visibleReviews.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.01] border border-white/5 rounded-2xl text-stone-500 text-sm space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-stone-600" />
            <p>
              {selectedFilter !== 'all'
                ? 'No reviews match your current filter.'
                : 'No reviews posted yet. Be the first reader to share your thoughts!'}
            </p>
            {selectedFilter !== 'all' && (
              <button
                onClick={() => setSelectedFilter('all')}
                className="text-xs text-white underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          visibleReviews.map(review => {
            const isUserLiked = (review.likedByUsers || []).includes(user.id);
            const isAuthor = review.userId === user.id;

            return (
              <div
                key={review.id}
                className={`p-5 rounded-2xl border transition-all ${
                  review.status === 'hidden'
                    ? 'bg-stone-900/40 border-stone-800 opacity-60'
                    : review.isFlagged || review.status === 'flagged'
                    ? 'bg-amber-950/20 border-amber-700/50'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header: User Profile Details & Role Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.userAvatar ? (
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center text-stone-300 font-bold text-sm shrink-0">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {review.userName}
                        </span>

                        {review.userRole === 'subscriber' && (
                          <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                            SUBSCRIBER
                          </span>
                        )}

                        {review.userRole === 'creator' && (
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                            CREATOR
                          </span>
                        )}

                        {(review.userRole === 'free_user' || (!review.userRole && !review.isVIP)) && (
                          <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] font-medium px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                            READER
                          </span>
                        )}

                        {review.userRole === 'admin' && (
                          <span className="bg-amber-950/40 text-amber-400 border border-amber-500/30 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                            ADMIN
                          </span>
                        )}

                        <span className="text-[11px] text-stone-500">
                          · {new Date(review.createdAt).toLocaleDateString()}
                          {review.updatedAt && ' (edited)'}
                        </span>
                      </div>

                      {/* Stars + Title */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                        <h4 className="text-sm font-bold text-stone-100 ml-1">
                          {review.reviewTitle}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Status / Admin Moderation Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    {review.status === 'hidden' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-stone-800 text-stone-300 border border-white/10 flex items-center gap-1 font-mono">
                        <ShieldAlert className="w-3 h-3" /> HIDDEN
                      </span>
                    )}

                    {(review.isFlagged || review.status === 'flagged') && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center gap-1 font-mono">
                        <Flag className="w-3 h-3" /> FLAGGED ({review.flagCount || 1})
                      </span>
                    )}

                    {/* Admin Moderation Bar */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-stone-900 border border-white/10 p-1 rounded-xl">
                        <span className="text-[10px] text-stone-400 px-1 font-mono">Mod:</span>

                        {/* Direct Moderation Flag Toggle */}
                        <button
                          type="button"
                          onClick={() => handleAdminToggleFlag(review.id)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors flex items-center gap-1 ${
                            review.isFlagged
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-white/5 text-stone-400 hover:text-white'
                          }`}
                          title={review.isFlagged ? 'Click to unflag review' : 'Click to flag review'}
                        >
                          <Flag className="w-2.5 h-2.5" />
                          <span>{review.isFlagged ? 'Unflag' : 'Flag'}</span>
                        </button>

                        {/* Approve / Restore */}
                        {review.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleAdminModerate(review.id, 'approved')}
                            className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 rounded"
                          >
                            Approve
                          </button>
                        )}

                        {/* Hide / Unhide */}
                        {review.status !== 'hidden' ? (
                          <button
                            type="button"
                            onClick={() => handleAdminModerate(review.id, 'hidden')}
                            className="px-2 py-0.5 text-[10px] font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 rounded border border-white/10"
                          >
                            Hide
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdminModerate(review.id, 'approved')}
                            className="px-2 py-0.5 text-[10px] font-bold bg-stone-700 text-stone-200 hover:bg-stone-600 rounded"
                          >
                            Unhide
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleAdminDelete(review.id)}
                          className="p-1 text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Body */}
                <p className="text-sm text-stone-300 mt-3 leading-relaxed whitespace-pre-line pl-0.5">
                  {review.reviewText}
                </p>

                {/* Flag Notice / Reason if Flagged */}
                {review.isFlagged && review.moderationReason && (
                  <div className="mt-2.5 p-2 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300/90 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-semibold text-amber-200">Moderation Note:</span>{' '}
                      {review.moderationReason}
                    </div>
                  </div>
                )}

                {/* Footer Actions: Helpful button & Flag button */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-stone-400">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(review.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isUserLiked
                          ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isUserLiked ? 'fill-current' : ''}`} />
                      <span>Helpful ({review.likesCount || 0})</span>
                    </button>

                    {!isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleOpenFlagModal(review.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Report inappropriate review or unannounced spoilers"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Report</span>
                      </button>
                    )}
                  </div>

                  {isAuthor && (
                    <div className="text-[11px] text-zinc-500">
                      Your submitted review
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. User Flag / Report Modal */}
      {flaggingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setFlaggingReviewId(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Report Manga Review</h4>
                <p className="text-xs text-zinc-400">
                  Help MangaWild maintain an authentic, respectful reading community.
                </p>
              </div>
            </div>

            {flagSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto text-white" />
                <p className="text-sm font-semibold text-zinc-200">{flagSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFlag} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block font-mono">
                    Select Violation Category:
                  </label>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {[
                      { id: 'spoiler', label: 'Unmarked plot spoiler' },
                      { id: 'inappropriate', label: 'Profanity or offensive content' },
                      { id: 'spam', label: 'Spam, advertising, or self-promotion' },
                      { id: 'harassment', label: 'Harassment or creator abuse' },
                      { id: 'other', label: 'Other violation' },
                    ].map(opt => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          flagReason === opt.id
                            ? 'bg-zinc-800 border-zinc-500 text-white font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="flagReason"
                          value={opt.id}
                          checked={flagReason === opt.id}
                          onChange={() => setFlagReason(opt.id as any)}
                          className="accent-zinc-400"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1 font-mono">
                    Additional Details (Optional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide context for our editorial desk..."
                    value={flagDetails}
                    onChange={e => setFlagDetails(e.target.value)}
                    maxLength={300}
                    className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFlaggingReviewId(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

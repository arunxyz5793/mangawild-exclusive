import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  Bookmark,
  Share2,
  BookOpen,
  Sparkles,
  Check,
  ChevronRight,
  Search,
  ArrowUpDown,
  Plus,
  MessageSquare,
  Heart,
  Eye,
  Lock,
  Crown,
  UserPlus,
  Coins,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { CreatorTipJar } from '../components/CreatorTipJar';
import { RatingReviewSection } from '../components/RatingReviewSection';
import { MangaCommentsSection } from '../components/MangaCommentsSection';
import { MangaSeries, Chapter } from '../types/manga';

interface SeriesDetailPageProps {
  seriesId: string;
  onReadChapter: (seriesId: string, chapterId: string) => void;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenVIPModal?: (planId?: 'monthly' | 'yearly') => void;
}

export const SeriesDetailPage: React.FC<SeriesDetailPageProps> = ({
  seriesId,
  onReadChapter,
  onNavigate,
  onOpenVIPModal,
}) => {
  const { user, isVIP, bookmarks, toggleBookmark, likedSeries, toggleLikeSeries, followedCreators, toggleFollowCreator } = useAuth();
  const { theme } = useTheme();

  const [series, setSeries] = useState<MangaSeries | undefined>(() => StorageService.getSeriesById(seriesId));
  const chapters = useMemo(() => StorageService.getChapters(seriesId), [seriesId]);
  const [creatorProfile, setCreatorProfile] = useState(() => {
    if (!series) return undefined;
    let found = StorageService.getCreatorById(series.creatorId);
    if (!found && series.author) {
      found = StorageService.getCreatorByAuthorName(series.author);
    }
    if (!found && series.author) {
      const all = StorageService.getCreators();
      const newProf = {
        id: series.creatorId || `creator_${encodeURIComponent(series.author.toLowerCase())}`,
        userId: `user_${encodeURIComponent(series.author.toLowerCase())}`,
        penName: series.author,
        handle: `@${series.author.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        bio: `Original mangaka and graphic novel creator of "${series.title}".`,
        avatarUrl: series.coverUrl || '/avatars/avatar-3.svg',
        verified: true,
        followersCount: 0,
        totalReads: series.totalReads ?? 0,
        seriesCount: 1,
        joinedDate: '2026-01-15',
        joinedAt: '2026-01-15',
        monthlyEarningsInr: 0,
        revenueSharePercent: 70,
        socialLinks: {},
      };
      all.push(newProf);
      StorageService.saveCreators(all);
      return newProf;
    }
    return found;
  });
  const creator = creatorProfile;
  const readingHistory = useMemo(() => StorageService.getReadingHistory(user.id), [user.id]);

  const [shareCopied, setShareCopied] = useState(false);
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [likesCount, setLikesCount] = useState<number>(() => series?.likesCount ?? 0);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  // Increment series views on view mount
  useEffect(() => {
    if (seriesId) {
      const updatedViews = StorageService.incrementSeriesViews(seriesId);
      setSeries(prev => prev ? { ...prev, totalViews: updatedViews } : prev);
    }
  }, [seriesId]);

  const isCreatorOfSeries = series && (
    series.creatorId === user.creatorProfileId ||
    series.creatorId === `creator_${user.id}` ||
    series.author.toLowerCase() === user.name.toLowerCase()
  );

  const displayedChapters = useMemo(() => {
    let list = [...chapters];
    if (chapterSearchQuery.trim()) {
      const q = chapterSearchQuery.toLowerCase().trim();
      list = list.filter(
        c => c.title.toLowerCase().includes(q) ||
             c.chapterNumber.toString().includes(q)
      );
    }
    if (sortOrder === 'desc') {
      list.sort((a, b) => b.chapterNumber - a.chapterNumber);
    } else {
      list.sort((a, b) => a.chapterNumber - b.chapterNumber);
    }
    return list;
  }, [chapters, chapterSearchQuery, sortOrder]);

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          Manga Series Not Found
        </h2>
        <p className="text-zinc-400">The manga you are looking for might have been moved or unpublished.</p>
        <button
          onClick={() => onNavigate('browse')}
          className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Return to Browse
        </button>
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(series.id);
  const isFollowingCreator = creator ? followedCreators.includes(creator.id) : false;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const firstChapter = chapters[0];
  const seriesProgress = readingHistory.find(h => h.seriesId === series.id);
  const resumeChapter = seriesProgress
    ? chapters.find(c => c.id === seriesProgress.chapterId) || firstChapter
    : firstChapter;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 select-none">
      {/* 1. Series Hero Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Cover Art (3:4 ratio) */}
        <div className="md:col-span-4 lg:col-span-3">
          <div
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden border shadow-2xl ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 shadow-black/80'
                : 'bg-zinc-100 border-zinc-300 shadow-zinc-300'
            }`}
          >
            <img
              src={series.coverUrl}
              alt={series.title}
              className="w-full h-full object-cover"
            />
            {series.isExclusive && (
              <span className={`absolute top-3 right-3 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded uppercase font-mono border shadow-md flex items-center gap-1 ${
                isVIP
                  ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                  : 'bg-black text-white border-zinc-700'
              }`}>
                <Lock className="w-3 h-3" />
                {isVIP ? 'VIP UNLOCKED' : 'VIP EXCLUSIVE'}
              </span>
            )}
          </div>
        </div>

        {/* Series Metadata & Actions */}
        <div className="md:col-span-8 lg:col-span-9 space-y-5">
          <div className="space-y-2">
            {/* Clean Unboxed Metadata with · Separators */}
            <div className={`flex flex-wrap items-center gap-2 text-xs font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <span className={`font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{series.genres.join(' · ')}</span>
              <span>·</span>
              <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>{series.releaseYear}</span>
              <span>·</span>
              <span className={`capitalize font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>{series.status}</span>
            </div>

            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {series.title}
            </h1>

            {/* Author Attribution */}
            <div className="flex items-center gap-3 pt-1 text-sm">
              <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}>
                Created by{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('creator-profile', { id: series.creatorId, author: series.author })}
                  className={`font-semibold underline decoration-zinc-500 underline-offset-4 hover:text-white transition-colors cursor-pointer ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-950'
                  }`}
                  title={`View ${series.author}'s Creator Profile`}
                >
                  {series.author}
                </button>
              </span>
              {creator && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toggleFollowCreator(creator.id);
                      setCreatorProfile(prev => {
                        if (!prev) return prev;
                        const wasFollowing = followedCreators.includes(creator.id);
                        return {
                          ...prev,
                          followersCount: wasFollowing ? Math.max(0, prev.followersCount - 1) : prev.followersCount + 1,
                        };
                      });
                    }}
                    className={`text-xs px-3 py-1 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isFollowingCreator
                        ? theme === 'dark'
                          ? 'bg-zinc-800 border-zinc-700 text-white'
                          : 'bg-zinc-200 border-zinc-300 text-zinc-900'
                        : 'bg-white hover:bg-zinc-200 text-zinc-950 border-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isFollowingCreator ? '✓ Following' : '+ Follow'}</span>
                    <span className="text-[10px] font-mono opacity-80">({creator.followersCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTipModalOpen(true)}
                    className={`text-xs px-3 py-1 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                      theme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                    }`}
                    title={`Tip ${series.author}`}
                  >
                    <Coins className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Tip</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Aggregate Stats (Views, Likes, Rating, Chapters) */}
          <div
            className={`flex flex-wrap items-center gap-6 py-3 px-5 rounded-2xl border max-w-xl ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900 shadow-xs'
            }`}
          >
            <div>
              <span className={`text-[10px] font-mono uppercase block ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Rating
              </span>
              <div className={`flex items-center gap-1 font-bold font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span>{series.rating.toFixed(1)}</span>
                <span className="text-zinc-500 text-xs font-normal">/ 5.0</span>
              </div>
            </div>

            <div className={`w-px h-8 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            <div>
              <span className={`text-[10px] font-mono uppercase block ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Total Views
              </span>
              <div className={`flex items-center gap-1.5 font-bold font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>{(series.totalViews ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className={`w-px h-8 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            <div>
              <span className={`text-[10px] font-mono uppercase block ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Likes
              </span>
              <div className={`flex items-center gap-1.5 font-bold font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                <Heart className="w-3.5 h-3.5 fill-current text-zinc-400" />
                <span>{likesCount.toLocaleString()}</span>
              </div>
            </div>

            <div className={`w-px h-8 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            <div>
              <span className={`text-[10px] font-mono uppercase block ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Chapters
              </span>
              <span className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                {chapters.length}
              </span>
            </div>
          </div>

          {/* Synopsis */}
          <p
            className={`text-sm leading-relaxed max-w-3xl ${
              theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
            }`}
          >
            {series.synopsis}
          </p>

          {/* Action Row - Fully Responsive & Monochromatic */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 w-full">
            {resumeChapter ? (
              <button
                onClick={() => {
                  const isSeriesExclusive = Boolean(series.isExclusive);
                  const isLockedToUser = (isSeriesExclusive || resumeChapter.isExclusiveVIP) && !isVIP && user.role !== 'admin' && !isCreatorOfSeries;
                  if (isLockedToUser) {
                    onOpenVIPModal?.('monthly');
                  } else {
                    onReadChapter(series.id, resumeChapter.id);
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer hover:ring-2 hover:ring-white/30"
              >
                {Boolean(series.isExclusive && !isVIP && user.role !== 'admin' && !isCreatorOfSeries) ? (
                  <>
                    <Lock className="w-4 h-4 text-black" />
                    <span>Unlock VIP to Read</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-black" />
                    <span>
                      {seriesProgress ? `Resume Ch. ${resumeChapter.chapterNumber}` : 'Read Ch. 1'}
                    </span>
                  </>
                )}
              </button>
            ) : (user.role === 'admin' || isCreatorOfSeries) ? (
              <button
                onClick={() => onNavigate('creator')}
                className="w-full sm:w-auto px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer hover:ring-2 hover:ring-white/30"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Add Chapter</span>
              </button>
            ) : null}

            {/* Like Button (Strictly Monochromatic) */}
            <button
              onClick={() => {
                const res = toggleLikeSeries(series.id);
                setLikesCount(res.likesCount);
              }}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                likedSeries.includes(series.id)
                  ? 'bg-white text-black border-white shadow-sm'
                  : theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:text-zinc-950 shadow-xs'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  likedSeries.includes(series.id) ? 'fill-black text-black' : 'text-zinc-400'
                }`}
              />
              <span>{likedSeries.includes(series.id) ? 'Liked' : 'Like'}</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={() => toggleBookmark(series.id)}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isBookmarked
                  ? 'bg-zinc-800 border-zinc-700 text-white shadow-xs'
                  : theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:text-zinc-950 shadow-xs'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-white' : 'text-zinc-400'}`} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Tip Artist Button (Razorpay UPI / Cards) */}
            <button
              onClick={() => setIsTipModalOpen(true)}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:text-zinc-950 shadow-xs'
              }`}
              title={`Tip ${series.author}`}
            >
              <Coins className="w-4 h-4 text-zinc-400" />
              <span>Tip Artist</span>
            </button>

            <button
              onClick={handleShare}
              className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-xs'
              }`}
              title="Share link"
            >
              {shareCopied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Chapter Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-zinc-200 dark:border-zinc-800">
          <div>
            <h2
              className={`text-xl font-bold font-serif ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              Chapters ({chapters.length})
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Latest releases
            </span>
          </div>

          {chapters.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={chapterSearchQuery}
                  onChange={e => setChapterSearchQuery(e.target.value)}
                  placeholder="Filter chapters..."
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs transition-colors border focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600'
                      : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                />
              </div>

              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
                title="Toggle chapter order"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'asc' ? '1 → N' : 'N → 1'}</span>
              </button>
            </div>
          )}
        </div>

        {chapters.length === 0 ? (
          <div
            className={`p-10 text-center rounded-2xl border space-y-3 ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <BookOpen className="w-9 h-9 text-zinc-500 mx-auto" />
            <h4
              className={`text-sm font-bold ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              No Chapters Published Yet
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              This series is in active production. Follow this creator to be notified when Chapter 1 drops!
            </p>
            {(user.role === 'admin' || isCreatorOfSeries) && (
              <button
                onClick={() => onNavigate('creator')}
                className="mt-2 px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 hover:bg-zinc-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Chapter Pages in Creator Studio</span>
              </button>
            )}
          </div>
        ) : displayedChapters.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-400">
            No chapters match &ldquo;{chapterSearchQuery}&rdquo;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedChapters.map(chapter => {
              const isChapterVIP = Boolean(series.isExclusive || chapter.isExclusiveVIP);
              const isCreatorOfSeries = series && (
                series.creatorId === user.creatorProfileId ||
                series.creatorId === `creator_${user.id}` ||
                series.author.toLowerCase() === user.name?.toLowerCase()
              );
              const hasVIPAccess = Boolean(isVIP || user.isVIP || user.subscription?.status === 'active' || user.role === 'admin' || isCreatorOfSeries);
              const isLocked = isChapterVIP && !hasVIPAccess;

              return (
                <div
                  key={chapter.id}
                  onClick={() => {
                    if (isLocked) {
                      onOpenVIPModal?.('monthly');
                    } else {
                      onReadChapter(series.id, chapter.id);
                    }
                  }}
                  className={`group p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isLocked
                      ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                      : isChapterVIP && hasVIPAccess
                      ? 'bg-zinc-900/80 border-zinc-700 hover:border-zinc-500'
                      : theme === 'dark'
                      ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isLocked
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : isChapterVIP && hasVIPAccess
                          ? 'bg-zinc-800 text-white border border-zinc-600'
                          : theme === 'dark'
                          ? 'bg-zinc-800 text-zinc-300'
                          : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
                      }`}
                    >
                      {chapter.chapterNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs font-bold transition-colors ${
                            theme === 'dark' ? 'text-white group-hover:text-zinc-200' : 'text-zinc-900 group-hover:text-zinc-700'
                          }`}
                        >
                          {chapter.title}
                        </h4>
                        {isChapterVIP && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            {hasVIPAccess ? 'VIP Unlocked' : 'VIP Locked'}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {chapter.panels?.length || 0} pages · {isLocked ? 'VIP Subscription Required' : 'Unlocked to read'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <span className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock</span>
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 transition-transform group-hover:translate-x-0.5 ${
                          theme === 'dark' ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900'
                        }`}
                      >
                        <span>Read</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Support Mangaka Tip Jar (Razorpay UPI & Cards) */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-full box-border">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-white" />
            <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Support Mangaka ({series.author})
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">100% Direct Payout via Razorpay</span>
        </div>
        <CreatorTipJar
          creatorId={creator?.id || series.creatorId}
          creatorName={series.author}
          seriesId={series.id}
          seriesTitle={series.title}
        />
      </div>

      {/* 4. Manga Reader Comments & Discussion Section */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <MangaCommentsSection seriesId={series.id} />
      </div>

      {/* 5. Community Reviews & Rating Component */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <RatingReviewSection seriesId={series.id} seriesTitle={series.title} />
      </div>

      {/* Tip Artist Modal (Razorpay UPI & Cards) */}
      {isTipModalOpen && (
        <div
          onClick={() => setIsTipModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in box-border"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden box-border"
          >
            <button
              onClick={() => setIsTipModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors z-10 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-serif font-bold text-white">Tip Mangaka ({series.author})</h3>
              <p className="text-xs text-zinc-400 font-mono">
                Support the creator of &ldquo;{series.title}&rdquo; directly via Razorpay (UPI, GPay, Cards)
              </p>
            </div>

            <CreatorTipJar
              creatorId={creator?.id || series.creatorId}
              creatorName={series.author}
              seriesId={series.id}
              seriesTitle={series.title}
              onTipSent={() => {
                setIsTipModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

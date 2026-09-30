import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  ChevronRight,
  BookOpen,
  Bookmark,
  Calendar,
  Sparkles,
  TrendingUp,
  Crown,
  Play,
  ArrowRight,
  PenTool,
  Shield,
  MessageSquare,
  Clock,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { MangaSeries, Chapter } from '../types/manga';

interface HomePageProps {
  onSelectSeries: (seriesId: string) => void;
  onReadChapter: (seriesId: string, chapterId: string) => void;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenVIPModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectSeries,
  onReadChapter,
  onNavigate,
  onOpenVIPModal,
}) => {
  const { theme } = useTheme();
  const { isVIP, bookmarks, toggleBookmark } = useAuth();

  const allSeries = useMemo(() => StorageService.getSeries().filter(s => s.moderationStatus === 'approved'), []);
  const allChapters = useMemo(() => StorageService.getChapters(), []);
  const allReviews = useMemo(() => StorageService.getReviews(), []);

  // 1. Featured Spotlight Carousel State
  const featuredSeriesList = useMemo(() => allSeries.slice(0, 3), [allSeries]);
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);
  const currentSpotlight = featuredSeriesList[activeSpotlightIdx] || featuredSeriesList[0];

  // Auto-rotate spotlight
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSpotlightIdx(prev => (prev + 1) % featuredSeriesList.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredSeriesList.length]);

  // 2. Top Ranked Leaderboard (Top 5)
  const rankedSeries = useMemo(() => {
    return [...allSeries]
      .sort((a, b) => b.totalReads - a.totalReads)
      .slice(0, 5);
  }, [allSeries]);

  // 4. Curated Genre Discovery
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const genres = ['All', 'Mystery', 'Dark Comedy', 'Sci-Fi', 'Horror', 'Slice of Life', 'Adventure', 'Dark Fantasy', 'Thriller', 'Adult'];

  const filteredCatalog = useMemo(() => {
    if (selectedGenre === 'All') return allSeries;
    return allSeries.filter(s => s.genres.includes(selectedGenre as any));
  }, [allSeries, selectedGenre]);

  // 5. Community Reviews Spotlight
  const highlightedReviews = useMemo(() => {
    return allReviews.filter(r => r.status === 'approved' && r.rating >= 4).slice(0, 3);
  }, [allReviews]);

  const getFirstChapter = (seriesId: string): Chapter | undefined => {
    const chs = StorageService.getChapters(seriesId);
    return chs[0];
  };

  const firstChapterOfSpotlight = currentSpotlight ? getFirstChapter(currentSpotlight.id) : undefined;
  const isSpotlightBookmarked = currentSpotlight ? bookmarks.includes(currentSpotlight.id) : false;

  return (
    <div className="space-y-16 pb-20 select-none">
      {/* ========================================================================= */}
      {/* 1. EDITORIAL SPOTLIGHT (Hero Section - Monochrome Elegance)                */}
      {/* ========================================================================= */}
      <section
        className={`relative overflow-hidden border-b transition-colors ${
          theme === 'dark'
            ? 'bg-[#09090b] border-zinc-800'
            : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        {/* Ambient Subtle Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl scale-110 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${currentSpotlight?.coverUrl})` }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Metadata & Presentation */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-zinc-800 text-zinc-100 dark:bg-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded font-mono shadow-xs">
                  FLAGSHIP SPOTLIGHT
                </span>
                <span className="text-zinc-400 font-mono">Original Series</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 dark:text-zinc-200 font-mono flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {currentSpotlight?.rating.toFixed(1)} / 5.0 Rating
                </span>
              </div>

              {/* Title & Unboxed Metadata */}
              <div className="space-y-3">
                <h1
                  className={`text-4xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {currentSpotlight?.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span>
                    Written by{' '}
                    <strong className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}>
                      {currentSpotlight?.author}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>{currentSpotlight?.genres.join(' · ')}</span>
                  <span>·</span>
                  <span className="font-mono">
                    {currentSpotlight?.totalReads.toLocaleString()} readers
                  </span>
                  {currentSpotlight?.isExclusive && (
                    <>
                      <span>·</span>
                      <span className="text-zinc-200 font-bold uppercase flex items-center gap-1 font-mono">
                        <Crown className="w-3.5 h-3.5" /> VIP Exclusive
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <p
                className={`text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-3 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                {currentSpotlight?.synopsis}
              </p>

              {/* High-Contrast Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {firstChapterOfSpotlight && (
                  <button
                    onClick={() => onReadChapter(currentSpotlight.id, firstChapterOfSpotlight.id)}
                    className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 duration-150 flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read First Chapter</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectSeries(currentSpotlight.id)}
                  className={`px-5 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 duration-150 flex items-center gap-2 cursor-pointer border ${
                    theme === 'dark'
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'
                      : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300 shadow-xs'
                  }`}
                >
                  <span>Series Overview</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleBookmark(currentSpotlight.id)}
                  className={`p-3 rounded-xl border transition-all active:scale-95 duration-150 cursor-pointer ${
                    isSpotlightBookmarked
                      ? 'bg-zinc-800 text-white border-zinc-600'
                      : theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950'
                  }`}
                  title={isSpotlightBookmarked ? 'Remove from Library' : 'Add to Library'}
                >
                  <Bookmark className={`w-4 h-4 ${isSpotlightBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Right: Poster & Thumbnails */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center gap-6">
              <div
                onClick={() => onSelectSeries(currentSpotlight.id)}
                className={`group relative w-60 sm:w-68 aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] shadow-2xl border ${
                  theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 shadow-black/80'
                    : 'bg-zinc-100 border-zinc-300 shadow-zinc-300'
                }`}
              >
                <img
                  src={currentSpotlight?.coverUrl}
                  alt={currentSpotlight?.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Play className="w-3.5 h-3.5 fill-white text-white" /> Open Reader
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex sm:flex-col lg:flex-row items-center gap-2">
                {featuredSeriesList.map((series, idx) => (
                  <button
                    key={series.id}
                    onClick={() => setActiveSpotlightIdx(idx)}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeSpotlightIdx === idx
                        ? 'border-white bg-zinc-800 dark:bg-zinc-800 shadow-xs'
                        : theme === 'dark'
                        ? 'border-zinc-800 bg-zinc-900/60 opacity-60 hover:opacity-100'
                        : 'border-zinc-200 bg-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={series.coverUrl}
                      alt={series.title}
                      className="w-8 h-10 object-cover rounded-md bg-zinc-800"
                    />
                    <div className="hidden sm:block pr-2">
                      <span
                        className={`text-[11px] font-bold block truncate max-w-[110px] ${
                          theme === 'dark' ? 'text-white' : 'text-zinc-900'
                        }`}
                      >
                        {series.title}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono block">
                        {series.genres[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TOP RANKED LEADERBOARD (#1-5)                                          */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
              <TrendingUp className="w-4 h-4" />
              <span>Official Leaderboard</span>
            </div>
            <h2
              className={`text-2xl font-bold font-serif tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              Top 5 Most Read Series
            </h2>
          </div>
          <button
            onClick={() => onNavigate('trending')}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Full Rankings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {rankedSeries.map((series, idx) => (
            <div
              key={series.id}
              onClick={() => onSelectSeries(series.id)}
              className={`group relative p-3 rounded-2xl border card-interactive active:scale-98 cursor-pointer flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 shadow-sm'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
              }`}
            >
              {/* Rank Badge */}
              <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-lg bg-zinc-950/90 text-white font-mono font-black text-xs flex items-center justify-center border border-zinc-700 shadow-xs">
                #{idx + 1}
              </div>

              <div className="space-y-3">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="space-y-1">
                  <h3
                    className={`text-sm font-bold truncate group-hover:text-zinc-300 transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {series.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span>{series.genres[0]}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-zinc-300 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      {series.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-mono">{series.totalReads.toLocaleString()} reads</span>
                <span className="text-zinc-300 font-bold group-hover:translate-x-0.5 transition-transform">
                  Read →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURATED GENRE EXPLORER                                                  */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
              <Compass className="w-4 h-4" />
              <span>Catalog Diversity</span>
            </div>
            <h2
              className={`text-2xl font-bold font-serif tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              Curated by Genre
            </h2>
          </div>

          {/* Interactive Genre Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
                  selectedGenre === genre
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                    : theme === 'dark'
                    ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredCatalog.slice(0, 6).map(series => (
            <div
              key={series.id}
              onClick={() => onSelectSeries(series.id)}
              className={`group p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                theme === 'dark'
                  ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
              }`}
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                <img
                  src={series.coverUrl}
                  alt={series.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="space-y-0.5">
                <h3
                  className={`text-xs font-bold truncate group-hover:text-zinc-300 transition-colors ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {series.title}
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono truncate">{series.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BECOME A CREATOR BANNER (Ultra-Clean Monochrome)                        */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`relative rounded-3xl p-8 sm:p-12 overflow-hidden border ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'bg-zinc-950 text-white border-zinc-900'
          }`}
        >
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              <PenTool className="w-4 h-4" />
              <span>Open Submissions</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-white">
              Become a MangaWild Creator
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
              Publish original manga, webtoons, and graphic stories to hundreds of thousands of readers.
              Keep 100% intellectual property ownership, earn 70% net revenue split, and receive weekly payouts via direct UPI or bank transfer.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="font-bold text-white text-lg font-mono">70%</p>
                <p className="text-zinc-400">Creator revenue split</p>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="font-bold text-white text-lg font-mono">Weekly</p>
                <p className="text-zinc-400">Direct UPI & Bank payouts</p>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <p className="font-bold text-white text-lg font-mono">100%</p>
                <p className="text-zinc-400">Your copyright & IP</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('creator')}
                className="px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>Start Publishing Today</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. VERIFIED COMMUNITY CRITIQUES                                           */}
      {/* ========================================================================= */}
      {highlightedReviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
                <MessageSquare className="w-4 h-4" />
                <span>Reader Community</span>
              </div>
              <h2
                className={`text-2xl font-bold font-serif tracking-tight mt-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-zinc-900'
                }`}
              >
                Verified Reader Critiques
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlightedReviews.map(rev => (
              <div
                key={rev.id}
                onClick={() => onSelectSeries(rev.seriesId)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  theme === 'dark'
                    ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 truncate">
                      {rev.seriesTitle}
                    </span>
                    <div className="flex items-center gap-0.5 text-zinc-300">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-current' : 'text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h4
                    className={`text-sm font-bold leading-snug ${
                      theme === 'dark' ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    &ldquo;{rev.reviewTitle}&rdquo;
                  </h4>

                  <p
                    className={`text-xs leading-relaxed line-clamp-3 ${
                      theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'
                    }`}
                  >
                    {rev.reviewText}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300 truncate">{rev.userName}</span>
                  <span className="font-mono text-[11px]">{rev.likesCount} helpful</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

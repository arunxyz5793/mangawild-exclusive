import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Star,
  Bookmark,
  Crown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
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
}) => {
  const { bookmarks, toggleBookmark } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const allSeries = useMemo(
    () => StorageService.getSeries().filter(s => s.moderationStatus === 'approved'),
    []
  );

  // 1. Featured Manga Spotlight List: SILENT HEADS, Chitra Khatha Chintu, A Promise Never Broken, Randamu Boken
  const spotlightSeriesList = useMemo(() => {
    const targetIds = [
      'series_silent_heads',
      'series_chitrakatha_chintu',
      'series_a_promise_never_broken',
      'series_randamu_boken',
    ];
    const targetSlugs = [
      'silent-heads',
      'chitrakatha-chintu',
      'a-promise-never-broken',
      'randamu-boken',
    ];

    const matched: MangaSeries[] = [];
    targetIds.forEach((id, idx) => {
      const found = allSeries.find(
        s => s.id === id || s.slug === targetSlugs[idx]
      );
      if (found) matched.push(found);
    });

    return matched.length > 0 ? matched : allSeries.slice(0, 4);
  }, [allSeries]);

  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState(false);

  // Touch & Mouse Swipe state for Spotlight
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  useEffect(() => {
    if (spotlightSeriesList.length <= 1 || isSpotlightPaused) return;
    const timer = window.setInterval(() => {
      setSpotlightIndex(prev => (prev + 1) % spotlightSeriesList.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [spotlightSeriesList.length, isSpotlightPaused]);

  const featuredSpotlight = spotlightSeriesList[spotlightIndex] || spotlightSeriesList[0];

  const handlePrevSpotlight = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSpotlightIndex(prev =>
      prev === 0 ? spotlightSeriesList.length - 1 : prev - 1
    );
  };

  const handleNextSpotlight = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSpotlightIndex(prev => (prev + 1) % spotlightSeriesList.length);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    swipeStartXRef.current = e.touches[0].clientX;
    swipeStartYRef.current = e.touches[0].clientY;
    didSwipeRef.current = false;
    setIsSpotlightPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsSpotlightPaused(false);
    if (swipeStartXRef.current === null || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartXRef.current;
    const deltaY = swipeStartYRef.current !== null ? Math.abs(e.changedTouches[0].clientY - swipeStartYRef.current) : 0;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > deltaY) {
      didSwipeRef.current = true;
      if (deltaX < 0) {
        handleNextSpotlight();
      } else {
        handlePrevSpotlight();
      }
    }
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
  };

  // Mouse drag swipe handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    swipeStartXRef.current = e.clientX;
    swipeStartYRef.current = e.clientY;
    didSwipeRef.current = false;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (swipeStartXRef.current === null) return;
    const deltaX = e.clientX - swipeStartXRef.current;
    const deltaY = swipeStartYRef.current !== null ? Math.abs(e.clientY - swipeStartYRef.current) : 0;

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > deltaY) {
      didSwipeRef.current = true;
      if (deltaX < 0) {
        handleNextSpotlight();
      } else {
        handlePrevSpotlight();
      }
    }
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
  };

  // Curated Genre discovery
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const genres = ['All', 'Mystery', 'Dark Comedy', 'Sci-Fi', 'Horror', 'Slice of Life', 'Adventure', 'Dark Fantasy'];

  // Trending / Ranked Manga list (Ranked #1, #2, #3, ...)
  const trendingSeries = useMemo(() => {
    return [...allSeries]
      .sort((a, b) => (a.rankNumber ?? 99) - (b.rankNumber ?? 99));
  }, [allSeries]);

  // Filtered All Manga catalog
  const filteredCatalog = useMemo(() => {
    if (selectedGenre === 'All') return allSeries;
    return allSeries.filter(s => s.genres.includes(selectedGenre as any));
  }, [allSeries, selectedGenre]);

  const getFirstChapter = (seriesId: string): Chapter | undefined => {
    const chs = StorageService.getChapters(seriesId);
    return chs[0];
  };

  return (
    <div
      className={`min-h-screen pb-28 pt-2 select-none w-full max-w-full overflow-x-hidden box-border transition-colors duration-200 ${
        isLight ? 'bg-white text-black' : 'bg-black text-white'
      }`}
    >
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 space-y-7 sm:space-y-9 box-border">

        {/* ========================================================================= */}
        {/* 1. MINIMAL EDITORIAL SPOTLIGHT CAROUSEL (Auto-Rotate + Touch/Mouse Swipe) */}
        {/* ========================================================================= */}
        {featuredSpotlight && (
          <div
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false;
                return;
              }
              onSelectSeries(featuredSpotlight.id);
            }}
            onMouseEnter={() => setIsSpotlightPaused(true)}
            onMouseLeave={() => {
              setIsSpotlightPaused(false);
              swipeStartXRef.current = null;
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className={`hero-card group relative w-full max-w-full box-border min-h-[460px] sm:min-h-[500px] lg:h-[560px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-300 flex flex-col justify-between p-4 sm:p-6 border ${
              isLight
                ? 'bg-white border-black shadow-none'
                : 'bg-zinc-950 border-white/20 hover:border-white/40 shadow-xl'
            }`}
          >
            {/* Ambient Background Gradient Glow */}
            <div
              key={`bg-${featuredSpotlight.id}`}
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110 pointer-events-none transition-all duration-700 group-hover:opacity-30"
              style={{ backgroundImage: `url(${featuredSpotlight.bannerUrl || featuredSpotlight.coverUrl})` }}
            />

            {/* Main Cover Artwork with Gentle Zoom */}
            <img
              key={`img-${featuredSpotlight.id}`}
              src={featuredSpotlight.coverUrl || featuredSpotlight.bannerUrl}
              alt={featuredSpotlight.title}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover sm:object-contain sm:object-right-top transition-all duration-700 ease-out group-hover:scale-[1.02] z-0 opacity-85 sm:opacity-95 pointer-events-none"
            />

            {/* Seamless Vignette Overlay for Readability (Adapts to Light/Dark Theme) */}
            <div
              className={`absolute inset-0 z-10 pointer-events-none ${
                isLight
                  ? 'bg-gradient-to-t from-white via-white/85 to-white/20 sm:bg-gradient-to-r sm:from-white sm:via-white/85 sm:to-transparent'
                  : 'bg-gradient-to-t from-black via-black/75 to-black/30 sm:bg-gradient-to-r sm:from-black sm:via-black/80 sm:to-transparent'
              }`}
            />

            {/* Top Bar: Minimal Spotlight Pill + Slide Counter + Quick Bookmark */}
            <div className="relative z-20 flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border ${
                    isLight
                      ? 'bg-white text-black border-black'
                      : 'bg-black/70 backdrop-blur-md text-white border-white/25'
                  }`}
                >
                  Spotlight {spotlightIndex + 1}/{spotlightSeriesList.length}
                </span>
                {featuredSpotlight.ageRating && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${
                      isLight
                        ? 'bg-white text-black border-black'
                        : 'bg-black/70 backdrop-blur-sm text-white border-white/25'
                    }`}
                  >
                    {featuredSpotlight.ageRating}
                  </span>
                )}
                {featuredSpotlight.isExclusive && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border flex items-center gap-1 ${
                      isLight
                        ? 'bg-white text-black border-black'
                        : 'bg-black/70 text-white border-white/25'
                    }`}
                  >
                    <Crown className="w-2.5 h-2.5" />
                    <span>VIP</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Prev / Next Spotlight Controls */}
                {spotlightSeriesList.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevSpotlight}
                      className={`p-2 rounded-xl border transition-all active:scale-90 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-zinc-100 text-black border-black'
                          : 'bg-black/60 hover:bg-white/15 text-white border-white/25 backdrop-blur-md'
                      }`}
                      title="Previous Spotlight"
                      aria-label="Previous Spotlight"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSpotlight}
                      className={`p-2 rounded-xl border transition-all active:scale-90 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-zinc-100 text-black border-black'
                          : 'bg-black/60 hover:bg-white/15 text-white border-white/25 backdrop-blur-md'
                      }`}
                      title="Next Spotlight"
                      aria-label="Next Spotlight"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Minimal Bookmark Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(featuredSpotlight.id);
                  }}
                  className={`p-2 rounded-xl transition-all active:scale-90 cursor-pointer border shrink-0 ${
                    bookmarks.includes(featuredSpotlight.id)
                      ? 'bg-white text-black border-white shadow-sm'
                      : isLight
                      ? 'bg-white text-black border-black hover:bg-zinc-100'
                      : 'bg-black/60 text-white border-white/25 hover:border-white/40 backdrop-blur-md'
                  }`}
                  title={bookmarks.includes(featuredSpotlight.id) ? 'Remove Bookmark' : 'Bookmark Series'}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Bottom Meta & Action Area (No overflow on mobile) */}
            <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 w-full mt-auto pt-6">
              <div className="max-w-lg space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                  <span>{featuredSpotlight.author}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold">{featuredSpotlight.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span className="capitalize">{featuredSpotlight.status}</span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight font-sans break-words">
                  {featuredSpotlight.title}
                </h1>

                <p className="text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-md font-medium">
                  {featuredSpotlight.synopsis}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {featuredSpotlight.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                        isLight
                          ? 'bg-white text-black border-black'
                          : 'bg-black/60 text-white border-white/25'
                      }`}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Minimal Dual Buttons with responsive wrap so nothing clips on mobile */}
              <div className="flex items-center gap-2 pt-1 sm:pt-0 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap max-w-full box-border">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const firstCh = getFirstChapter(featuredSpotlight.id);
                    if (firstCh) {
                      onReadChapter(featuredSpotlight.id, firstCh.id);
                    } else {
                      onSelectSeries(featuredSpotlight.id);
                    }
                  }}
                  className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs tracking-wider uppercase flex items-center gap-2 border border-white transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap max-w-full box-border"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Start Reading</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSeries(featuredSpotlight.id);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1 border transition-all duration-150 active:scale-95 cursor-pointer shrink-0 max-w-full box-border ${
                    isLight
                      ? 'bg-white text-black border-black hover:bg-zinc-100'
                      : 'bg-black/60 hover:bg-white/15 text-white border-white/25 backdrop-blur-md'
                  }`}
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MINIMAL GENRE FILTER                                                   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {genres.map(genre => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 active:scale-95 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-white text-black font-bold border-white shadow-xs'
                    : isLight
                    ? 'bg-white text-black border-black hover:bg-zinc-100 font-semibold'
                    : 'bg-black text-white border-white/25 hover:border-white/50 font-semibold'
                }`}
              >
                <span className="tracking-tight">{genre}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. TRENDING TITLES (Minimalist Ranked Carousel)                           */}
        {/* ========================================================================= */}
        <section className="space-y-3.5">
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-black' : 'border-white/15'}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest font-sans">
              Trending Titles
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Top Ranked</span>
          </div>

          <div className="flex items-start gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {trendingSeries.slice(0, 8).map((series, idx) => (
              <div
                key={series.id}
                onClick={() => onSelectSeries(series.id)}
                className={`w-36 sm:w-44 shrink-0 cursor-pointer p-2 rounded-2xl border transition-all duration-300 hover:-translate-y-1 space-y-2 group ${
                  isLight
                    ? 'bg-white border-black'
                    : 'bg-zinc-950 border-white/15 hover:border-white/35'
                }`}
              >
                {/* Poster Cover with Crisp Corner Border */}
                <div
                  className={`manga-poster-frame relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-300 ${
                    isLight
                      ? 'bg-white border-black'
                      : 'bg-zinc-950 border-white/15 group-hover:border-white/30'
                  }`}
                >
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                  />

                  {/* Top-Left Rank Pill (#1, #2, #3, ...) */}
                  <div className="absolute top-2 left-2 z-10">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight font-bold border ${
                        isLight
                          ? 'bg-white text-black border-black'
                          : idx === 0
                          ? 'bg-white text-black border-white font-black'
                          : 'bg-black/80 backdrop-blur-md text-white border-white/25'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Bottom-Right Rating Badge */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1 ${
                        isLight
                          ? 'bg-white text-black border-black'
                          : 'bg-black/80 backdrop-blur-md text-white border-white/25'
                      }`}
                    >
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{series.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Title & Author */}
                <div className="space-y-0.5 px-0.5">
                  <h3 className="text-xs sm:text-sm font-bold truncate">
                    {series.title}
                  </h3>
                  <p className="text-[11px] font-medium truncate">
                    {series.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. ALL MANGA (Minimal Catalog Grid with Distinct Layer Borders)           */}
        {/* ========================================================================= */}
        <section className="space-y-3.5 pt-2">
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-black' : 'border-white/15'}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest font-sans">
              All Manga
            </h2>
            <span className="text-[11px] font-mono font-semibold">
              {filteredCatalog.length} Titles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredCatalog.map(series => (
              <div
                key={series.id}
                onClick={() => onSelectSeries(series.id)}
                className={`cursor-pointer p-2.5 rounded-2xl border space-y-2 group transition-all duration-300 hover:-translate-y-1 ${
                  isLight
                    ? 'bg-white border-black'
                    : 'bg-zinc-950 border-white/15 hover:border-white/35'
                }`}
              >
                {/* Poster Cover with Crisp Corner Border */}
                <div
                  className={`manga-poster-frame relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-300 ${
                    isLight
                      ? 'bg-white border-black'
                      : 'bg-zinc-900 border-white/15 group-hover:border-white/30'
                  }`}
                >
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  />

                  {/* Top-Left VIP Badge (Minimal Plain White & Black) */}
                  {series.isExclusive && (
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono uppercase tracking-wider border flex items-center gap-1 ${
                          isLight
                            ? 'bg-white text-black border-black'
                            : 'bg-white text-black border-white'
                        }`}
                      >
                        <Crown className="w-2.5 h-2.5 fill-current" />
                        <span>VIP</span>
                      </span>
                    </div>
                  )}

                  {/* Bottom-Right Rating Badge */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono border flex items-center gap-1 ${
                        isLight
                          ? 'bg-white text-black border-black'
                          : 'bg-black/80 backdrop-blur-md text-white border-white/25'
                      }`}
                    >
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span className="font-bold">{series.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Title & Author */}
                <div className="space-y-0.5 px-0.5">
                  <h3 className="text-xs sm:text-sm font-bold truncate">
                    {series.title}
                  </h3>
                  <p className="text-[11px] font-medium truncate">
                    {series.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

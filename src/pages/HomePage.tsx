import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  Play,
  Bookmark,
  Crown,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const { bookmarks, toggleBookmark } = useAuth();

  const allSeries = useMemo(
    () => StorageService.getSeries().filter(s => s.moderationStatus === 'approved'),
    []
  );

  // 1. Featured Manga Spotlight (matching top card in screenshot: SILENT HEADS)
  const featuredSpotlight = useMemo(() => {
    const silentHeads = allSeries.find(s => s.slug === 'silent-heads' || s.id === 'series_silent_heads');
    return silentHeads || allSeries[0];
  }, [allSeries]);

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
    <div className="min-h-screen bg-black text-white pb-28 pt-2 select-none w-full max-w-full overflow-x-hidden box-border">
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 space-y-7 sm:space-y-9 box-border">

        {/* ========================================================================= */}
        {/* 1. MINIMAL EDITORIAL SPOTLIGHT (Hero Card)                                */}
        {/* ========================================================================= */}
        {featuredSpotlight && (
          <div
            onClick={() => onSelectSeries(featuredSpotlight.id)}
            className="hero-card group relative w-full max-w-full box-border min-h-[460px] sm:min-h-[500px] lg:h-[560px] rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.08] cursor-pointer shadow-xl transition-all duration-300 hover:border-white/20 flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Ambient Background Gradient Glow */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110 pointer-events-none transition-opacity duration-700 group-hover:opacity-30"
              style={{ backgroundImage: `url(${featuredSpotlight.coverUrl || featuredSpotlight.bannerUrl})` }}
            />

            {/* Main Cover Artwork with Gentle Zoom */}
            <img
              src={featuredSpotlight.coverUrl || featuredSpotlight.bannerUrl}
              alt={featuredSpotlight.title}
              className="absolute inset-0 w-full h-full object-cover sm:object-contain sm:object-right-top transition-transform duration-700 ease-out group-hover:scale-[1.02] z-0 opacity-80 sm:opacity-95"
            />

            {/* Seamless Vignette Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30 sm:bg-gradient-to-r sm:from-black sm:via-black/80 sm:to-transparent z-10 pointer-events-none" />

            {/* Top Bar: Minimal Spotlight Pill + Quick Bookmark */}
            <div className="relative z-20 flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-widest uppercase bg-white/10 backdrop-blur-md text-zinc-300 border border-white/10">
                  Spotlight
                </span>
                {featuredSpotlight.ageRating && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide bg-zinc-900/80 backdrop-blur-sm text-zinc-400 border border-zinc-800">
                    {featuredSpotlight.ageRating}
                  </span>
                )}
                {featuredSpotlight.isExclusive && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-white/10 text-white border border-white/20 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    <span>VIP</span>
                  </span>
                )}
              </div>

              {/* Minimal Bookmark Action */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(featuredSpotlight.id);
                }}
                className={`p-2 rounded-xl backdrop-blur-md transition-all active:scale-90 cursor-pointer border shrink-0 ${
                  bookmarks.includes(featuredSpotlight.id)
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-black/40 text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
                }`}
                title={bookmarks.includes(featuredSpotlight.id) ? 'Remove Bookmark' : 'Bookmark Series'}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Bottom Meta & Action Area (No overflow on mobile) */}
            <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 w-full mt-auto pt-6">
              <div className="max-w-lg space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium flex-wrap">
                  <span className="text-zinc-200 font-semibold">{featuredSpotlight.author}</span>
                  <span className="text-zinc-600">•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white text-white" />
                    <span className="text-zinc-200 font-semibold">{featuredSpotlight.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 capitalize">{featuredSpotlight.status}</span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-white font-sans break-words">
                  {featuredSpotlight.title}
                </h1>

                <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed max-w-md">
                  {featuredSpotlight.synopsis}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {featuredSpotlight.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-white/[0.06] text-zinc-300 border border-white/[0.06]"
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
                  className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap max-w-full box-border"
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
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-1 backdrop-blur-md border border-white/10 transition-all duration-150 active:scale-95 cursor-pointer shrink-0 max-w-full box-border"
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
                    ? 'bg-white text-black font-semibold border-white shadow-xs'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06]'
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
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300 font-sans">
              Trending Titles
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Top Ranked</span>
          </div>

          <div className="flex items-start gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {trendingSeries.slice(0, 8).map((series, idx) => (
              <div
                key={series.id}
                onClick={() => onSelectSeries(series.id)}
                className="w-32 sm:w-40 shrink-0 cursor-pointer space-y-2 group transition-transform duration-300 hover:-translate-y-1"
              >
                {/* Poster Cover */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 border border-white/[0.06] group-hover:border-white/20 transition-all duration-300 shadow-sm group-hover:shadow-xl">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                  />

                  {/* Top-Left Rank Pill (#1, #2, #3, ...) */}
                  <div className="absolute top-2 left-2 z-10">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight font-bold shadow-xs ${
                        idx === 0
                          ? 'bg-white text-black font-black'
                          : 'bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Bottom-Right Rating Badge */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium font-mono bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10 flex items-center gap-1 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                      <span>{series.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Title & Author */}
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {series.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. ALL MANGA (Minimal Catalog Grid)                                       */}
        {/* ========================================================================= */}
        <section className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300 font-sans">
              All Manga
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              {filteredCatalog.length} Titles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredCatalog.map(series => (
              <div
                key={series.id}
                onClick={() => onSelectSeries(series.id)}
                className="cursor-pointer space-y-2 group transition-transform duration-300 hover:-translate-y-1"
              >
                {/* Poster Cover */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] group-hover:border-white/20 shadow-sm group-hover:shadow-xl transition-all duration-300">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  />

                  {/* Top-Left VIP Badge (Minimal Plain White & Black) */}
                  {series.isExclusive && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-white text-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 text-black fill-black" />
                        <span>VIP</span>
                      </span>
                    </div>
                  )}

                  {/* Bottom-Right Rating Badge (clean white) */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                      <span className="text-white font-bold">{series.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Title & Author */}
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-zinc-300 transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
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

import React, { useState, useMemo } from 'react';
import { Search, Star, BookOpen, Crown, ChevronRight, Heart, Eye, Lock } from 'lucide-react';
import { StorageService } from '../services/storage';
import { MangaSeries, MangaGenre } from '../types/manga';
import { useTheme } from '../context/ThemeContext';

interface BrowsePageProps {
  onSelectSeries: (seriesId: string) => void;
  onOpenVIPModal: () => void;
  onNavigate?: (view: string, params?: Record<string, string>) => void;
  initialSortBy?: 'popularity' | 'rating' | 'latest';
  isNewSeriesView?: boolean;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  onSelectSeries,
  onOpenVIPModal,
  onNavigate,
  initialSortBy,
  isNewSeriesView,
}) => {
  const { theme } = useTheme();
  const allSeries = useMemo(() => StorageService.getSeries().filter(s => s.moderationStatus === 'approved'), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [vipOnly, setVipOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'latest'>(initialSortBy || (isNewSeriesView ? 'latest' : 'popularity'));

  const genres = [
    'All',
    'Mystery',
    'Dark Comedy',
    'Sci-Fi',
    'Horror',
    'Adventure',
    'Slice of Life',
    'Dark Fantasy',
    'Thriller',
    'Supernatural',
    'Action',
    'Adult',
  ];

  const filtered = useMemo(() => {
    return allSeries
      .filter(s => {
        const matchesQuery =
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesGenre = selectedGenre === 'All' || s.genres.includes(selectedGenre as MangaGenre);
        const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
        const matchesVIP = !vipOnly || s.isExclusive;

        return matchesQuery && matchesGenre && matchesStatus && matchesVIP;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return b.totalReads - a.totalReads;
      });
  }, [allSeries, searchQuery, selectedGenre, selectedStatus, vipOnly, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 select-none">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-zinc-200 dark:border-zinc-800">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold font-serif tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-zinc-900'
            }`}
          >
            {isNewSeriesView ? 'New Series' : 'Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            {isNewSeriesView
              ? 'Newly serialized indie manga and weekly drops'
              : 'Original manga, webtoons, and graphic novels'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search titles, authors, genres..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none border ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-500'
                : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 shadow-xs'
            }`}
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-4">
        {/* Genre Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-zinc-400 uppercase tracking-wider font-semibold font-mono text-[10px]">
              Status:
            </span>
            {(['all', 'ongoing', 'completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg uppercase font-mono cursor-pointer transition-all ${
                  selectedStatus === st
                    ? 'bg-zinc-800 text-white font-bold'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-950 font-medium'
                }`}
              >
                {st}
              </button>
            ))}

            <span className="text-zinc-400 mx-1">·</span>

            <button
              onClick={() => setVipOnly(!vipOnly)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                vipOnly
                  ? 'bg-white text-zinc-950 border-white font-mono shadow-xs'
                  : theme === 'dark'
                  ? 'border-zinc-800 text-zinc-400 hover:text-white bg-zinc-900/60'
                  : 'border-zinc-300 text-zinc-600 hover:text-zinc-950 bg-zinc-100'
              }`}
            >
              <Lock className="w-3 h-3 text-current" />
              <span>Exclusive</span>
            </button>
          </div>

          {/* Sort By */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-zinc-400 uppercase tracking-wider font-semibold font-mono text-[10px]">
              Sort By:
            </span>
            {(
              [
                { id: 'popularity', label: 'Popularity' },
                { id: 'rating', label: 'Top Rated' },
                { id: 'latest', label: 'Newest' },
              ] as const
            ).map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sortBy === s.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {filtered.length === 0 ? (
        <div
          className={`py-20 text-center rounded-2xl border space-y-3 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <BookOpen className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3
            className={`text-base font-bold ${
              theme === 'dark' ? 'text-white' : 'text-zinc-900'
            }`}
          >
            No manga found
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search query, genre selection, or active filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
              setSelectedStatus('all');
              setVipOnly(false);
            }}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map(series => (
            <div
              key={series.id}
              onClick={() => onSelectSeries(series.id)}
              className="group p-2.5 rounded-2xl border border-white/[0.06] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-2.5 bg-zinc-950/40"
            >
              <div className="space-y-2">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.04]">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {series.isExclusive && (
                    <span className="absolute top-2 right-2 bg-zinc-950 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-700 font-mono">
                      Exclusive
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3
                    className={`text-sm font-bold truncate group-hover:text-zinc-300 transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {series.title}
                  </h3>

                  {/* Clickable Author Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.('creator-profile', { id: series.creatorId, author: series.author });
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white hover:underline font-mono truncate text-left block w-full cursor-pointer"
                    title={`View ${series.author}'s Creator Profile`}
                  >
                    by {series.author}
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <span>{series.genres[0]}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-zinc-200 font-semibold">
                      <Star className="w-3 h-3 fill-current text-white" />
                      {series.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Views and Likes footer */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5" title="Total Views">
                    <Eye className="w-3 h-3 text-zinc-400" />
                    <span>{(series.totalViews ?? 0).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-zinc-400" title="Likes">
                    <Heart className="w-3 h-3" />
                    <span>{(series.likesCount ?? 0).toLocaleString()}</span>
                  </span>
                </div>
                <span className="text-zinc-300 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>View</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

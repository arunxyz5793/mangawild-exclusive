import React, { useState, useMemo } from 'react';
import { Search, X, Star, ChevronRight } from 'lucide-react';
import { StorageService } from '../services/storage';
import { MangaGenre } from '../types/manga';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSeries: (id: string) => void;
}

const genres: (MangaGenre | 'All')[] = [
  'All',
  'Mystery',
  'Dark Comedy',
  'Sci-Fi',
  'Horror',
  'Adventure',
  'Slice of Life',
  'Dark Fantasy',
  'Thriller',
  'Adult',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSeries,
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<MangaGenre | 'All'>('All');

  const allSeries = useMemo(() => StorageService.getSeries(), []);

  const filteredSeries = useMemo(() => {
    return allSeries.filter(s => {
      const matchesQuery =
        !query.trim() ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.author.toLowerCase().includes(query.toLowerCase()) ||
        s.synopsis.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

      const matchesGenre = selectedGenre === 'All' || s.genres.includes(selectedGenre as any);
      return matchesQuery && matchesGenre;
    });
  }, [allSeries, query, selectedGenre]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#101014] text-[#fafafa] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-5 h-5 text-stone-300 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search manga by title, creator, genre, keywords..."
            className="w-full bg-transparent text-white placeholder-stone-500 text-base focus:outline-none"
          >
          </input>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded bg-white/5"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Genre Tags Filter */}
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                selectedGenre === g
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {filteredSeries.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              No manga found matching &ldquo;{query}&rdquo;. Try another genre or search term.
            </div>
          ) : (
            filteredSeries.map(series => (
              <div
                key={series.id}
                onClick={() => {
                  onSelectSeries(series.id);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-12 h-16 object-cover rounded-md bg-stone-900 border border-white/10 shadow"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-stone-300 transition-colors">
                        {series.title}
                      </h4>
                      {series.isExclusive && (
                        <span className="text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                          Exclusive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                      <span>{series.author}</span>
                      <span>·</span>
                      <span className="text-stone-300">{series.genres.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1 font-mono">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {series.rating}
                      </span>
                      <span>·</span>
                      <span>{(series.totalReads / 1000).toFixed(0)}K reads</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white transition-colors" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

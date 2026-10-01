import React, { useState } from 'react';
import { Bookmark, Clock, Star, ArrowRight, UserPlus, MessageSquare, ExternalLink, Crown, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { MangaSeries } from '../types/manga';

interface LibraryPageProps {
  onSelectSeries: (id: string) => void;
  onReadChapter: (seriesId: string, chapterId: string) => void;
  onNavigate?: (view: string, params?: Record<string, string>) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onSelectSeries,
  onReadChapter,
  onNavigate,
}) => {
  const { user, isVIP, bookmarks, toggleBookmark, followedCreators, toggleFollowCreator } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks' | 'creators' | 'reviews'>('history');

  const allSeries = StorageService.getSeries();
  const allCreators = StorageService.getCreators();

  const readingHistory = StorageService.getReadingHistory(user.id);
  const bookmarkedSeries = allSeries.filter(s => bookmarks.includes(s.id));
  const followedCreatorsList = allCreators.filter(c => followedCreators.includes(c.id));
  const userReviews = StorageService.getReviews().filter(r => r.userId === user.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header with Reader Profile Card */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl || '/avatars/vip.svg'}
            alt={user.username}
            className="w-16 h-16 rounded-2xl object-cover bg-zinc-800 border-2 border-zinc-700 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight font-mono">
                @{user.username || 'reader'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {readingHistory.length} Series Read • {bookmarks.length} Bookmarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {isVIP ? (
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-xs font-mono flex items-center gap-2 shadow-sm">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>{user.subscription?.planId === 'yearly' ? '★ Annual VIP Pass Active' : '★ Monthly VIP Pass Active'}</span>
            </div>
          ) : (
            <button
              onClick={() => onNavigate && onNavigate('membership')}
              className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span>Upgrade to VIP Pass (From ₹199)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Reading History ({readingHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bookmarks'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks ({bookmarkedSeries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'creators'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Following ({followedCreatorsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>My Reviews ({userReviews.length})</span>
        </button>
      </div>

      {/* Content 1: Reading History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {readingHistory.length === 0 ? (
            <div className="py-16 text-center text-stone-500 text-sm">
              You haven&apos;t started reading any manga yet. Explore the catalog to begin!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingHistory.map(item => {
                const series = allSeries.find(s => s.id === item.seriesId);
                if (!series) return null;
                return (
                  <div
                    key={item.seriesId}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 hover:border-white/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={series.coverUrl}
                        alt={series.title}
                        className="w-14 h-20 object-cover rounded-lg bg-stone-900 border border-white/10 shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-bold text-white">{series.title}</h4>
                        <p className="text-xs text-stone-300 font-semibold mt-0.5 font-mono">
                          Chapter {item.chapterNumber} (Panel {item.panelIndex}/{item.totalPanels})
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Last read {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onReadChapter(series.id, item.chapterId)}
                      className="px-4 py-2 bg-white hover:bg-stone-200 text-black text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content 2: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkedSeries.length === 0 ? (
            <div className="py-16 text-center text-stone-500 text-sm">
              No bookmarked manga yet. Click &ldquo;Add to Library&rdquo; on any manga series to save it here!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {bookmarkedSeries.map((series: MangaSeries) => (
                <div
                  key={series.id}
                  onClick={() => onSelectSeries(series.id)}
                  className="group cursor-pointer space-y-2 select-none"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-900 border border-white/10 group-hover:border-white/40 transition-all">
                    <img src={series.coverUrl} alt={series.title} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(series.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                      title="Remove Bookmark"
                    >
                      <Bookmark className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-stone-300 truncate">
                      {series.title}
                    </h4>
                    <p className="text-xs text-stone-400 flex items-center gap-1 font-mono">
                      <span>{series.genres[0]}</span>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.('creator-profile', { id: series.creatorId, author: series.author });
                        }}
                        className="hover:text-purple-400 hover:underline cursor-pointer truncate"
                        title={`View ${series.author}'s Creator Profile`}
                      >
                        by {series.author}
                      </button>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content 3: Followed Creators */}
      {activeTab === 'creators' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {followedCreatorsList.length === 0 ? (
            <div className="col-span-full py-16 text-center text-stone-500 text-sm">
              You aren&apos;t following any creators yet. Support indie creators from the homepage or series pages!
            </div>
          ) : (
            followedCreatorsList.map(cr => (
              <div
                key={cr.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4"
              >
                <div
                  onClick={() => onNavigate?.('creator-profile', { id: cr.id })}
                  className="flex items-center gap-3 cursor-pointer group"
                  title={`View ${cr.penName}'s Creator Profile`}
                >
                  <img src={cr.avatarUrl} alt={cr.penName} className="w-12 h-12 rounded-full object-cover border border-white/15 group-hover:scale-105 transition-transform" />
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{cr.penName}</h4>
                    <p className="text-xs text-stone-400">{cr.handle}</p>
                    <p className="text-[11px] text-stone-500 font-mono">{cr.followersCount} followers</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollowCreator(cr.id)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Unfollow
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content 4: My Reviews (Linked to user profile) */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {userReviews.length === 0 ? (
            <div className="py-16 text-center text-stone-500 text-sm space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-stone-600" />
              <p>You haven&apos;t written any reviews yet.</p>
              <p className="text-xs text-stone-600">
                Visit any manga series page to rate it and share your thoughts with the community!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userReviews.map(rev => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-stone-300 font-bold uppercase tracking-wider block font-mono">
                        {rev.seriesTitle}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white font-mono">
                          {rev.rating}/5
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        rev.status === 'approved'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : rev.status === 'hidden'
                          ? 'bg-stone-800 text-stone-300 border border-white/10'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-100">{rev.reviewTitle}</h4>
                    <p className="text-xs text-stone-300 mt-1 line-clamp-3 leading-relaxed">
                      {rev.reviewText}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-stone-400">
                    <span className="text-[11px] text-stone-500">
                      Posted {new Date(rev.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => onSelectSeries(rev.seriesId)}
                      className="text-xs text-white hover:underline font-bold flex items-center gap-1"
                    >
                      <span>View on Series Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

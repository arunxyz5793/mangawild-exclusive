import React, { useState, useEffect } from 'react';
import { Bookmark, Clock, Star, ArrowRight, UserPlus, MessageSquare, ExternalLink, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks' | 'creators' | 'reviews'>('history');

  const allSeries = StorageService.getSeries();
  const allCreators = StorageService.getCreators();

  const [readingHistory, setReadingHistory] = useState(() => StorageService.getReadingHistory(user.id));

  // Sync reading history on mount
  useEffect(() => {
    setReadingHistory(StorageService.getReadingHistory(user.id));
  }, [user.id]);

  const bookmarkedSeries = allSeries.filter(s => bookmarks.includes(s.id));
  const followedCreatorsList = allCreators.filter(c => {
    if (!followedCreators.includes(c.id)) return false;
    const hasUploadedManga = allSeries.some(
      s =>
        s.creatorId === c.id ||
        s.creatorId === c.userId ||
        s.author.trim().toLowerCase() === c.penName.trim().toLowerCase()
    );
    return hasUploadedManga;
  });
  const userReviews = StorageService.getReviews().filter(r => r.userId === user.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header with Reader Profile Card */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/20 text-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl || '/avatars/vip.svg'}
            alt={user.username}
            className={`w-16 h-16 rounded-2xl object-cover border ${
              isLight ? 'bg-white border-black' : 'bg-zinc-900 border-white/25'
            }`}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight">
                @{user.username || 'reader'}
              </h1>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                  isLight ? 'bg-white text-black border-black' : 'bg-zinc-900 text-white border-white/25'
                }`}
              >
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs font-mono mt-1">
              {readingHistory.length} Series Read • {bookmarks.length} Bookmarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          {isVIP ? (
            <div
              className={`px-3.5 py-2 rounded-xl border font-bold text-xs font-mono flex items-center gap-2 ${
                isLight ? 'bg-white text-black border-black' : 'bg-zinc-900 text-white border-white/25'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{user.subscription?.planId === 'yearly' ? 'Exclusive Annual' : 'Exclusive Active'}</span>
            </div>
          ) : (
            <button
              onClick={() => onNavigate && onNavigate('membership')}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all border border-white active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Exclusive</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex items-center gap-2 border-b pb-3 text-xs sm:text-sm font-semibold overflow-x-auto ${
          isLight ? 'border-black' : 'border-white/15'
        }`}
      >
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap border cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-black border-white font-bold shadow-xs'
              : isLight
              ? 'bg-white text-black border-black hover:bg-zinc-100'
              : 'bg-zinc-950 text-white border-white/15 hover:border-white/35'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Reading History ({readingHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap border cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-white text-black border-white font-bold shadow-xs'
              : isLight
              ? 'bg-white text-black border-black hover:bg-zinc-100'
              : 'bg-zinc-950 text-white border-white/15 hover:border-white/35'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks ({bookmarkedSeries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap border cursor-pointer ${
            activeTab === 'creators'
              ? 'bg-white text-black border-white font-bold shadow-xs'
              : isLight
              ? 'bg-white text-black border-black hover:bg-zinc-100'
              : 'bg-zinc-950 text-white border-white/15 hover:border-white/35'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Following ({followedCreatorsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap border cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-white text-black border-white font-bold shadow-xs'
              : isLight
              ? 'bg-white text-black border-black hover:bg-zinc-100'
              : 'bg-zinc-950 text-white border-white/15 hover:border-white/35'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>My Reviews ({userReviews.length})</span>
        </button>
      </div>

      {/* Content 1: Reading History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Continue Reading ({readingHistory.length})</span>
            </h3>
          </div>

          {readingHistory.length === 0 ? (
            <div
              className={`py-16 text-center text-sm rounded-2xl border ${
                isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/15 text-white'
              }`}
            >
              You haven&apos;t started reading any manga yet. Explore the catalog to begin!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingHistory.map(item => {
                const series = allSeries.find(s => s.id === item.seriesId);
                if (!series) return null;

                const total = Math.max(item.totalPanels || 1, 1);
                const currentPanel = Math.min(item.panelIndex || 1, total);
                const percent = Math.min(
                  100,
                  Math.max(1, item.progressPercent ?? Math.round((currentPanel / total) * 100))
                );
                const isFinished = Boolean(item.isCompleted || percent >= 95);

                return (
                  <div
                    key={item.seriesId}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all group ${
                      isLight
                        ? 'bg-white border-black text-black'
                        : 'bg-zinc-950 border-white/20 hover:border-white/40 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={series.coverUrl}
                        alt={series.title}
                        className={`manga-poster-frame w-16 h-24 object-cover rounded-xl border shrink-0 group-hover:scale-102 transition-transform ${
                          isLight ? 'bg-white border-black' : 'bg-zinc-900 border-white/20'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-bold truncate">
                            {series.title}
                          </h4>
                        </div>

                        <p className="text-xs font-semibold mt-0.5 font-mono truncate">
                          Ch. {item.chapterNumber} {item.chapterTitle ? `· ${item.chapterTitle}` : ''}
                        </p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {isFinished ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isLight
                                  ? 'bg-white text-black border-black'
                                  : 'bg-white text-black border-white light-invert-pill'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isLight
                                  ? 'bg-white text-black border-black'
                                  : 'bg-zinc-900 text-white border-white/25'
                              }`}
                            >
                              {percent}% Read
                            </span>
                          )}

                          <span className="text-[10px] font-mono">
                            Panel {currentPanel}/{total}
                          </span>
                        </div>

                        <p className="text-[10px] font-mono mt-1">
                          Last read {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Minimal Monochrome Chapter Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div
                        className={`w-full rounded-full h-1.5 overflow-hidden border relative ${
                          isLight ? 'bg-white border-black' : 'bg-zinc-900 border-white/20'
                        }`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: isLight ? '#000000' : '#ffffff',
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div
                      className={`flex items-center justify-between pt-2 border-t ${
                        isLight ? 'border-black' : 'border-white/15'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                        {isFinished ? '100% Complete' : `${percent}% Progress`}
                      </span>

                      <button
                        onClick={() => onReadChapter(series.id, item.chapterId)}
                        className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider rounded-xl border border-white flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer"
                      >
                        <span>{isFinished ? 'Re-read' : 'Resume'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
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
            <div
              className={`py-16 text-center text-sm rounded-2xl border ${
                isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/15 text-white'
              }`}
            >
              No bookmarked manga yet. Click &ldquo;Save&rdquo; on any manga series to add it here!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {bookmarkedSeries.map((series: MangaSeries) => (
                <div
                  key={series.id}
                  onClick={() => onSelectSeries(series.id)}
                  className={`group cursor-pointer p-2.5 rounded-2xl border space-y-2 select-none transition-all hover:-translate-y-1 ${
                    isLight ? 'bg-white border-black' : 'bg-zinc-950 border-white/15 hover:border-white/35'
                  }`}
                >
                  <div
                    className={`manga-poster-frame relative aspect-[3/4] rounded-xl overflow-hidden border transition-all ${
                      isLight ? 'bg-white border-black' : 'bg-zinc-900 border-white/15'
                    }`}
                  >
                    <img src={series.coverUrl} alt={series.title} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(series.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white text-black border border-black transition-colors cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                  <div className="px-0.5">
                    <h4 className="text-sm font-bold truncate">
                      {series.title}
                    </h4>
                    <p className="text-xs flex items-center gap-1 font-mono truncate">
                      <span>{series.genres[0]}</span>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.('creator-profile', { id: series.creatorId, author: series.author });
                        }}
                        className="hover:underline cursor-pointer truncate font-semibold"
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
            <div
              className={`col-span-full py-16 text-center text-sm rounded-2xl border ${
                isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/15 text-white'
              }`}
            >
              You aren&apos;t following any creators yet. Support indie creators from the homepage or series pages!
            </div>
          ) : (
            followedCreatorsList.map(cr => (
              <div
                key={cr.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/20 text-white'
                }`}
              >
                <div
                  onClick={() => onNavigate?.('creator-profile', { id: cr.id })}
                  className="flex items-center gap-3 cursor-pointer group"
                  title={`View ${cr.penName}'s Creator Profile`}
                >
                  <img
                    src={cr.avatarUrl}
                    alt={cr.penName}
                    className={`w-12 h-12 rounded-full object-cover border group-hover:scale-105 transition-transform ${
                      isLight ? 'border-black' : 'border-white/25'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-bold group-hover:underline">{cr.penName}</h4>
                    <p className="text-xs">{cr.handle}</p>
                    <p className="text-[11px] font-mono">{cr.followersCount} followers</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollowCreator(cr.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white border-black text-black hover:bg-zinc-100'
                      : 'bg-zinc-900 border-white/20 text-white hover:bg-zinc-800'
                  }`}
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
            <div
              className={`py-16 text-center text-sm space-y-2 rounded-2xl border ${
                isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/15 text-white'
              }`}
            >
              <MessageSquare className="w-8 h-8 mx-auto" />
              <p>You haven&apos;t written any reviews yet.</p>
              <p className="text-xs">
                Visit any manga series page to rate it and share your thoughts with the community!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userReviews.map(rev => (
                <div
                  key={rev.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isLight ? 'bg-white border-black text-black' : 'bg-zinc-950 border-white/20 text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider block font-mono">
                        {rev.seriesTitle}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-current' : 'opacity-30'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold font-mono">
                          {rev.rating}/5
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border ${
                        isLight ? 'bg-white text-black border-black' : 'bg-zinc-900 text-white border-white/25'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold">{rev.reviewTitle}</h4>
                    <p className="text-xs mt-1 line-clamp-3 leading-relaxed">
                      {rev.reviewText}
                    </p>
                  </div>

                  <div
                    className={`flex items-center justify-between pt-2 border-t text-xs ${
                      isLight ? 'border-black' : 'border-white/15'
                    }`}
                  >
                    <span className="text-[11px]">
                      Posted {new Date(rev.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => onSelectSeries(rev.seriesId)}
                      className="text-xs hover:underline font-bold flex items-center gap-1 cursor-pointer"
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

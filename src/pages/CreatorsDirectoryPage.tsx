import React, { useMemo } from 'react';
import { UserPlus, Check, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface CreatorsDirectoryPageProps {
  onNavigate: (view: string) => void;
  onSelectSeries: (seriesId: string) => void;
}

export const CreatorsDirectoryPage: React.FC<CreatorsDirectoryPageProps> = ({
  onNavigate,
  onSelectSeries,
}) => {
  const { followedCreators, toggleFollowCreator } = useAuth();
  const allSeries = useMemo(() => StorageService.getSeries(), []);
  const creators = useMemo(() => {
    const allCreators = StorageService.getCreators();
    // Strictly show ONLY creators who have uploaded at least 1 manga series
    return allCreators.filter(creator => {
      const penClean = creator.penName.trim().toLowerCase();
      const count = allSeries.filter(
        s =>
          s.creatorId === creator.id ||
          s.creatorId === creator.userId ||
          s.author.trim().toLowerCase() === penClean
      ).length;
      return count > 0;
    });
  }, [allSeries]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-fade-in">
      {/* Banner */}
      <div className="bg-[#101014] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded font-mono">
            CREATOR NETWORK
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-sans mt-2 tracking-tight">
            Independent Creator Directory
          </h1>
          <p className="text-stone-400 text-sm max-w-xl mt-1">
            Meet the independent manga storytellers, illustrators, and serial creators publishing on MangaWild.
          </p>
        </div>

        <button
          onClick={() => onNavigate('creator')}
          className="px-5 py-3 bg-white hover:bg-stone-200 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Become a Creator</span>
        </button>
      </div>

      {/* Creators Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map(creator => {
          const isFollowing = followedCreators.includes(creator.id);
          const penClean = creator.penName.trim().toLowerCase();
          const creatorSeries = allSeries.filter(
            s =>
              s.creatorId === creator.id ||
              s.creatorId === creator.userId ||
              s.author.trim().toLowerCase() === penClean
          );

          return (
            <div
              key={creator.id}
              className="bg-[#101014] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/30 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={creator.avatarUrl}
                      alt={creator.penName}
                      className="w-14 h-14 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{creator.penName}</span>
                        {creator.verified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-white text-black text-[9px] font-black inline-flex items-center justify-center">
                            ✓
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-400 font-mono">{creator.handle}</p>
                      <p className="text-[11px] text-stone-500 font-mono">
                        {creator.followersCount} followers · {creatorSeries.length} published series
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollowCreator(creator.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      isFollowing
                        ? 'bg-white/10 text-stone-300'
                        : 'bg-white hover:bg-stone-200 text-black shadow-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">{creator.bio}</p>

                {/* Published Series Previews */}
                {creatorSeries.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                      Series by {creator.penName}:
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {creatorSeries.map(s => (
                        <div
                          key={s.id}
                          onClick={() => onSelectSeries(s.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition-all text-xs"
                        >
                          <img src={s.coverUrl} alt={s.title} className="w-6 h-8 object-cover rounded" />
                          <span className="text-white font-medium truncate max-w-[120px]">{s.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-[11px] text-stone-500 flex justify-between items-center border-t border-white/5 font-mono">
                <span>Joined {new Date(creator.joinedAt).toLocaleDateString()}</span>
                <span className="text-stone-300 font-medium">70% Royalty Split</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

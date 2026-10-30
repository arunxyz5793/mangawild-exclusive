import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Check,
  Sparkles,
  Share2,
  BookOpen,
  Eye,
  Heart,
  Star,
  ArrowLeft,
  Edit3,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  MessageCircle,
  X,
  Camera,
  CheckCircle2,
  Shield,
  Layers,
  Award,
  Coins,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CreatorTipJar } from '../components/CreatorTipJar';
import { CreatorProfile, MangaSeries, CreatorSocialLinks } from '../types/manga';

interface CreatorProfilePageProps {
  creatorId?: string;
  authorName?: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onSelectSeries: (seriesId: string) => void;
}

const PRESET_AVATARS = [
  'https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7462bc7a3d20.36721854_1000320735.jpg',
  'https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12639bb7eff1.25665941_1000305668.png',
  'https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23ae06c732d3.48371140_1000309056.png',
  'https://d1yei2z3i6k35z.cloudfront.net/17195590/6a17c073d7a2d4.64550190_1000306730.png',
  'https://d1yei2z3i6k35z.cloudfront.net/17195590/69f45d1311d958.61477609_1000300162.png',
  '/avatars/admin.svg',
];

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({
  creatorId,
  authorName,
  onNavigate,
  onSelectSeries,
}) => {
  const { user, followedCreators, toggleFollowCreator, toggleCreatorMode } = useAuth();
  const { theme } = useTheme();

  // Find creator
  const [creators, setCreators] = useState<CreatorProfile[]>(() => StorageService.getCreators());

  const creator = useMemo(() => {
    if (creatorId) {
      const found = creators.find(c => c.id === creatorId || c.userId === creatorId);
      if (found) return found;
    }
    if (authorName) {
      const found = StorageService.getCreatorByAuthorName(authorName);
      if (found) return found;
    }
    // If user is authenticated and viewing their own profile
    if (user && user.id !== 'guest_reader') {
      const myProfile = StorageService.getOrCreateCreatorProfile(user);
      if (myProfile) return myProfile;
    }
    // Fallback to first creator if none specified
    return creators[0];
  }, [creatorId, authorName, creators, user]);

  // All series by this creator
  const allSeries = useMemo(() => StorageService.getSeries(), []);
  const creatorSeries = useMemo(() => {
    if (!creator) return [];
    return allSeries.filter(
      s =>
        s.creatorId === creator.id ||
        s.creatorId === creator.userId ||
        s.author.toLowerCase() === creator.penName.toLowerCase() ||
        s.author.toLowerCase().includes(creator.penName.toLowerCase())
    );
  }, [allSeries, creator]);

  // Is current user the creator of this profile or admin?
  // Only creators or admins who own this profile can edit it! Pure readers can NEVER edit it.
  const isOwner = useMemo(() => {
    if (!creator || !user) return false;
    if (user.role !== 'creator' && user.role !== 'admin') return false;
    return (
      user.role === 'admin' ||
      user.creatorProfileId === creator.id ||
      user.id === creator.userId
    );
  }, [creator, user]);

  // Tab state for profile
  const [activeTab, setActiveTab] = useState<'works' | 'edit'>('works');

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPenName, setEditPenName] = useState(creator?.penName || '');
  const [editHandle, setEditHandle] = useState(creator?.handle || '');
  const [editBio, setEditBio] = useState(creator?.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(creator?.avatarUrl || '');
  const [editSocial, setEditSocial] = useState<CreatorSocialLinks>(creator?.socialLinks || {});
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenEdit = () => {
    if (!creator) return;
    setEditPenName(creator.penName);
    setEditHandle(creator.handle);
    setEditBio(creator.bio || '');
    setEditAvatarUrl(creator.avatarUrl);
    setEditSocial(creator.socialLinks || {});
    setIsEditModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatarUrl(reader.result);
        showToast('Profile photo loaded!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!creator) return;

    const formattedHandle = editHandle.trim().startsWith('@')
      ? editHandle.trim()
      : `@${editHandle.trim().replace(/^@+/, '')}`;

    const updates: Partial<CreatorProfile> = {
      penName: editPenName.trim() || creator.penName,
      handle: formattedHandle || creator.handle,
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl.trim() || creator.avatarUrl,
      socialLinks: {
        instagram: editSocial.instagram?.trim() || '',
        facebook: editSocial.facebook?.trim() || '',
        twitter: editSocial.twitter?.trim() || '',
        youtube: editSocial.youtube?.trim() || '',
        discord: editSocial.discord?.trim() || '',
        website: editSocial.website?.trim() || '',
      },
    };

    StorageService.updateCreatorProfile(creator.id, updates);

    // If current logged-in user is owner, also keep user profile in sync!
    if (user && (user.id === creator.userId || user.creatorProfileId === creator.id)) {
      StorageService.updateUser(user.id, {
        name: updates.penName,
        username: updates.handle?.replace('@', ''),
        avatarUrl: updates.avatarUrl,
      });
    }

    setCreators(StorageService.getCreators());
    setIsEditModalOpen(false);
    showToast('Creator profile updated successfully!');
  };

  const isFollowing = creator ? followedCreators.includes(creator.id) : false;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Profile link copied to clipboard!');
  };

  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          Creator Profile Not Found
        </h2>
        <p className="text-zinc-400">The manga creator you are looking for is not registered or unavailable.</p>
        <button
          onClick={() => onNavigate('creators')}
          className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          View Creator Directory
        </button>
      </div>
    );
  }

  const social = creator.socialLinks || {};

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#fafafa] text-[#09090b]'}`}>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-700 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              onNavigate('browse');
            }
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            theme === 'dark'
              ? 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800'
              : 'border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={handleOpenEdit}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white'
                : 'border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 shadow-xs'
            }`}
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Creator Clean Profile Card (Single focused profile photo, no banner clutter) */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 border transition-all ${
            theme === 'dark'
              ? 'bg-zinc-900/60 border-zinc-800 shadow-2xl'
              : 'bg-white border-zinc-200 shadow-lg'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
              <div className="relative shrink-0">
                <img
                  src={creator.avatarUrl}
                  alt={creator.penName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-2 ring-zinc-700 shadow-xl bg-zinc-900"
                />
                {creator.verified && (
                  <span
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md font-black text-xs"
                    title="Verified Creator"
                  >
                    ✓
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      theme === 'dark' ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {creator.penName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Mangaka
                  </span>
                </div>

                <p className="text-xs font-mono text-zinc-400">{creator.handle}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500 pt-1">
                  <span>
                    Followers: <strong className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>{creator.followersCount.toLocaleString()}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Published Works: <strong className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>{creatorSeries.length}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Total Reads: <strong className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>{creator.totalReads.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Tip Artist, Creator Edit/Switch Mode vs Reader Follow */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end max-w-full box-border">
              <button
                type="button"
                onClick={() => setIsTipModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer max-w-full box-border"
              >
                <Coins className="w-4 h-4 text-zinc-300" />
                <span>Tip Artist</span>
              </button>

              {isOwner ? (
                <>
                  <button
                    onClick={handleOpenEdit}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer max-w-full box-border"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      toggleCreatorMode();
                      showToast('Switched to Reader Mode');
                      onNavigate('home');
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition-all cursor-pointer max-w-full box-border"
                    title="Switch to Reader Mode"
                  >
                    Switch to Reader
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    toggleFollowCreator(creator.id);
                    setCreators(StorageService.getCreators());
                  }}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 max-w-full box-border ${
                    isFollowing
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                      : 'bg-white hover:bg-zinc-200 text-zinc-950'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow Creator</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

            {/* Creator Bio / Description */}
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/80 space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5">
                  About the Mangaka
                </h3>
                <p
                  className={`text-sm leading-relaxed max-w-3xl ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                  }`}
                >
                  {creator.bio || 'Independent manga artist serializing original stories on MangaWild.'}
                </p>
              </div>

              {/* SOCIAL MEDIA LINKS SECTION */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  Connect & Follow Socials
                </h4>
                <div className="flex flex-wrap items-center gap-2.5">
                  {social.instagram ? (
                    <a
                      href={social.instagram.startsWith('http') ? social.instagram : `https://instagram.com/${social.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Instagram className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : null}

                  {social.twitter ? (
                    <a
                      href={social.twitter.startsWith('http') ? social.twitter : `https://x.com/${social.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Twitter className="w-3.5 h-3.5 text-zinc-400" />
                      <span>X / Twitter</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : null}

                  {social.facebook ? (
                    <a
                      href={social.facebook.startsWith('http') ? social.facebook : `https://facebook.com/${social.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Facebook className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Facebook</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : null}

                  {social.youtube ? (
                    <a
                      href={social.youtube.startsWith('http') ? social.youtube : `https://youtube.com/${social.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Youtube className="w-3.5 h-3.5 text-zinc-400" />
                      <span>YouTube</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : null}

                  {social.discord ? (
                    <a
                      href={social.discord.startsWith('http') ? social.discord : `https://discord.gg/${social.discord}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Discord</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : null}

                  {social.website ? (
                    <a
                      href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Portfolio / Website</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : null}

                  {/* Empty Social state */}
                  {!social.instagram &&
                    !social.twitter &&
                    !social.facebook &&
                    !social.youtube &&
                    !social.discord &&
                    !social.website && (
                      <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                        <span>No public social media links added yet.</span>
                        {isOwner && (
                          <button
                            onClick={handleOpenEdit}
                            className="text-zinc-200 hover:text-zinc-300 underline font-semibold cursor-pointer"
                          >
                            + Add your social links
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Metrics Snapshot Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
              <div
                className={`p-3.5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Followers</span>
                <span
                  className={`text-lg font-black font-mono ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {creator.followersCount + (isFollowing ? 1 : 0)}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Published Works</span>
                <span
                  className={`text-lg font-black font-mono ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {creatorSeries.length} Series
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Total Readers</span>
                <span
                  className={`text-lg font-black font-mono ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {creator.totalReads.toLocaleString()}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Royalty Split</span>
                <span className="text-lg font-black font-mono text-zinc-200">
                  {creator.revenueSharePercent || 70}% Royalties
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Only if owner) */}
        {isOwner && (
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('works')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'works'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-zinc-400 hover:text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Published Works ({creatorSeries.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                handleOpenEdit();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-zinc-400 hover:text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile & Socials</span>
            </button>
          </div>
        )}

        {/* SECTION 1: INLINE EDIT PROFILE (When activeTab === 'edit') */}
        {isOwner && activeTab === 'edit' && (
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 animate-fade-in ${
              theme === 'dark' ? 'bg-[#121217] border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/20 text-zinc-200 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                    Creator Profile & Social Settings
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Customize your public pen name, bio, avatar, and social media handles.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('works')}
                className="text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
              >
                Back to Works →
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pen Name */}
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-400">
                    Author / Pen Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPenName}
                    onChange={e => setEditPenName(e.target.value)}
                    placeholder="e.g. Deep Mangaka"
                    className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-zinc-600 font-medium ${
                      theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>

                {/* Handle */}
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-zinc-400">
                    Username / Handle *
                  </label>
                  <input
                    type="text"
                    required
                    value={editHandle}
                    onChange={e => setEditHandle(e.target.value)}
                    placeholder="@deep_mangaka"
                    className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-zinc-600 ${
                      theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-400">
                  Description / Bio
                </label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell readers about yourself, your drawing style, inspirations, and upcoming chapter drops..."
                  className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:border-zinc-600 ${
                    theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              {/* Avatar URL & Presets */}
              <div className="space-y-2.5">
                <label className="font-bold uppercase tracking-wider text-zinc-400">
                  Profile Photo / Avatar
                </label>
                <div className="flex gap-4 items-center">
                  <img
                    src={editAvatarUrl || creator.avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-600/50 bg-zinc-900 shadow-md shrink-0"
                  />
                  <div className="flex-1 flex gap-2 items-center">
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={e => setEditAvatarUrl(e.target.value)}
                      placeholder="Enter photo URL or choose file..."
                      className={`flex-1 p-3 rounded-xl border text-xs focus:outline-none focus:border-zinc-600 font-mono ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                    <label className="px-3.5 py-3 rounded-xl bg-zinc-800/20 hover:bg-zinc-800/30 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-400 font-mono">Avatar Presets:</span>
                  <div className="flex gap-2">
                    {PRESET_AVATARS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatarUrl(p)}
                        className={`w-8 h-8 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                          editAvatarUrl === p ? 'border-zinc-600 scale-105 ring-2 ring-zinc-700' : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        <img src={p} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SOCIAL MEDIA SECTION */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-200" />
                  <span className={`font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Social Media Profiles & Links
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Add your social media links so your readers can follow your art and updates across platforms.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instagram */}
                  <div className="space-y-1.5 p-3 rounded-2xl border border-pink-500/20 bg-pink-500/5">
                    <label className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5" /> Instagram Link or @handle
                    </label>
                    <input
                      type="text"
                      value={editSocial.instagram || ''}
                      onChange={e => setEditSocial({ ...editSocial, instagram: e.target.value })}
                      placeholder="https://instagram.com/yourname or @yourname"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-pink-500 ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1.5 p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                    <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5" /> Facebook Page or Profile
                    </label>
                    <input
                      type="text"
                      value={editSocial.facebook || ''}
                      onChange={e => setEditSocial({ ...editSocial, facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Twitter / X */}
                  <div className="space-y-1.5 p-3 rounded-2xl border border-sky-500/20 bg-sky-500/5">
                    <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5" /> X / Twitter Link or @handle
                    </label>
                    <input
                      type="text"
                      value={editSocial.twitter || ''}
                      onChange={e => setEditSocial({ ...editSocial, twitter: e.target.value })}
                      placeholder="https://x.com/yourname or @yourname"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-sky-500 ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1.5 p-3 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5" /> YouTube Channel Link
                    </label>
                    <input
                      type="text"
                      value={editSocial.youtube || ''}
                      onChange={e => setEditSocial({ ...editSocial, youtube: e.target.value })}
                      placeholder="https://youtube.com/@yourchannel"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-red-500 ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Discord */}
                  <div className="space-y-1.5 p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                    <label className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> Discord Community / Username
                    </label>
                    <input
                      type="text"
                      value={editSocial.discord || ''}
                      onChange={e => setEditSocial({ ...editSocial, discord: e.target.value })}
                      placeholder="https://discord.gg/yourserver or username#0000"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Portfolio / Website */}
                  <div className="space-y-1.5 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Portfolio / Website URL
                    </label>
                    <input
                      type="text"
                      value={editSocial.website || ''}
                      onChange={e => setEditSocial({ ...editSocial, website: e.target.value })}
                      placeholder="https://yourwebsite.com or ArtStation"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('works')}
                  className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'border-zinc-300 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION 2: PUBLISHED WORKS (When activeTab === 'works') */}
        {(!isOwner || activeTab === 'works') && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-zinc-900'
                }`}
              >
                Published Works by {creator.penName}
              </h2>
              <p className="text-xs text-zinc-400">
                Official manga and webtoons written or illustrated by this creator.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500">
              {creatorSeries.length} Titles
            </span>
          </div>

          {creatorSeries.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border space-y-3 ${
                theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <BookOpen className="w-10 h-10 mx-auto text-zinc-500" />
              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                No published series listed yet.
              </p>
              <p className="text-xs text-zinc-400">
                New chapters and series by this artist will appear here as soon as they pass editorial review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatorSeries.map(series => (
                <div
                  key={series.id}
                  onClick={() => onSelectSeries(series.id)}
                  className={`group rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                    theme === 'dark'
                      ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-600 shadow-xl'
                      : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Cover Art with Aspect Ratio */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                      <img
                        src={series.coverUrl}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-mono">
                        <span className="flex items-center gap-1 font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                          <Star className="w-3.5 h-3.5 text-white fill-white" />
                          <span>{series.rating.toFixed(1)}</span>
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold">
                          {series.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta Body */}
                    <div className="p-4 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {series.genres.slice(0, 3).map(g => (
                          <span
                            key={g}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                              theme === 'dark'
                                ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      <h3
                        className={`text-base font-black tracking-tight line-clamp-1 group-hover:text-zinc-200 transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-zinc-900'
                        }`}
                      >
                        {series.title}
                      </h3>

                      <p
                        className={`text-xs line-clamp-2 leading-relaxed ${
                          theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                        }`}
                      >
                        {series.synopsis}
                      </p>
                    </div>
                  </div>

                  {/* Footer with Views & Likes */}
                  <div
                    className={`px-4 py-3 border-t flex items-center justify-between text-xs font-mono ${
                      theme === 'dark'
                        ? 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                        : 'border-zinc-100 bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{(series.totalViews ?? 0).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{(series.likesCount ?? 0).toLocaleString()}</span>
                      </span>
                    </div>

                    <span className="font-bold text-zinc-200 group-hover:underline">
                      Read Series →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

      {/* EDIT CREATOR PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#121217] border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-950'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-800/20 text-zinc-200 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black">Edit Creator Profile</h3>
                  <p className="text-xs text-zinc-400">Update your public author identity & social links.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              {/* Pen Name */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-400">
                  Pen Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editPenName}
                  onChange={e => setEditPenName(e.target.value)}
                  placeholder="e.g. Deep Mangaka"
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-zinc-600 ${
                    theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              {/* Handle */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-400">
                  Handle / Username *
                </label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={e => setEditHandle(e.target.value)}
                  placeholder="@deep_mangaka"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-zinc-600 ${
                    theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-zinc-400">
                  Bio / Artist Statement
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Share a short bio, art style, inspiration, or projects in the works..."
                  className={`w-full p-2.5 rounded-xl border text-xs leading-relaxed focus:outline-none focus:border-zinc-600 ${
                    theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              {/* Avatar URL & Presets */}
              <div className="space-y-2">
                <label className="font-bold uppercase tracking-wider text-zinc-400">
                  Avatar Photo URL
                </label>
                <div className="flex gap-3 items-center">
                  <img
                    src={editAvatarUrl || creator.avatarUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700 bg-zinc-900 shrink-0"
                  />
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={e => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className={`flex-1 p-2.5 rounded-xl border text-xs focus:outline-none focus:border-zinc-600 ${
                      theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-500 font-mono">Quick Presets:</span>
                  <div className="flex gap-1.5">
                    {PRESET_AVATARS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatarUrl(p)}
                        className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700 hover:border-white transition-all cursor-pointer"
                      >
                        <img src={p} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SOCIAL LINKS FORM */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-200" />
                  <span className="font-bold uppercase tracking-wider text-zinc-300">
                    Social Media & Portfolio Links
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Instagram */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-pink-400 flex items-center gap-1">
                      <Instagram className="w-3 h-3" /> Instagram URL or @handle
                    </label>
                    <input
                      type="text"
                      value={editSocial.instagram || ''}
                      onChange={e => setEditSocial({ ...editSocial, instagram: e.target.value })}
                      placeholder="https://instagram.com/yourname"
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Twitter / X */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                      <Twitter className="w-3 h-3" /> X / Twitter URL or @handle
                    </label>
                    <input
                      type="text"
                      value={editSocial.twitter || ''}
                      onChange={e => setEditSocial({ ...editSocial, twitter: e.target.value })}
                      placeholder="https://x.com/yourname"
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-blue-400 flex items-center gap-1">
                      <Facebook className="w-3 h-3" /> Facebook Page / Profile
                    </label>
                    <input
                      type="text"
                      value={editSocial.facebook || ''}
                      onChange={e => setEditSocial({ ...editSocial, facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                      <Youtube className="w-3 h-3" /> YouTube Channel
                    </label>
                    <input
                      type="text"
                      value={editSocial.youtube || ''}
                      onChange={e => setEditSocial({ ...editSocial, youtube: e.target.value })}
                      placeholder="https://youtube.com/@channel"
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Discord */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Discord Server / ID
                    </label>
                    <input
                      type="text"
                      value={editSocial.discord || ''}
                      onChange={e => setEditSocial({ ...editSocial, discord: e.target.value })}
                      placeholder="https://discord.gg/yourserver"
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  {/* Website / Portfolio */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Website / Portfolio
                    </label>
                    <input
                      type="text"
                      value={editSocial.website || ''}
                      onChange={e => setEditSocial({ ...editSocial, website: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                        theme === 'dark' ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tip Artist Modal (Direct Razorpay Flow) */}
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
              <h3 className="text-lg font-serif font-bold text-white">Support {creator.penName}</h3>
              <p className="text-xs text-zinc-400 font-mono">100% Direct Mangaka Support via Razorpay (UPI & Cards)</p>
            </div>

            <CreatorTipJar
              creatorId={creator.id}
              creatorName={creator.penName}
              directForm={true}
              onClose={() => setIsTipModalOpen(false)}
              onTipSent={() => {
                showToast(`Tip sent to ${creator.penName}! Thank you for your support.`);
                setIsTipModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

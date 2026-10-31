import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus,
  Check,
  Share2,
  BookOpen,
  Eye,
  Heart,
  Star,
  ArrowLeft,
  Edit3,
  Instagram,
  Facebook,
  Youtube,
  Globe,
  X,
  Camera,
  CheckCircle2,
  Coins,
  Plus,
  Trash2,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CreatorTipJar } from '../components/CreatorTipJar';
import { ShareModal } from '../components/ShareModal';
import { getAvatarUrl, readImageFileAsDataUrl } from '../utils/avatar';
import { CreatorProfile, CreatorSocialLinks } from '../types/manga';

interface CreatorProfilePageProps {
  creatorId?: string;
  authorName?: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onSelectSeries: (seriesId: string) => void;
}

type SocialPlatformKey = keyof CreatorSocialLinks;

interface SocialPlatformMeta {
  key: SocialPlatformKey;
  name: string;
  placeholder: string;
  formatUrl: (val: string) => string;
  renderIcon: (className?: string) => React.ReactNode;
}

const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  {
    key: 'instagram',
    name: 'Instagram',
    placeholder: 'https://instagram.com/username',
    formatUrl: (v) => (v.startsWith('http') ? v : `https://instagram.com/${v.replace(/^@/, '')}`),
    renderIcon: (cls = 'w-4 h-4') => <Instagram className={cls} />,
  },
  {
    key: 'facebook',
    name: 'Facebook',
    placeholder: 'https://facebook.com/username',
    formatUrl: (v) => (v.startsWith('http') ? v : `https://facebook.com/${v.replace(/^@/, '')}`),
    renderIcon: (cls = 'w-4 h-4') => <Facebook className={cls} />,
  },
  {
    key: 'discord',
    name: 'Discord',
    placeholder: 'https://discord.gg/invitecode',
    formatUrl: (v) => (v.startsWith('http') ? v : `https://discord.gg/${v}`),
    renderIcon: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    key: 'twitter',
    name: 'X (Twitter)',
    placeholder: 'https://x.com/username',
    formatUrl: (v) => (v.startsWith('http') ? v : `https://x.com/${v.replace(/^@/, '')}`),
    renderIcon: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'youtube',
    name: 'YouTube',
    placeholder: 'https://youtube.com/@channel',
    formatUrl: (v) => (v.startsWith('http') ? v : `https://youtube.com/${v}`),
    renderIcon: (cls = 'w-4 h-4') => <Youtube className={cls} />,
  },
  {
    key: 'website',
    name: 'Website',
    placeholder: 'https://yourportfolio.com',
    formatUrl: (v) => (v.startsWith('http') ? v : `https://${v}`),
    renderIcon: (cls = 'w-4 h-4') => <Globe className={cls} />,
  },
];

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({
  creatorId,
  authorName,
  onNavigate,
  onSelectSeries,
}) => {
  const { user, updateUser, followedCreators, toggleFollowCreator, toggleCreatorMode } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [creators, setCreators] = useState<CreatorProfile[]>(() => StorageService.getCreators());

  const creator = useMemo(() => {
    if (creatorId) {
      const found = creators.find((c) => c.id === creatorId || c.userId === creatorId);
      if (found) return found;
    }
    if (authorName) {
      const found = StorageService.getCreatorByAuthorName(authorName);
      if (found) return found;
    }
    if (user && user.id !== 'guest_reader') {
      const myProfile = creators.find(
        (c) => c.id === user.creatorProfileId || c.userId === user.id
      );
      if (myProfile) return myProfile;
    }
    return creators[0];
  }, [creatorId, authorName, creators, user]);

  const allSeries = useMemo(() => StorageService.getSeries(), [creators]);
  const creatorSeries = useMemo(() => {
    if (!creator) return [];
    const penClean = creator.penName.trim().toLowerCase();
    return allSeries.filter(
      (s) =>
        s.creatorId === creator.id ||
        s.creatorId === creator.userId ||
        s.author.trim().toLowerCase() === penClean
    );
  }, [allSeries, creator]);

  const isOwner = useMemo(() => {
    if (!creator || !user) return false;
    if (user.role !== 'creator' && user.role !== 'admin') return false;
    return user.creatorProfileId === creator.id || user.id === creator.userId || user.role === 'admin';
  }, [creator, user]);

  const [activeTab, setActiveTab] = useState<'works' | 'edit'>('works');

  // Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPenName, setEditPenName] = useState(creator?.penName || '');
  const [editHandle, setEditHandle] = useState(creator?.handle || '');
  const [editBio, setEditBio] = useState(creator?.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(creator?.avatarUrl || '');
  const [editSocial, setEditSocial] = useState<CreatorSocialLinks>(creator?.socialLinks || {});

  // Step-by-Step Social Media Popup Modal State
  const [isSocialPopupOpen, setIsSocialPopupOpen] = useState(false);
  const [activeSocialPlatform, setActiveSocialPlatform] = useState<SocialPlatformKey | null>(null);
  const [socialLinkDraft, setSocialLinkDraft] = useState('');

  // Tip & Share Modal States
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAnchorY, setTipAnchorY] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditModalOpen && !isSocialPopupOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isEditModalOpen, isSocialPopupOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenEdit = () => {
    if (!creator) return;
    setEditPenName(creator.penName);
    setEditHandle(creator.handle);
    setEditBio(creator.bio || '');
    setEditAvatarUrl(creator.avatarUrl || '');
    setEditSocial(creator.socialLinks || {});
    setIsEditModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 450, 0.85);
      setEditAvatarUrl(dataUrl);
      showToast('Profile photo selected from device!');
    } catch {
      showToast('Could not read image file.');
    }
    e.target.value = '';
  };

  const handleOpenSocialPlatformInput = (platformKey: SocialPlatformKey) => {
    setActiveSocialPlatform(platformKey);
    setSocialLinkDraft(editSocial[platformKey]?.trim() || '');
  };

  const handleConfirmSocialPlatformLink = () => {
    if (!activeSocialPlatform) return;
    const clean = socialLinkDraft.trim();
    setEditSocial((prev) => ({
      ...prev,
      [activeSocialPlatform]: clean,
    }));
    setActiveSocialPlatform(null);
    setSocialLinkDraft('');
  };

  const handleRemoveSocialPlatformLink = (platformKey: SocialPlatformKey) => {
    setEditSocial((prev) => ({
      ...prev,
      [platformKey]: '',
    }));
    if (activeSocialPlatform === platformKey) {
      setActiveSocialPlatform(null);
      setSocialLinkDraft('');
    }
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
      avatarUrl: editAvatarUrl.trim(),
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

    if (user && (user.id === creator.userId || user.creatorProfileId === creator.id)) {
      updateUser({
        name: updates.penName,
        username: updates.handle?.replace('@', ''),
        avatarUrl: updates.avatarUrl,
      });
    }

    setCreators(StorageService.getCreators());
    setIsEditModalOpen(false);
    setActiveTab('works');
    showToast('Profile updated!');
  };

  const isFollowing = creator ? followedCreators.includes(creator.id) : false;

  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Creator Profile Not Found</h2>
        <p className="text-xs opacity-70">The manga creator you are looking for is not registered or unavailable.</p>
        <button
          type="button"
          onClick={() => onNavigate('creators')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border ${
            isLight ? 'bg-black text-white border-black light-invert-pill' : 'bg-white text-black border-white'
          }`}
        >
          View Creator Directory
        </button>
      </div>
    );
  }

  const social = creator.socialLinks || {};
  const activePublicSocials = SOCIAL_PLATFORMS.filter(
    (p) => Boolean(social[p.key] && social[p.key]!.trim().length > 0)
  );
  const addedEditSocials = SOCIAL_PLATFORMS.filter(
    (p) => Boolean(editSocial[p.key] && editSocial[p.key]!.trim().length > 0)
  );

  const renderEditFormContent = () => (
    <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
      {/* Hidden Device File Input for Profile Photo */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Profile Photo (Device File Selection Only — No Preset Avatars or URL Inputs) */}
      <div className="space-y-2">
        <label className="font-bold uppercase tracking-wider opacity-75 block">
          Profile Photo
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={getAvatarUrl(editAvatarUrl)}
            alt="Avatar preview"
            className={`w-16 h-16 rounded-2xl object-cover border shrink-0 ${
              isLight ? 'border-black bg-white' : 'border-white/25 bg-zinc-900'
            }`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                isLight
                  ? 'bg-black text-white border-black light-invert-pill'
                  : 'bg-white text-black border-white hover:bg-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload from Device</span>
            </button>
            {editAvatarUrl && (
              <button
                type="button"
                onClick={() => setEditAvatarUrl('')}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  isLight
                    ? 'border-black/30 text-black hover:border-black'
                    : 'border-white/25 text-white hover:border-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pen Name */}
        <div className="space-y-1.5">
          <label className="font-bold uppercase tracking-wider opacity-75 block">
            Pen Name / Display Name *
          </label>
          <input
            type="text"
            required
            value={editPenName}
            onChange={(e) => setEditPenName(e.target.value)}
            placeholder="Enter your pen name"
            className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none box-border ${
              isLight
                ? 'bg-white border-black text-black'
                : 'bg-black border-white/25 text-white focus:border-white'
            }`}
          />
        </div>

        {/* Handle */}
        <div className="space-y-1.5">
          <label className="font-bold uppercase tracking-wider opacity-75 block">
            Handle / Username *
          </label>
          <input
            type="text"
            required
            value={editHandle}
            onChange={(e) => setEditHandle(e.target.value)}
            placeholder="@username"
            className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none box-border ${
              isLight
                ? 'bg-white border-black text-black'
                : 'bg-black border-white/25 text-white focus:border-white'
            }`}
          />
        </div>
      </div>

      {/* Bio (Empty by Default — No Dummy Bio Pre-filled) */}
      <div className="space-y-1.5">
        <label className="font-bold uppercase tracking-wider opacity-75 block">
          Bio / Artist Statement
        </label>
        <textarea
          rows={3}
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
          placeholder="Write your bio..."
          className={`w-full p-2.5 rounded-xl border text-xs leading-relaxed focus:outline-none box-border ${
            isLight
              ? 'bg-white border-black text-black'
              : 'bg-black border-white/25 text-white focus:border-white'
          }`}
        />
      </div>

      {/* Social Media Links — Minimal "+ Add" Button Opening Step-by-Step Popup */}
      <div className="pt-3 border-t border-current/15 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-bold uppercase tracking-wider block">
              Social Media Links
            </span>
            <p className="text-[11px] opacity-70">
              Add or update your social media profiles
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSocialPlatform(null);
              setSocialLinkDraft('');
              setIsSocialPopupOpen(true);
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isLight
                ? 'bg-black text-white border-black light-invert-pill'
                : 'bg-white text-black border-white hover:bg-zinc-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Show small icon pills for currently added platforms */}
        {addedEditSocials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {addedEditSocials.map((plat) => (
              <button
                key={plat.key}
                type="button"
                onClick={() => {
                  setIsSocialPopupOpen(true);
                  handleOpenSocialPlatformInput(plat.key);
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? 'border-black bg-white text-black hover:bg-black hover:text-white'
                    : 'border-white/25 bg-zinc-900 text-white hover:bg-white hover:text-black'
                }`}
                title={`Update ${plat.name}`}
              >
                {plat.renderIcon('w-4 h-4')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-current/15">
        <button
          type="button"
          onClick={() => {
            setIsEditModalOpen(false);
            setActiveTab('works');
          }}
          className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
            isLight ? 'border-black text-black' : 'border-white/25 text-white'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
            isLight
              ? 'bg-black text-white border-black light-invert-pill'
              : 'bg-white text-black border-white hover:bg-zinc-200'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden box-border ${
        isLight ? 'bg-white text-black' : 'bg-black text-white'
      }`}
    >
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 border px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            isLight ? 'bg-white text-black border-black' : 'bg-black text-white border-white/25'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between gap-2 box-border">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              onNavigate('browse');
            }
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            isLight
              ? 'border-black bg-white text-black hover:bg-black hover:text-white'
              : 'border-white/20 bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={handleOpenEdit}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-black text-white border-black light-invert-pill'
                  : 'bg-white text-black border-white hover:bg-zinc-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'border-black bg-white text-black hover:bg-black hover:text-white'
                : 'border-white/20 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 w-full box-border overflow-hidden">
        {/* Creator Clean Profile Card */}
        <div
          className={`relative rounded-3xl p-5 sm:p-8 border transition-all w-full max-w-full box-border overflow-hidden ${
            isLight
              ? 'bg-white border-black shadow-sm'
              : 'bg-zinc-950 border-white/20 shadow-2xl'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 min-w-0 max-w-full">
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(creator.avatarUrl)}
                  alt={creator.penName}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border shadow-xl ${
                    isLight ? 'border-black bg-white' : 'border-white/25 bg-zinc-900'
                  }`}
                />
                {creator.verified && (
                  <span
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-md font-black text-xs ${
                      isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
                    }`}
                    title="Verified Creator"
                  >
                    ✓
                  </span>
                )}
              </div>

              <div className="space-y-1.5 min-w-0 max-w-full">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight break-words">
                    {creator.penName}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isLight ? 'border-black text-black bg-white' : 'border-white/25 text-white bg-zinc-900'
                    }`}
                  >
                    Mangaka
                  </span>
                </div>

                <p className="text-xs font-mono opacity-75 truncate">{creator.handle}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono opacity-80 pt-1">
                  <span>
                    Followers: <strong>{creator.followersCount.toLocaleString()}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Works: <strong>{creatorSeries.length}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Reads: <strong>{creator.totalReads.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Tip Artist, Edit Profile, Follow */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-start sm:justify-end max-w-full box-border">
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTipAnchorY(rect.top + rect.height / 2);
                  setIsTipModalOpen(true);
                }}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer max-w-full box-border ${
                  isLight
                    ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-white/25'
                }`}
              >
                <Coins className="w-4 h-4 shrink-0" />
                <span>Tip Artist</span>
              </button>

              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer max-w-full box-border ${
                      isLight
                        ? 'bg-black text-white border-black light-invert-pill'
                        : 'bg-white hover:bg-zinc-200 text-black border-white'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleCreatorMode();
                      showToast('Switched to Reader Mode');
                      onNavigate('home');
                    }}
                    className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer max-w-full box-border ${
                      isLight
                        ? 'border-black bg-white text-black'
                        : 'border-white/25 bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    Switch to Reader
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    toggleFollowCreator(creator.id);
                    setCreators(StorageService.getCreators());
                  }}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 max-w-full box-border ${
                    isFollowing
                      ? isLight
                        ? 'bg-white text-black border-black'
                        : 'bg-zinc-900 text-white border-white/25'
                      : isLight
                      ? 'bg-black text-white border-black light-invert-pill'
                      : 'bg-white text-black border-white hover:bg-zinc-200'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 shrink-0" />
                      <span>Follow Creator</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Creator Bio & Icon-Only Social Links */}
          {(creator.bio?.trim() || activePublicSocials.length > 0 || isOwner) && (
            <div className="mt-6 pt-6 border-t border-current/15 space-y-4">
              {creator.bio?.trim() ? (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider opacity-70 font-bold mb-1.5">
                    About the Mangaka
                  </h3>
                  <p className="text-sm leading-relaxed max-w-3xl break-words">
                    {creator.bio}
                  </p>
                </div>
              ) : null}

              {/* SOCIAL MEDIA LINKS SECTION — Strictly Icon-Only (No Text Labels, No Arrow Icons) */}
              {(activePublicSocials.length > 0 || isOwner) && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-mono uppercase tracking-wider opacity-70 font-bold">
                    Connect &amp; Follow Socials
                  </h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activePublicSocials.map((plat) => {
                      const rawVal = social[plat.key]!.trim();
                      const href = plat.formatUrl(rawVal);
                      return (
                        <a
                          key={plat.key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={plat.name}
                          title={plat.name}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            isLight
                              ? 'bg-white border-black text-black hover:bg-black hover:text-white'
                              : 'bg-zinc-900 border-white/25 text-white hover:bg-white hover:text-black'
                          }`}
                        >
                          {plat.renderIcon('w-4 h-4')}
                        </a>
                      );
                    })}

                    {activePublicSocials.length === 0 && isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEdit();
                          setIsSocialPopupOpen(true);
                        }}
                        className="text-xs font-mono underline cursor-pointer opacity-80 hover:opacity-100"
                      >
                        + Add Social Links
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs (Only if owner) */}
        {isOwner && (
          <div className="flex items-center gap-2 border-b border-current/15 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('works')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === 'works'
                  ? isLight
                    ? 'bg-black text-white border-black light-invert-pill'
                    : 'bg-white text-black border-white'
                  : isLight
                  ? 'bg-white text-black border-black/25'
                  : 'bg-zinc-900 text-white border-white/20'
              }`}
            >
              Published Works ({creatorSeries.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                handleOpenEdit();
                setIsEditModalOpen(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeTab === 'edit'
                  ? isLight
                    ? 'bg-black text-white border-black light-invert-pill'
                    : 'bg-white text-black border-white'
                  : isLight
                  ? 'bg-white text-black border-black/25'
                  : 'bg-zinc-900 text-white border-white/20'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile &amp; Socials</span>
            </button>
          </div>
        )}

        {/* INLINE EDIT PROFILE TAB */}
        {isOwner && activeTab === 'edit' && (
          <div
            className={`p-5 sm:p-8 rounded-3xl border space-y-6 animate-fade-in w-full max-w-full box-border ${
              isLight ? 'bg-white border-black' : 'bg-zinc-950 border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-current/15">
              <div>
                <h3 className="text-base font-black">Creator Profile &amp; Social Settings</h3>
                <p className="text-xs opacity-70">
                  Update your pen name, bio, profile photo, and social media links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('works')}
                className="text-xs font-mono underline cursor-pointer"
              >
                Back to Works →
              </button>
            </div>
            {renderEditFormContent()}
          </div>
        )}

        {/* PUBLISHED WORKS MANGA GRID (Strictly Contained) */}
        {activeTab === 'works' && (
          <div className="space-y-5 w-full max-w-full box-border overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-current/15">
              <div>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border mb-1.5 ${
                    isLight ? 'border-black text-black bg-white' : 'border-white/25 text-white bg-zinc-900'
                  }`}
                >
                  Official Manga Catalog
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Published Works by {creator.penName}
                </h2>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-xl border self-start sm:self-auto ${
                  isLight ? 'border-black text-black bg-white' : 'border-white/25 text-white bg-zinc-900'
                }`}
              >
                {creatorSeries.length} Manga Series
              </span>
            </div>

            {creatorSeries.length === 0 ? (
              <div
                className={`p-12 text-center rounded-3xl border space-y-3 ${
                  isLight ? 'bg-white border-black' : 'bg-zinc-950 border-white/20'
                }`}
              >
                <BookOpen className="w-10 h-10 mx-auto opacity-60" />
                <p className="text-sm font-bold">No published series listed yet.</p>
                <p className="text-xs opacity-70">
                  New chapters and series by this artist will appear here as soon as they are published.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5 w-full max-w-full box-border">
                {creatorSeries.map((series) => (
                  <div
                    key={series.id}
                    onClick={() => onSelectSeries(series.id)}
                    className={`group rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 max-w-full box-border ${
                      isLight
                        ? 'bg-white border-black hover:shadow-md'
                        : 'bg-zinc-950 border-white/20 hover:border-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
                        <img
                          src={series.coverUrl}
                          alt={series.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-bold text-white uppercase truncate">
                            {series.status}
                          </span>
                          {series.isExclusive && (
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] font-black uppercase shrink-0">
                              Exclusive
                            </span>
                          )}
                        </div>

                        {/* Bottom Rating & Stats */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white font-semibold">
                          <span className="flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-md border border-white/15">
                            <Star className="w-3 h-3 text-white fill-white" />
                            <span>{series.rating.toFixed(1)}</span>
                          </span>
                          <span className="flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-md border border-white/15">
                            <Eye className="w-3 h-3 text-white" />
                            <span>{(series.totalViews ?? 0).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-3 space-y-1.5 min-w-0">
                        <div className="flex flex-wrap gap-1">
                          {series.genres.slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate ${
                                isLight
                                  ? 'bg-white text-black border-black/30'
                                  : 'bg-zinc-900 text-white border-white/20'
                              }`}
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        <h3 className="text-sm font-bold tracking-tight line-clamp-1 break-words">
                          {series.title}
                        </h3>

                        <p className="text-xs opacity-75 line-clamp-2 leading-relaxed break-words">
                          {series.synopsis}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-2.5 border-t flex items-center justify-between text-xs font-semibold ${
                        isLight ? 'border-black/20 bg-white' : 'border-white/15 bg-black'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{(series.likesCount ?? 0).toLocaleString()}</span>
                      </span>

                      <span className="font-bold group-hover:underline">Read →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT CREATOR PROFILE MODAL (Portaled to document.body) */}
      {isEditModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/75 backdrop-blur-xs animate-fade-in box-border"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xl rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto box-border ${
                isLight ? 'bg-white border-black text-black' : 'bg-black border-white/25 text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-current/15">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                      isLight ? 'border-black bg-white text-black' : 'border-white/25 bg-zinc-900 text-white'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Edit Creator Profile</h3>
                    <p className="text-xs opacity-70">Update your public author identity &amp; social links.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-xl border border-current/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderEditFormContent()}
            </div>
          </div>,
          document.body
        )}

      {/* STEP-BY-STEP ADD / UPDATE SOCIAL MEDIA LINKS POPUP MODAL */}
      {isSocialPopupOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/80 backdrop-blur-xs animate-fade-in box-border"
            onClick={() => {
              setIsSocialPopupOpen(false);
              setActiveSocialPlatform(null);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4 max-h-[88vh] overflow-y-auto box-border ${
                isLight ? 'bg-white border-black text-black' : 'bg-black border-white/25 text-white'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-current/15">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    {activeSocialPlatform
                      ? `${
                          editSocial[activeSocialPlatform]?.trim() ? 'Update' : 'Add'
                        } ${SOCIAL_PLATFORMS.find((p) => p.key === activeSocialPlatform)?.name}`
                      : 'Social Media Links'}
                  </h3>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    {activeSocialPlatform
                      ? 'Paste your profile link below'
                      : 'Select a platform to add or update your link'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeSocialPlatform) {
                      setActiveSocialPlatform(null);
                    } else {
                      setIsSocialPopupOpen(false);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-current/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Platform List View (Line-by-Line, No Numbers) */}
              {!activeSocialPlatform ? (
                <div className="space-y-2">
                  {SOCIAL_PLATFORMS.map((plat) => {
                    const isAlreadyAdded = Boolean(
                      editSocial[plat.key] && editSocial[plat.key]!.trim().length > 0
                    );
                    return (
                      <div
                        key={plat.key}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                          isLight
                            ? 'bg-white border-black/25'
                            : 'bg-zinc-950 border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                              isLight ? 'border-black bg-white text-black' : 'border-white/25 bg-black text-white'
                            }`}
                          >
                            {plat.renderIcon('w-4 h-4')}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">
                              {plat.name}
                            </span>
                            {isAlreadyAdded && (
                              <span className="text-[10px] font-mono opacity-65 block truncate max-w-[160px]">
                                {editSocial[plat.key]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAlreadyAdded ? (
                            <>
                              <span
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                                  isLight
                                    ? 'border-black/30 text-black bg-white'
                                    : 'border-white/25 text-white bg-zinc-900'
                                }`}
                              >
                                Added
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenSocialPlatformInput(plat.key)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                  isLight
                                    ? 'bg-black text-white border-black light-invert-pill'
                                    : 'bg-white text-black border-white hover:bg-zinc-200'
                                }`}
                              >
                                Update
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenSocialPlatformInput(plat.key)}
                              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                isLight
                                  ? 'bg-black text-white border-black light-invert-pill'
                                  : 'bg-white text-black border-white hover:bg-zinc-200'
                              }`}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsSocialPopupOpen(false)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        isLight
                          ? 'bg-black text-white border-black light-invert-pill'
                          : 'bg-white text-black border-white'
                      }`}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Single Platform Link Input View */
                (() => {
                  const plat = SOCIAL_PLATFORMS.find((p) => p.key === activeSocialPlatform)!;
                  const isUpdating = Boolean(
                    editSocial[plat.key] && editSocial[plat.key]!.trim().length > 0
                  );
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                            isLight ? 'border-black bg-white text-black' : 'border-white/25 bg-zinc-950 text-white'
                          }`}
                        >
                          {plat.renderIcon('w-5 h-5')}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{plat.name}</div>
                          <div className="text-[11px] opacity-70">
                            {isUpdating ? 'Replace your existing link below' : 'Enter your profile URL'}
                          </div>
                        </div>
                      </div>

                      <input
                        type="text"
                        autoFocus
                        value={socialLinkDraft}
                        onChange={(e) => setSocialLinkDraft(e.target.value)}
                        placeholder={plat.placeholder}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none box-border ${
                          isLight
                            ? 'bg-white border-black text-black'
                            : 'bg-zinc-950 border-white/25 text-white focus:border-white'
                        }`}
                      />

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSocialPlatform(null);
                              setSocialLinkDraft('');
                            }}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                              isLight ? 'border-black/30 text-black' : 'border-white/25 text-white'
                            }`}
                          >
                            Back
                          </button>
                          {isUpdating && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialPlatformLink(plat.key)}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                                isLight ? 'border-black/30 text-black' : 'border-white/25 text-white'
                              }`}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleConfirmSocialPlatformLink}
                          className={`px-5 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            isLight
                              ? 'bg-black text-white border-black light-invert-pill'
                              : 'bg-white text-black border-white hover:bg-zinc-200'
                          }`}
                        >
                          {isUpdating ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Tip Artist Modal (Portaled & Positioned Right Where Viewer Clicked) */}
      <CreatorTipJar
        creatorId={creator.id}
        creatorName={creator.penName}
        isModalOpen={isTipModalOpen}
        anchorY={tipAnchorY}
        onClose={() => setIsTipModalOpen(false)}
        onTipSent={() => {
          showToast(`Tip sent to ${creator.penName}! Thank you for your support.`);
          setIsTipModalOpen(false);
        }}
      />

      {/* Dynamic Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${creator.penName} (${creator.handle}) — MangaWild`}
        text={`Check out manga by ${creator.penName} on MangaWild!`}
      />
    </div>
  );
};

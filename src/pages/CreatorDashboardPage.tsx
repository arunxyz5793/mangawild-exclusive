import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  DollarSign,
  Layers,
  Sparkles,
  ChevronRight,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
  CreditCard,
  TrendingUp,
  BarChart3,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { MangaSeries, Chapter, ChapterPanel, MangaGenre, CreatorProfile } from '../types/manga';
import { generateChapterPanelSvg, generateMangaCoverSvg } from '../utils/mangaAssets';
import { CreatorAnalyticsCharts } from '../components/CreatorAnalyticsCharts';

interface CreatorDashboardPageProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onPreviewChapter: (seriesId: string, chapterId: string) => void;
}

const ALL_GENRES: MangaGenre[] = [
  'Action',
  'Dark Fantasy',
  'Supernatural',
  'Horror',
  'Mythology',
  'Comedy',
  'Romance',
  'Thriller',
  'Slice of Life',
  'Sci-Fi',
  'Mystery',
  'Adventure',
  'Drama',
];

interface NewPageItem {
  id: string;
  imageUrl: string;
  caption: string;
}

export const CreatorDashboardPage: React.FC<CreatorDashboardPageProps> = ({
  onNavigate,
  onPreviewChapter,
}) => {
  const { user, canAccessCreator, toggleCreatorMode, isAuthenticated, openAuthModal } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'series' | 'new_series' | 'new_chapter' | 'payouts'>('overview');

  // Creator profile bound to the current logged-in user
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>(() => {
    return StorageService.getOrCreateCreatorProfile(user);
  });

  const [seriesList, setSeriesList] = useState<MangaSeries[]>(() => {
    const profile = StorageService.getOrCreateCreatorProfile(user);
    const all = StorageService.getSeries();
    return all.filter(
      s => s.creatorId === profile.id ||
           s.creatorId === `creator_${user.id}` ||
           s.author.toLowerCase() === user.name.toLowerCase()
    );
  });

  const [selectedSeries, setSelectedSeries] = useState<MangaSeries | null>(() => {
    const profile = StorageService.getOrCreateCreatorProfile(user);
    const mySeries = StorageService.getSeries().filter(
      s => s.creatorId === profile.id ||
           s.creatorId === `creator_${user.id}` ||
           s.author.toLowerCase() === user.name.toLowerCase()
    );
    return mySeries[0] || null;
  });

  // State for Creating New Series
  const [newTitle, setNewTitle] = useState('');
  const [newTitleHindi, setNewTitleHindi] = useState('');
  const [newTitleJapanese, setNewTitleJapanese] = useState('');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newSynopsisHindi, setNewSynopsisHindi] = useState('');
  const [newHeroCoverUrl, setNewHeroCoverUrl] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newGenres, setNewGenres] = useState<MangaGenre[]>(['Action', 'Dark Fantasy']);
  const [newIsExclusive, setNewIsExclusive] = useState(false);
  const [newStatus, setNewStatus] = useState<'ongoing' | 'completed' | 'hiatus'>('ongoing');
  const [coverPresetColor, setCoverPresetColor] = useState<'ink' | 'blue' | 'gold' | 'emerald' | 'purple'>('ink');

  // State for Creating New Chapter with Page-by-Page Manga Scans
  const [chapterSeriesId, setChapterSeriesId] = useState<string>(selectedSeries?.id || '');
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterTitleHindi, setNewChapterTitleHindi] = useState('');
  const [newChapterIsVIP, setNewChapterIsVIP] = useState(false);

  // Dynamic Pages List (Page 1, Page 2, Page 3...)
  const [chapterPages, setChapterPages] = useState<NewPageItem[]>([
    {
      id: 'p1',
      imageUrl: generateChapterPanelSvg(1, 'New Manga Chapter', {
        action: 'Opening Hero Splash Spread',
        dialogue: 'Page 1: The awakening begins.',
        type: 'action',
        sfx: 'SHIIIN',
      }),
      caption: 'Page 1: Splash cover and opening scene',
    },
    {
      id: 'p2',
      imageUrl: generateChapterPanelSvg(2, 'New Manga Chapter', {
        action: 'Dynamic martial arts standoff',
        dialogue: 'Page 2: Who dares disturb the shrine?',
        type: 'dialogue',
      }),
      caption: 'Page 2: Clashing warriors & intense dialogue',
    },
    {
      id: 'p3',
      imageUrl: generateChapterPanelSvg(3, 'New Manga Chapter', {
        action: 'Mystic power surge & aura eruption',
        dialogue: 'Page 3: Witness the forbidden technique!',
        type: 'action',
        sfx: 'DOOOOM',
      }),
      caption: 'Page 3: Climax battle spread',
    },
  ]);

  // Live Chapter Preview Modal & active page index
  const [previewingChapter, setPreviewingChapter] = useState<Chapter | null>(null);
  const [previewPanelIndex, setPreviewPanelIndex] = useState<number>(0);

  // Payout Form State
  const [upiIdInput, setUpiIdInput] = useState(creatorProfile?.upiId || 'creator.manga@okaxis');
  const [bankHolderInput, setBankHolderInput] = useState(creatorProfile?.bankAccountHolder || creatorProfile?.penName || user.name);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const refreshCreatorData = () => {
    const cur = StorageService.getOrCreateCreatorProfile(user);
    setCreatorProfile(cur);

    const all = StorageService.getSeries();
    const mySeries = all.filter(
      s => s.creatorId === cur.id ||
           s.creatorId === `creator_${user.id}` ||
           s.author.toLowerCase() === user.name.toLowerCase()
    );
    setSeriesList(mySeries);
    if (mySeries.length > 0) {
      setSelectedSeries(prev => {
        if (!prev) return mySeries[0];
        return mySeries.find(s => s.id === prev.id) || mySeries[0];
      });
    } else {
      setSelectedSeries(null);
    }
  };

  useEffect(() => {
    refreshCreatorData();
  }, [user.id, user.name]);

  // Genre toggle
  const toggleGenre = (genre: MangaGenre) => {
    if (newGenres.includes(genre)) {
      if (newGenres.length > 1) {
        setNewGenres(newGenres.filter(g => g !== genre));
      }
    } else {
      setNewGenres([...newGenres, genre]);
    }
  };

  // Cover image file upload handler (converts file to data URL)
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setNewHeroCoverUrl(uploadEvent.target.result as string);
          showToast('Hero Cover Image loaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Create Series (Submitted for Admin Approval)
  const handleCreateSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a manga title.');
      return;
    }

    const effectiveCover =
      newHeroCoverUrl.trim() ||
      generateMangaCoverSvg(
        newTitle.toUpperCase(),
        'Original Manga',
        newGenres[0],
        undefined,
        coverPresetColor
      );

    const created = StorageService.createSeries({
      title: newTitle.trim(),
      synopsis: newSynopsis.trim() || 'An exciting new original manga series published on MangaWild.',
      coverUrl: effectiveCover,
      bannerUrl: newBannerUrl.trim() || effectiveCover,
      author: user.name,
      artist: user.name,
      creatorId: creatorProfile.id,
      genres: newGenres,
      status: newStatus,
      isExclusive: newIsExclusive,
    });

    refreshCreatorData();
    setSelectedSeries(created);
    setChapterSeriesId(created.id);
    setActiveTab('series');
    setNewTitle('');
    setNewTitleHindi('');
    setNewSynopsis('');
    setNewHeroCoverUrl('');
    showToast(`Manga "${created.title}" submitted for Admin Approval (Pending Review)!`);
  };

  // Page Management Functions
  const handleAddPage = () => {
    const newPageNum = chapterPages.length + 1;
    const newP: NewPageItem = {
      id: `p_${Date.now()}_${newPageNum}`,
      imageUrl: generateChapterPanelSvg(newPageNum, selectedSeries?.title || 'Manga Scene', {
        action: `Page ${newPageNum}: Narrative sequence`,
        dialogue: `Scene ${newPageNum}: The plot thickens.`,
        type: newPageNum % 2 === 0 ? 'action' : 'dialogue',
      }),
      caption: `Page ${newPageNum}: Scene notes`,
    };
    setChapterPages([...chapterPages, newP]);
    showToast(`Added Page ${newPageNum}`);
  };

  const handleRemovePage = (index: number) => {
    if (chapterPages.length <= 1) {
      showToast('A chapter must contain at least 1 page.');
      return;
    }
    setChapterPages(chapterPages.filter((_, i) => i !== index));
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= chapterPages.length) return;
    const copy = [...chapterPages];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setChapterPages(copy);
  };

  const handlePageFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const copy = [...chapterPages];
          copy[index].imageUrl = uploadEvent.target.result as string;
          setChapterPages(copy);
          showToast(`Image loaded for Page ${index + 1}!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Create Chapter (Submitted for Admin Approval)
  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSeriesId = chapterSeriesId || selectedSeries?.id;
    if (!targetSeriesId) {
      showToast('Please select a manga series first.');
      return;
    }
    if (!newChapterTitle.trim()) {
      showToast('Please enter a chapter title.');
      return;
    }
    if (chapterPages.length === 0) {
      showToast('Please add at least one page to the chapter.');
      return;
    }

    const panels: ChapterPanel[] = chapterPages.map((p, idx) => ({
      id: `pnl_${Date.now()}_${idx + 1}`,
      panelNumber: idx + 1,
      imageUrl: p.imageUrl,
      caption: p.caption || `Page ${idx + 1}`,
    }));

    const chapter = StorageService.createChapter({
      seriesId: targetSeriesId,
      chapterNumber: newChapterNumber,
      title: newChapterTitle.trim(),
      isExclusiveVIP: newChapterIsVIP,
      panels,
    });

    showToast(`Chapter ${chapter.chapterNumber} ("${chapter.title}") submitted for Admin Review!`);
    setNewChapterTitle('');
    setNewChapterTitleHindi('');
    setChapterPages([]);
    setNewChapterNumber(prev => prev + 1);
    refreshCreatorData();
    setActiveTab('series');
  };

  const handleSavePayoutDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorProfile) return;
    const creators = StorageService.getCreators();
    const idx = creators.findIndex(c => c.id === creatorProfile.id);
    if (idx >= 0) {
      creators[idx].upiId = upiIdInput.trim();
      creators[idx].bankAccountHolder = bankHolderInput.trim();
      StorageService.saveCreators(creators);
      setCreatorProfile(creators[idx]);
      showToast('Payout UPI & Bank information updated successfully!');
    }
  };

  const handleRequestPayout = () => {
    if ((creatorProfile?.monthlyEarningsInr || 0) < 500) {
      showToast('Minimum payout threshold is ₹500. Keep publishing to grow your readership!');
      return;
    }
    showToast(`Payout request of ₹${creatorProfile?.monthlyEarningsInr} submitted to Finance!`);
  };

  // If user role is free_user or subscriber, show role switch prompt
  if (!canAccessCreator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6 shadow-xl">
          <PenTool className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3 text-white">Become a MangaWild Creator</h1>
        <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
          Publish your original manga, reach passionate readers worldwide, and earn a 70% revenue share with weekly direct payouts.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated || user.id === 'guest_reader') {
                openAuthModal({
                  title: 'Creator Account Sign In',
                  subtitle: 'Sign in to access your MangaWild Creator Studio and publish your original stories.',
                  defaultRole: 'creator',
                  defaultMode: 'signup',
                  onSuccess: () => {
                    toggleCreatorMode();
                    const updatedProfile = StorageService.getOrCreateCreatorProfile(user);
                    setCreatorProfile(updatedProfile);
                  },
                });
              } else {
                toggleCreatorMode();
                const updatedProfile = StorageService.getOrCreateCreatorProfile(user);
                setCreatorProfile(updatedProfile);
              }
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <PenTool className="w-4 h-4 text-zinc-950" />
            <span>Switch to Creator Profile</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 font-semibold text-sm transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const chaptersForSelected = selectedSeries ? StorageService.getChapters(selectedSeries.id) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-zinc-900 border border-white text-white shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
              Creator Studio
            </span>
            {creatorProfile?.verified && (
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-300" /> Verified Mangaka
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            {creatorProfile?.penName || user.name}
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            {creatorProfile?.handle || `@${user.username}`} • 70% Creator Revenue Share
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('new_series')}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Manga</span>
          </button>

          <button
            onClick={() => setActiveTab('new_chapter')}
            className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Add Chapter Pages</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-800/60 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Overview & Earnings
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-white text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Views Analytics (Daily Graph)</span>
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'series'
              ? 'bg-white text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          My Manga & Chapters ({seriesList.length})
        </button>
        <button
          onClick={() => setActiveTab('new_series')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'new_series'
              ? 'bg-white text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          + Upload Manga (New Series)
        </button>
        <button
          onClick={() => setActiveTab('new_chapter')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'new_chapter'
              ? 'bg-white text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          + Add Chapter Pages (Page 1, 2, 3...)
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-white text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          UPI Payouts & Banking
        </button>
      </div>

      {/* TAB 1: OVERVIEW & EARNINGS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                Monthly Royalties
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-white">
                ₹{(creatorProfile?.monthlyEarningsInr ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-zinc-400" /> 70% Net Revenue Share
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                Total Chapter Reads
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {(creatorProfile?.totalReads ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Across all published series</p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                Followers & Readers
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {(creatorProfile?.followersCount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">Dedicated fanbase</p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                Pending Payout
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-white">
                ₹{(creatorProfile?.monthlyEarningsInr ?? 0).toLocaleString('en-IN')}
              </p>
              <button
                onClick={handleRequestPayout}
                className="mt-2 text-[11px] font-bold text-white hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>Request Payout</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Upload CTA Banner */}
          <div className="p-6 rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Ready to publish your next masterpiece?</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Upload your manga with hero cover images, select categories, add Page 1, 2, 3... and send for Admin Approval. Once approved, it appears live for all readers!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('new_series')}
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
            >
              Start Uploading Manga
            </button>
          </div>

          {/* Published Manga Series List Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Your Manga Series ({seriesList.length})
            </h3>
            {seriesList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 font-semibold">You haven't uploaded any manga yet.</p>
                <button
                  onClick={() => setActiveTab('new_series')}
                  className="mt-3 px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold"
                >
                  Create Your First Manga
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seriesList.map(series => {
                  const chCount = StorageService.getChapters(series.id).length;
                  return (
                    <div
                      key={series.id}
                      className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex gap-4 hover:border-zinc-700 transition-all"
                    >
                      <img
                        src={series.coverUrl}
                        alt={series.title}
                        className="w-20 h-28 object-cover rounded-xl bg-zinc-800 shrink-0 border border-zinc-700"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                                series.moderationStatus === 'approved'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                  : series.moderationStatus === 'pending_review'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                  : 'bg-red-950/80 text-red-300 border-red-800'
                              }`}
                            >
                              {series.moderationStatus === 'approved'
                                ? 'Live & Published'
                                : series.moderationStatus === 'pending_review'
                                ? 'Pending Review'
                                : 'Rejected'}
                            </span>
                          </div>
                          <h4
                            onClick={() => {
                              setSelectedSeries(series);
                              setChapterSeriesId(series.id);
                              setActiveTab('series');
                            }}
                            className="text-sm font-bold text-white truncate cursor-pointer hover:underline"
                          >
                            {series.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{series.synopsis}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">
                            {series.totalReads.toLocaleString()} reads • ⭐ {series.rating.toFixed(1)}/5.0
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800">
                          <button
                            onClick={() => {
                              setSelectedSeries(series);
                              setChapterSeriesId(series.id);
                              setActiveTab('series');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            View Chapters ({chCount})
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSeries(series);
                              setChapterSeriesId(series.id);
                              setActiveTab('new_chapter');
                            }}
                            className="text-white hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            + Add Chapter
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: 30-DAY ANALYTICS & TRENDS (RECHARTS) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <CreatorAnalyticsCharts
            totalReads={creatorProfile?.totalReads ?? 0}
            monthlyEarningsInr={creatorProfile?.monthlyEarningsInr ?? 0}
            subscribersCount={creatorProfile?.followersCount ?? 0}
            creatorName={creatorProfile?.penName || user.name}
          />
        </div>
      )}

      {/* TAB 2: MY MANGA & CHAPTERS */}
      {activeTab === 'series' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-300">
              Manage Series & Manga Chapters
            </h3>
            <button
              onClick={() => setActiveTab('new_series')}
              className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs"
            >
              + New Series
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: List of Creator's Series */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-zinc-500 uppercase">Select Series to Manage:</p>
              {seriesList.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSeries(s);
                    setChapterSeriesId(s.id);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedSeries?.id === s.id
                      ? 'border-white bg-zinc-800/80 shadow-md ring-1 ring-white'
                      : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                  }`}
                >
                  <img
                    src={s.coverUrl}
                    alt={s.title}
                    className="w-12 h-16 object-cover rounded-lg bg-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{s.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          s.moderationStatus === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {s.moderationStatus === 'approved' ? 'Approved' : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Selected Series Details & Chapters List */}
            {selectedSeries ? (
              <div className="lg:col-span-2 space-y-6">
                <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={selectedSeries.coverUrl}
                      alt={selectedSeries.title}
                      className="w-28 h-40 object-cover rounded-2xl bg-zinc-800 border border-zinc-700 shrink-0 shadow-lg"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            selectedSeries.moderationStatus === 'approved'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          Status: {selectedSeries.moderationStatus.replace('_', ' ')}
                        </span>
                        {selectedSeries.isExclusive && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-zinc-950 font-bold uppercase">
                            VIP Exclusive
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black text-white">{selectedSeries.title}</h2>
                      <p className="text-xs text-zinc-300 leading-relaxed">{selectedSeries.synopsis}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSeries.genres.map(g => (
                          <span
                            key={g}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedSeries.moderationStatus === 'pending_review' && (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        This manga is currently pending review by the MangaWild editorial team. You can still add and prepare new chapter pages below!
                      </span>
                    </div>
                  )}

                  {/* Chapters List */}
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                        Chapters for this Series ({chaptersForSelected.length})
                      </h4>
                      <button
                        onClick={() => {
                          setChapterSeriesId(selectedSeries.id);
                          setNewChapterNumber(chaptersForSelected.length + 1);
                          setActiveTab('new_chapter');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chapter Pages</span>
                      </button>
                    </div>

                    {chaptersForSelected.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No chapters yet. Click "Add Chapter Pages" to upload your manga panels.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {chaptersForSelected.map(ch => (
                          <div
                            key={ch.id}
                            className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  Chapter {ch.chapterNumber}: {ch.title}
                                </span>
                                {ch.isExclusiveVIP && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                    VIP
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                    ch.moderationStatus === 'approved'
                                      ? 'bg-emerald-950 text-emerald-300'
                                      : 'bg-amber-950 text-amber-300'
                                  }`}
                                >
                                  {ch.moderationStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                {ch.panels?.length || 0} Pages • {ch.viewsCount} reads
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onPreviewChapter(selectedSeries.id, ch.id)}
                                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition-colors shadow-xs"
                                title="Open this chapter in reader"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read Chapter</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD MANGA (SERIES CREATION WITH CATEGORIES & HERO IMAGE) */}
      {activeTab === 'new_series' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="pb-4 border-b border-zinc-800">
            <h2 className="text-xl font-black text-white">Upload New Manga Series</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Provide complete details, hero cover image, and select matching categories. Submitting sends your manga to the Admin Approval Desk!
            </p>
          </div>

          <form onSubmit={handleCreateSeries} className="space-y-6">
            {/* Title & Language Variants */}
            <div className="space-y-4 p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                1. Title & Details
              </h3>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Manga Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Blade of Indra, Shadow Ronin, or Cosmic Samurai"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Secondary Title / Sub-Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTitleHindi}
                    onChange={e => setNewTitleHindi(e.target.value)}
                    placeholder="e.g. The Path of the Divine Warrior"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Japanese Title (Romaji / Kanji - Optional)
                  </label>
                  <input
                    type="text"
                    value={newTitleJapanese}
                    onChange={e => setNewTitleJapanese(e.target.value)}
                    placeholder="e.g. 刃の雷, Kage no Senshi"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              {/* Description / Synopsis */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Description & Synopsis <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={newSynopsis}
                  onChange={e => setNewSynopsis(e.target.value)}
                  placeholder="Describe your manga's plot, world, protagonist, and what makes it exciting for readers..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Short Tagline (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newSynopsisHindi}
                  onChange={e => setNewSynopsisHindi(e.target.value)}
                  placeholder="A compelling one-line hook for readers..."
                  className="w-full px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* Categories & Genres Multi-Selection */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                  2. Categories & Genres <span className="text-red-400">*</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {newGenres.length} selected
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Select all genres that apply to your manga so readers can discover it easily:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_GENRES.map(genre => {
                  const isSelected = newGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-zinc-950 border-white font-bold shadow-xs'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {genre} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Cover Image & Visual Preview */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                3. Hero Cover Image <span className="text-red-400">*</span>
              </h3>
              <p className="text-xs text-zinc-400">
                The featured cover image that appears on the homepage, catalog, and banner:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                {/* Live Preview Box */}
                <div className="space-y-1.5 text-center">
                  <p className="text-[11px] font-mono text-zinc-500 uppercase">Live Cover Preview</p>
                  <div className="w-full aspect-3/4 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-xl flex items-center justify-center relative">
                    {newHeroCoverUrl ? (
                      <img
                        src={newHeroCoverUrl}
                        alt="Hero Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs text-zinc-400 font-semibold">{newTitle || 'Cover Title'}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">{newGenres[0] || 'Genre'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload or URL Controls */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Option A: Upload Image File
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/70 hover:bg-zinc-800 cursor-pointer text-xs font-semibold text-zinc-300 transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <span>Choose PNG, JPG, or WEBP file</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Option B: Or Enter Image URL
                    </label>
                    <input
                      type="url"
                      value={newHeroCoverUrl}
                      onChange={e => setNewHeroCoverUrl(e.target.value)}
                      placeholder="https://example.com/manga-hero-cover.jpg"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Option C: Or Pick Procedural Color Theme
                    </label>
                    <div className="flex gap-2">
                      {(['ink', 'blue', 'gold', 'emerald', 'purple'] as const).map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setCoverPresetColor(color);
                            setNewHeroCoverUrl('');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-mono uppercase border transition-all ${
                            coverPresetColor === color && !newHeroCoverUrl
                              ? 'bg-white text-zinc-950 font-bold border-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Publishing Settings & Admin Review Notice */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                4. Release Settings & Moderation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Series Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="hiatus">Hiatus</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="vipExclusive"
                    checked={newIsExclusive}
                    onChange={e => setNewIsExclusive(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900"
                  />
                  <label htmlFor="vipExclusive" className="text-xs text-zinc-300 cursor-pointer">
                    VIP Vault Exclusive (Paid Subscribers Only)
                  </label>
                </div>
              </div>

              {/* Admin Approval Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-300 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-white">Admin Approval Workflow:</strong> When you submit, this series will be sent to the MangaWild Admin Approval Desk with status <code className="bg-zinc-900 px-1 py-0.5 rounded text-amber-300 font-mono">pending_review</code>. The admin will verify your artwork, hero image, and description before publishing it live for all readers.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-black text-sm transition-all shadow-xl active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Manga for Admin Approval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ADD CHAPTER PAGES (PAGE 1, PAGE 2, PAGE 3... SCAN MANAGER) */}
      {activeTab === 'new_chapter' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="pb-4 border-b border-zinc-800">
            <h2 className="text-xl font-black text-white">
              Add Manga Chapter with Pages
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select your manga, arrange sequential pages (Page 1, 2, 3...), preview in live reader, and submit for Admin Approval!
            </p>
          </div>

          <form onSubmit={handleCreateChapter} className="space-y-6">
            {/* Target Series & Chapter Meta */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                1. Chapter Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Select Manga Series <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={chapterSeriesId}
                    onChange={e => setChapterSeriesId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white"
                  >
                    <option value="">-- Choose Series --</option>
                    {seriesList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.moderationStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Chapter Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newChapterNumber}
                    onChange={e => setNewChapterNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="chVip"
                    checked={newChapterIsVIP}
                    onChange={e => setNewChapterIsVIP(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900"
                  />
                  <label htmlFor="chVip" className="text-xs text-zinc-300 cursor-pointer">
                    VIP Early Access Chapter
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Chapter Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newChapterTitle}
                    onChange={e => setNewChapterTitle(e.target.value)}
                    placeholder="e.g. The Call of the Divine Blade"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Chapter Sub-Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newChapterTitleHindi}
                    onChange={e => setNewChapterTitleHindi(e.target.value)}
                    placeholder="e.g. Episode 1: Into the Shadows"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Chapter Pages Builder (Page 1, Page 2, Page 3...) */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                    2. Manga Scans & Pages ({chapterPages.length} Pages)
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Upload or enter image scans for each page in reading sequence:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddPage}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Page</span>
                </button>
              </div>

              {/* Pages Grid / List */}
              <div className="space-y-4">
                {chapterPages.map((page, idx) => (
                  <div
                    key={page.id}
                    className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 flex flex-col sm:flex-row gap-4 items-start relative hover:border-zinc-700 transition-all"
                  >
                    {/* Page Number Badge & Reorder controls */}
                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0">
                      <span className="w-10 h-10 rounded-xl bg-white text-zinc-950 font-black text-sm flex items-center justify-center font-mono shadow-md">
                        #{idx + 1}
                      </span>
                      <div className="flex sm:flex-col gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePage(idx, 'up')}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Page Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === chapterPages.length - 1}
                          onClick={() => handleMovePage(idx, 'down')}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Page Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Page Thumbnail Preview */}
                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0 shadow-inner flex items-center justify-center">
                      {page.imageUrl ? (
                        <img
                          src={page.imageUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">No Image</span>
                      )}
                    </div>

                    {/* Controls & Inputs */}
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">Page {idx + 1}</span>
                        {chapterPages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePage(idx)}
                            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-mono cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Option 1: File Upload */}
                        <label className="p-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer text-[11px] text-zinc-300 flex items-center justify-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-white" />
                          <span>Upload Page Scan</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handlePageFileUpload(idx, e)}
                            className="hidden"
                          />
                        </label>

                        {/* Option 2: Image URL */}
                        <input
                          type="text"
                          value={page.imageUrl}
                          onChange={e => {
                            const copy = [...chapterPages];
                            copy[idx].imageUrl = e.target.value;
                            setChapterPages(copy);
                          }}
                          placeholder="Or enter Image URL"
                          className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-[11px] font-mono focus:outline-none focus:border-white"
                        />
                      </div>

                      {/* Scene notes / caption */}
                      <input
                        type="text"
                        value={page.caption}
                        onChange={e => {
                          const copy = [...chapterPages];
                          copy[idx].caption = e.target.value;
                          setChapterPages(copy);
                        }}
                        placeholder={`Scene caption or dialogue for Page ${idx + 1}...`}
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Page CTA */}
              <button
                type="button"
                onClick={handleAddPage}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 text-zinc-400 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Another Page (Page {chapterPages.length + 1})</span>
              </button>
            </div>

            {/* Submit & Send for Approval */}
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-black text-sm transition-all shadow-xl active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Submit Chapter for Admin Approval ({chapterPages.length} Pages)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: UPI PAYOUTS & BANKING */}
      {activeTab === 'payouts' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="pb-4 border-b border-zinc-800">
            <h2 className="text-xl font-black text-white">Creator Earnings & UPI Payouts</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configure your direct UPI ID or bank account details to receive your 70% weekly manga royalties.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <p className="text-[11px] font-mono text-zinc-400 uppercase">Available Payout Balance</p>
                <p className="text-3xl font-black text-white mt-1">
                  ₹{(creatorProfile?.monthlyEarningsInr ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={handleRequestPayout}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                Withdraw Funds Now
              </button>
            </div>

            <form onSubmit={handleSavePayoutDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  UPI ID (VPA for Instant UPI Transfer)
                </label>
                <input
                  type="text"
                  required
                  value={upiIdInput}
                  onChange={e => setUpiIdInput(e.target.value)}
                  placeholder="e.g. creator@okhdfcbank or 9876543210@paytm"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Account Holder / Pen Name
                </label>
                <input
                  type="text"
                  required
                  value={bankHolderInput}
                  onChange={e => setBankHolderInput(e.target.value)}
                  placeholder="Official name matching bank account"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Save Payout Information
              </button>
            </form>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1 font-mono">
            <p className="font-bold text-white">MangaWild Creator Royalty Policy:</p>
            <p>• Creators receive 70% of gross revenue generated by their VIP chapter reads and subscriber contributions.</p>
            <p>• Payouts processed every Monday directly via UPI / NEFT.</p>
            <p>• Minimum withdrawal threshold: ₹500.</p>
          </div>
        </div>
      )}
    </div>
  );
};

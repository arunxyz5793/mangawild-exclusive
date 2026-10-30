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
  Edit3,
  Check,
  Move,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
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
  const [newReadingFormat, setNewReadingFormat] = useState<'webtoon_vertical' | 'manga_horizontal'>('webtoon_vertical');
  const [newAgeRating, setNewAgeRating] = useState<'All Ages' | '13+' | '18+'>('13+');

  // State for Creating New Chapter with Page-by-Page Manga Scans
  const [chapterSeriesId, setChapterSeriesId] = useState<string>(selectedSeries?.id || '');
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterTitleHindi, setNewChapterTitleHindi] = useState('');
  const [newMonetizationType, setNewMonetizationType] = useState<'free' | 'vip' | 'coin'>('free');
  const [newCoinCost, setNewCoinCost] = useState<number>(10);
  const [newTippingEnabled, setNewTippingEnabled] = useState<boolean>(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);

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

  // Live In-Dashboard Chapter Preview Modal
  const [showLivePreviewModal, setShowLivePreviewModal] = useState<boolean>(false);
  const [previewReadingMode, setPreviewReadingMode] = useState<'webtoon' | 'page_flip'>('webtoon');
  const [previewPageIdx, setPreviewPageIdx] = useState<number>(0);

  // Post-Approval Series Direct Editing Modal (No re-approval hurdle!)
  const [editingSeriesModal, setEditingSeriesModal] = useState<MangaSeries | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSynopsis, setEditSynopsis] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editGenres, setEditGenres] = useState<MangaGenre[]>([]);
  const [editReadingFormat, setEditReadingFormat] = useState<'webtoon_vertical' | 'manga_horizontal'>('webtoon_vertical');
  const [editAgeRating, setEditAgeRating] = useState<'All Ages' | '13+' | '18+'>('13+');
  const [editStatus, setEditStatus] = useState<'ongoing' | 'completed' | 'hiatus'>('ongoing');

  // Post-Approval Chapter Panels Direct Editing Modal (Reorder, Replace, Add pages live!)
  const [editingChapterModal, setEditingChapterModal] = useState<Chapter | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterMonetization, setEditChapterMonetization] = useState<'free' | 'vip' | 'coin'>('free');
  const [editChapterCoinCost, setEditChapterCoinCost] = useState<number>(10);
  const [editChapterPanels, setEditChapterPanels] = useState<ChapterPanel[]>([]);

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
      readingFormat: newReadingFormat,
      ageRating: newAgeRating,
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

  // Multiple Files Manga Scans Batch Uploader
  const handleMultipleFilesUpload = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      showToast('No valid image files found.');
      return;
    }

    // Sort files by natural alphanumeric filename (e.g. page-1.jpg, page-2.jpg, page-10.jpg)
    fileArray.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const promises = fileArray.map((file, i) => {
      return new Promise<NewPageItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `scan_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            imageUrl: (e.target?.result as string) || '',
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newItems => {
      setChapterPages(prev => [...prev, ...newItems]);
      showToast(`Added ${newItems.length} manga page scans in sequence!`);
    });
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
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

  // Post-Approval Series Direct Editing Handlers (No re-approval needed!)
  const openEditSeriesModal = (series: MangaSeries) => {
    setEditingSeriesModal(series);
    setEditTitle(series.title);
    setEditSynopsis(series.synopsis);
    setEditCoverUrl(series.coverUrl);
    setEditBannerUrl(series.bannerUrl || series.coverUrl);
    setEditGenres(series.genres || ['Action']);
    setEditReadingFormat(series.readingFormat || 'webtoon_vertical');
    setEditAgeRating(series.ageRating || '13+');
    setEditStatus(series.status || 'ongoing');
  };

  const handleSaveSeriesEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeriesModal) return;
    if (!editTitle.trim()) {
      showToast('Title cannot be empty.');
      return;
    }

    const updated = StorageService.updateSeries(editingSeriesModal.id, {
      title: editTitle.trim(),
      synopsis: editSynopsis.trim(),
      coverUrl: editCoverUrl.trim(),
      bannerUrl: editBannerUrl.trim(),
      genres: editGenres,
      readingFormat: editReadingFormat,
      ageRating: editAgeRating,
      status: editStatus,
      // If approved by admin, keeps approved without re-approval!
    });

    if (updated) {
      refreshCreatorData();
      setSelectedSeries(updated);
      setEditingSeriesModal(null);
      showToast(`Manga "${updated.title}" updated live! Changes published immediately.`);
    }
  };

  // Post-Approval Chapter Panels Editing Handlers (Live reordering and scans replacement)
  const openEditChapterModal = (chapter: Chapter) => {
    setEditingChapterModal(chapter);
    setEditChapterTitle(chapter.title);
    setEditChapterMonetization(chapter.monetizationType || (chapter.isExclusiveVIP ? 'vip' : 'free'));
    setEditChapterCoinCost(chapter.coinCost || 10);
    setEditChapterPanels(chapter.panels.map(p => ({ ...p })));
  };

  const handleMoveEditPanel = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editChapterPanels.length) return;
    const copy = [...editChapterPanels];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    // update panel numbers
    copy.forEach((p, i) => { p.panelNumber = i + 1; });
    setEditChapterPanels(copy);
  };

  const handleRemoveEditPanel = (index: number) => {
    if (editChapterPanels.length <= 1) {
      showToast('A chapter must contain at least 1 panel.');
      return;
    }
    const copy = editChapterPanels.filter((_, i) => i !== index);
    copy.forEach((p, i) => { p.panelNumber = i + 1; });
    setEditChapterPanels(copy);
  };

  const handleReplaceEditPanelFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const copy = [...editChapterPanels];
          copy[index].imageUrl = uploadEvent.target.result as string;
          setEditChapterPanels(copy);
          showToast(`Panel ${index + 1} image replaced!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEditPanelScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const promises = fileArray.map((file, i) => {
      return new Promise<ChapterPanel>((resolve) => {
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
          resolve({
            id: `edit_pnl_${Date.now()}_${i}`,
            panelNumber: editChapterPanels.length + i + 1,
            imageUrl: (uploadEvt.target?.result as string) || '',
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newPanels => {
      const merged = [...editChapterPanels, ...newPanels];
      merged.forEach((p, i) => { p.panelNumber = i + 1; });
      setEditChapterPanels(merged);
      showToast(`Added ${newPanels.length} new panels!`);
    });
  };

  const handleSaveChapterEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapterModal) return;
    if (!editChapterTitle.trim()) {
      showToast('Chapter title cannot be empty.');
      return;
    }

    const isVIP = editChapterMonetization === 'vip';
    const updated = StorageService.updateChapter(editingChapterModal.id, {
      title: editChapterTitle.trim(),
      monetizationType: editChapterMonetization,
      isExclusiveVIP: isVIP,
      coinCost: editChapterMonetization === 'coin' ? editChapterCoinCost : 0,
      panels: editChapterPanels,
    });

    StorageService.updateChapterPanels(editingChapterModal.id, editChapterPanels);

    if (updated) {
      refreshCreatorData();
      setEditingChapterModal(null);
      showToast(`Chapter ${updated.chapterNumber} updated live! Panels saved.`);
    }
  };

  // Handle Create Chapter (Submitted for Admin Approval or auto-live if series approved)
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

    const isVIP = newMonetizationType === 'vip';

    const chapter = StorageService.createChapter({
      seriesId: targetSeriesId,
      chapterNumber: newChapterNumber,
      title: newChapterTitle.trim(),
      isExclusiveVIP: isVIP,
      monetizationType: newMonetizationType,
      coinCost: newMonetizationType === 'coin' ? newCoinCost : 0,
      tippingEnabled: newTippingEnabled,
      panels,
    });

    const targetSeries = StorageService.getSeriesById(targetSeriesId);
    const isSeriesApproved = targetSeries?.isApprovedByAdmin || targetSeries?.moderationStatus === 'approved';

    showToast(
      isSeriesApproved
        ? `Chapter ${chapter.chapterNumber} ("${chapter.title}") published live immediately!`
        : `Chapter ${chapter.chapterNumber} ("${chapter.title}") submitted for Admin Review!`
    );
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
          <CheckCircle className="w-5 h-5 text-white shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider bg-white/10 text-zinc-300 border border-white/10 font-medium">
              Creator
            </span>
            {creatorProfile?.verified && (
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-300" /> Verified
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            {creatorProfile?.penName || user.name}
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {creatorProfile?.handle || `@${user.username}`} • 70% Share
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('creator-profile', { id: creatorProfile?.id, author: creatorProfile?.penName || user.name })}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="View Public Mangaka Profile & Tip Jar"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>View Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('new_series')}
            className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Series</span>
          </button>

          <button
            onClick={() => setActiveTab('new_chapter')}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Concise & Professional) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-white/[0.08] text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium ${
            activeTab === 'overview'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium ${
            activeTab === 'series'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Series ({seriesList.length})
        </button>
        <button
          onClick={() => setActiveTab('new_series')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium ${
            activeTab === 'new_series'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          New Series
        </button>
        <button
          onClick={() => setActiveTab('new_chapter')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium ${
            activeTab === 'new_chapter'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Add Chapter
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium ${
            activeTab === 'payouts'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Payouts
        </button>
      </div>

      {/* TAB 1: OVERVIEW & EARNINGS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border border-white/[0.08] bg-zinc-950/60">
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                Earnings
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-white">
                ₹{(creatorProfile?.monthlyEarningsInr ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">70% Share</p>
            </div>

            <div className="p-4 rounded-2xl border border-white/[0.08] bg-zinc-950/60">
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                Reads
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-white">
                {(creatorProfile?.totalReads ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Total across series</p>
            </div>

            <div className="p-4 rounded-2xl border border-white/[0.08] bg-zinc-950/60">
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                Followers
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-white">
                {(creatorProfile?.followersCount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Subscribers</p>
            </div>

            <div className="p-4 rounded-2xl border border-white/[0.08] bg-zinc-950/60">
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                Balance
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-white">
                ₹{(creatorProfile?.monthlyEarningsInr ?? 0).toLocaleString('en-IN')}
              </p>
              <button
                onClick={handleRequestPayout}
                className="mt-1 text-[10px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>Payout</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Quick Upload CTA Banner */}
          <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Publish original manga</h3>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-lg leading-relaxed">
                Upload your series, add chapter panels, and submit for editorial review.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('new_series')}
              className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
            >
              New Series
            </button>
          </div>

          {/* Published Manga Series List Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono">
              Series ({seriesList.length})
            </h3>
            {seriesList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/[0.08] bg-zinc-950/40">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-medium">No manga series published yet.</p>
                <button
                  onClick={() => setActiveTab('new_series')}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold"
                >
                  Create Series
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
                                  ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                                  : series.moderationStatus === 'pending_review'
                                  ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              {series.moderationStatus === 'approved'
                                ? 'Live & Published'
                                : series.moderationStatus === 'pending_review'
                                ? 'Pending Review'
                                : 'Needs Revision'}
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

          {/* Clean 30-Day Ranked Manga Performance Leaderboard */}
          <div className="pt-4 border-t border-zinc-800/80">
            <CreatorAnalyticsCharts
              totalReads={creatorProfile?.totalReads ?? 0}
              monthlyEarningsInr={creatorProfile?.monthlyEarningsInr ?? 0}
              subscribersCount={creatorProfile?.followersCount ?? 0}
              creatorName={creatorProfile?.penName || user.name}
              seriesList={seriesList}
              onSelectSeries={(series) => {
                setSelectedSeries(series);
                setChapterSeriesId(series.id);
                setActiveTab('series');
              }}
              onNavigateNewSeries={() => setActiveTab('new_series')}
            />
          </div>
        </div>
      )}

      {/* TAB: 30-DAY ANALYTICS & TRENDS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <CreatorAnalyticsCharts
            totalReads={creatorProfile?.totalReads ?? 0}
            monthlyEarningsInr={creatorProfile?.monthlyEarningsInr ?? 0}
            subscribersCount={creatorProfile?.followersCount ?? 0}
            creatorName={creatorProfile?.penName || user.name}
            seriesList={seriesList}
            onSelectSeries={(series) => {
              setSelectedSeries(series);
              setChapterSeriesId(series.id);
              setActiveTab('series');
            }}
            onNavigateNewSeries={() => setActiveTab('new_series')}
          />
        </div>
      )}

      {/* TAB 2: MY MANGA & CHAPTERS */}
      {activeTab === 'series' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
              Series & Chapters
            </h3>
            <button
              onClick={() => setActiveTab('new_series')}
              className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs"
            >
              New Series
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: List of Creator's Series */}
            <div className="space-y-3">
              <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Select Series</p>
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
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            selectedSeries.moderationStatus === 'approved'
                              ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          Status: {selectedSeries.moderationStatus === 'approved' ? 'Approved & Live' : selectedSeries.moderationStatus.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {selectedSeries.readingFormat === 'manga_horizontal' ? 'Horizontal Manga' : 'Vertical Webtoon'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Rating: {selectedSeries.ageRating || '13+'}
                        </span>
                        {selectedSeries.isExclusive && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-zinc-950 font-bold uppercase">
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

                  {/* Post-Approval Direct Freedom Notice */}
                  {(selectedSeries.moderationStatus === 'approved' || selectedSeries.isApprovedByAdmin) ? (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-300 flex items-start justify-between gap-3 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 shrink-0 text-white mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">Editorial Approved — Live Editing Enabled</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                            Modify title, cover art, synopsis, genres, and chapter panel ordering. All changes go live immediately.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditSeriesModal(selectedSeries)}
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs shrink-0 hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Info</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0 text-zinc-400" />
                        <span>
                          Pending editorial review. You can still edit info or add chapter pages.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditSeriesModal(selectedSeries)}
                        className="px-3 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  )}

                  {/* Chapters List */}
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                        Chapters ({chaptersForSelected.length})
                      </h4>
                      <button
                        onClick={() => {
                          setChapterSeriesId(selectedSeries.id);
                          setNewChapterNumber(chaptersForSelected.length + 1);
                          setActiveTab('new_chapter');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs cursor-pointer flex items-center gap-1 hover:bg-zinc-200 transition-colors shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chapter</span>
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
                            className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white">
                                  Chapter {ch.chapterNumber}: {ch.title}
                                </span>
                                {ch.monetizationType === 'vip' || ch.isExclusiveVIP ? (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">
                                    VIP EXCLUSIVE
                                  </span>
                                ) : ch.monetizationType === 'coin' ? (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold">
                                    {ch.coinCost || 10} COINS
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold">
                                    FREE
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                    ch.moderationStatus === 'approved'
                                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                  }`}
                                >
                                  {ch.moderationStatus === 'approved' ? 'Live' : ch.moderationStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                {ch.panels?.length || 0} Pages • {ch.viewsCount} reads {ch.tippingEnabled && '• Tips enabled'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditChapterModal(ch)}
                                className="px-2.5 py-1.5 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit chapter title, monetization, and reorder panels"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Edit Panels</span>
                              </button>
                              <button
                                onClick={() => onPreviewChapter(selectedSeries.id, ch.id)}
                                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition-colors shadow-xs active:scale-95"
                                title="Open this chapter in reader"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read</span>
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
            <h2 className="text-lg font-bold text-white">New Series</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Provide series details, cover art, and genres for editorial review.
            </p>
          </div>

          <form onSubmit={handleCreateSeries} className="space-y-6">
            {/* Title & Language Variants */}
            <div className="space-y-4 p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40">
              <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                1. Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Title <span className="text-red-400">*</span>
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
                <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                  2. Genres <span className="text-red-400">*</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {newGenres.length} selected
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Select matching genres for reader discovery:
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
              <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                3. Cover Art <span className="text-red-400">*</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Featured cover image for catalog and spotlight:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                {/* Live Preview Box */}
                <div className="space-y-1.5 text-center">
                  <p className="text-[11px] font-mono text-zinc-500 uppercase">Preview</p>
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
                      Upload File
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/70 hover:bg-zinc-800 cursor-pointer text-xs font-semibold text-zinc-300 transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <span>Choose image file</span>
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
                      Image URL
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
                      Color Theme
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

            {/* Publishing Settings, Reading Orientation & Age Rating */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                4. Format & Rating
              </h3>

              {/* Creator Reading Orientation Format */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">
                  Creator Reader Format Preference <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewReadingFormat('webtoon_vertical')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      newReadingFormat === 'webtoon_vertical'
                        ? 'border-white bg-zinc-800/90 text-white shadow-sm ring-1 ring-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Vertical Webtoon</span>
                      {newReadingFormat === 'webtoon_vertical' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-tight">
                      Seamless continuous vertical scroll flow. Recommended for webtoons and mobile scrolling.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewReadingFormat('manga_horizontal')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      newReadingFormat === 'manga_horizontal'
                        ? 'border-white bg-zinc-800/90 text-white shadow-sm ring-1 ring-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Horizontal Manga</span>
                      {newReadingFormat === 'manga_horizontal' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-tight">
                      Classic paginated page-by-page flip mode. (Readers can still toggle to vertical anytime).
                    </p>
                  </button>
                </div>
              </div>

              {/* Age Rating & Advisory */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">
                  Age Rating & Content Advisory <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['All Ages', '13+', '18+'] as const).map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewAgeRating(rating)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        newAgeRating === rating
                          ? 'border-white bg-white text-zinc-950 shadow-sm'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
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
                  <strong className="text-white">Admin Approval Workflow:</strong> When you submit, this series will be sent to the editorial team. Once approved by admin, you gain full live editing access to update any part of the series and chapter panels without needing re-approval!
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
            <h2 className="text-lg font-bold text-white">
              Add Chapter
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload and arrange sequential chapter pages.
            </p>
          </div>

          <form onSubmit={handleCreateChapter} className="space-y-6">
            {/* Target Series & Chapter Meta */}
            <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                1. Info & Pricing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        {s.title} ({s.moderationStatus === 'approved' ? 'Live & Approved' : 'Pending Review'})
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
              </div>

              {/* Monetization Model Selector: Free vs VIP vs Coin Unlock */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">
                  Chapter Monetization Model <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMonetizationType('free')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      newMonetizationType === 'free'
                        ? 'border-white bg-zinc-800 text-white shadow-sm ring-1 ring-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Free Chapter</span>
                      {newMonetizationType === 'free' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Free for all registered & guest readers.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMonetizationType('vip')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      newMonetizationType === 'vip'
                        ? 'border-white bg-zinc-800 text-white shadow-sm ring-1 ring-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">VIP Exclusive</span>
                      {newMonetizationType === 'vip' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Unlocked for all active VIP Pass subscribers.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMonetizationType('coin')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      newMonetizationType === 'coin'
                        ? 'border-white bg-zinc-800 text-white shadow-sm ring-1 ring-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Coin Unlock</span>
                      {newMonetizationType === 'coin' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">One-time microtransaction unlock with coins.</p>
                  </button>
                </div>

                {newMonetizationType === 'coin' && (
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3 animate-fade-in">
                    <span className="text-xs font-semibold text-zinc-300">Unlock Price:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCoinCost}
                      onChange={e => setNewCoinCost(parseInt(e.target.value) || 10)}
                      className="w-24 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-xs font-mono"
                    />
                    <span className="text-xs text-zinc-400 font-mono">Coins (approx ₹{newCoinCost * 2})</span>
                  </div>
                )}

                {/* Tipping Jar Feature */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="tippingToggle"
                    checked={newTippingEnabled}
                    onChange={e => setNewTippingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                  />
                  <label htmlFor="tippingToggle" className="text-xs text-zinc-300 cursor-pointer select-none">
                    Enable Creator Tipping Jar at the end of this chapter
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-zinc-400">
                    2. Pages ({chapterPages.length})
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Upload and arrange sequential pages:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Multi-file batch picker button */}
                  <label className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition-all shadow-xs active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Pages</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => handleMultipleFilesUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddPage}
                    className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Blank</span>
                  </button>
                </div>
              </div>

              {/* Drag & Drop Scans Zone */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDraggingFiles(true);
                }}
                onDragLeave={() => setIsDraggingFiles(false)}
                onDrop={handleDropFiles}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
                  isDraggingFiles
                    ? 'border-white bg-white/10 scale-[1.01]'
                    : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/30'
                }`}
              >
                <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-white">Drag & drop your manga scan files here</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Select multiple JPG, PNG, or WEBP pages. They will be sorted alphabetically in reading order.
                </p>
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
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
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
                          <span>Replace Scan File</span>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="flex-1 py-3 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 text-zinc-400 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Blank Page (Page {chapterPages.length + 1})</span>
                </button>
              </div>
            </div>

            {/* Live In-Dashboard Preview & Submit */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPreviewPageIdx(0);
                  setShowLivePreviewModal(true);
                }}
                className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-white" />
                <span>Preview Reader ({chapterPages.length} Pages)</span>
              </button>

              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition-all shadow-xs active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {selectedSeries?.isApprovedByAdmin || selectedSeries?.moderationStatus === 'approved'
                    ? `Publish Chapter ${newChapterNumber}`
                    : `Submit Chapter (${chapterPages.length} Pages)`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: UPI PAYOUTS & BANKING */}
      {activeTab === 'payouts' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="pb-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Payouts</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage UPI and bank account details for weekly royalty transfers.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-bold text-white mt-0.5">
                  ₹{(creatorProfile?.monthlyEarningsInr ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={handleRequestPayout}
                className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-xs active:scale-95 cursor-pointer"
              >
                Withdraw
              </button>
            </div>

            <form onSubmit={handleSavePayoutDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  UPI ID
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

      {/* ========================================================================= */}
      {/* MODAL 1: POST-APPROVAL SERIES METADATA LIVE EDITING                       */}
      {/* ========================================================================= */}
      {editingSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white">Direct Live Series Editor</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Update your manga series details. Edits publish immediately with no re-approval needed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSeriesModal(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeriesEdits} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Manga Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  required
                  value={editSynopsis}
                  onChange={e => setEditSynopsis(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Hero Cover URL</label>
                  <input
                    type="text"
                    value={editCoverUrl}
                    onChange={e => setEditCoverUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Banner Artwork URL</label>
                  <input
                    type="text"
                    value={editBannerUrl}
                    onChange={e => setEditBannerUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              {/* Reader Format & Age Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Reading Format</label>
                  <select
                    value={editReadingFormat}
                    onChange={e => setEditReadingFormat(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  >
                    <option value="webtoon_vertical">Vertical Webtoon (Continuous Scroll)</option>
                    <option value="manga_horizontal">Horizontal Manga (Page Flip)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Age Rating</label>
                  <select
                    value={editAgeRating}
                    onChange={e => setEditAgeRating(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  >
                    <option value="All Ages">All Ages</option>
                    <option value="13+">13+ (Teens)</option>
                    <option value="18+">18+ (Mature advisory)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingSeriesModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save Live Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: POST-APPROVAL CHAPTER PANELS SEQUENCER & EDITING                 */}
      {/* ========================================================================= */}
      {editingChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 my-8 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  Chapter {editingChapterModal.chapterNumber} Panel Sequencer
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reorder pages, upload replacements, add new scans, and adjust monetization live!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingChapterModal(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapterEdits} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Chapter Title</label>
                  <input
                    type="text"
                    required
                    value={editChapterTitle}
                    onChange={e => setEditChapterTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Monetization</label>
                  <select
                    value={editChapterMonetization}
                    onChange={e => setEditChapterMonetization(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  >
                    <option value="free">Free (All Readers)</option>
                    <option value="vip">VIP Exclusive</option>
                    <option value="coin">Coin Unlock</option>
                  </select>
                </div>
              </div>

              {/* Panels Visual Sequencer */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Panels ({editChapterPanels.length})
                  </span>
                  <label className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer border border-zinc-700 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Panels</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAddEditPanelScan}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {editChapterPanels.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-mono font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <img
                          src={p.imageUrl}
                          alt={`Panel ${idx + 1}`}
                          className="w-14 h-18 object-cover rounded-lg bg-zinc-900 border border-zinc-800"
                        />
                        <div>
                          <p className="text-xs font-bold text-white font-mono">Panel {idx + 1}</p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">{p.caption || 'Manga panel'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveEditPanel(idx, 'up')}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === editChapterPanels.length - 1}
                          onClick={() => handleMoveEditPanel(idx, 'down')}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <label className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer" title="Replace Scan">
                          <Upload className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleReplaceEditPanelFile(idx, e)}
                            className="hidden"
                          />
                        </label>
                        {editChapterPanels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditPanel(idx)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                            title="Remove Panel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingChapterModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save Live Chapter Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IN-DASHBOARD CHAPTER LIVE READER TEST PREVIEW                    */}
      {/* ========================================================================= */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in select-none">
          {/* Header controls */}
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Live Reader Preview
              </span>
              <span className="text-xs font-bold text-white">
                Chapter {newChapterNumber}: {newChapterTitle || 'Untitled Chapter'} ({chapterPages.length} Pages)
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPreviewReadingMode('webtoon')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    previewReadingMode === 'webtoon' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Vertical Continuous Flow
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReadingMode('page_flip')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    previewReadingMode === 'page_flip' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Horizontal Page Flip
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowLivePreviewModal(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader simulation canvas */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start">
            {previewReadingMode === 'webtoon' ? (
              /* Gapless Seamless Continuous Flow */
              <div className="w-full max-w-2xl flex flex-col items-center gap-0">
                {chapterPages.map((p, idx) => (
                  <div key={p.id} className="w-full relative">
                    <img
                      src={p.imageUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-auto block select-none pointer-events-none"
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/75 text-zinc-300">
                      Page {idx + 1}/{chapterPages.length}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Paginated Flip Mode */
              <div className="flex flex-col items-center justify-center my-auto space-y-4">
                <div className="relative max-w-xl aspect-3/4 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                  <img
                    src={chapterPages[previewPageIdx]?.imageUrl}
                    alt={`Page ${previewPageIdx + 1}`}
                    className="max-h-[75vh] w-auto object-contain block"
                  />
                  <span className="absolute bottom-3 right-3 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/80 text-white border border-white/10">
                    {previewPageIdx + 1} / {chapterPages.length}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={previewPageIdx === 0}
                    onClick={() => setPreviewPageIdx(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Page</span>
                  </button>

                  <span className="text-xs font-mono text-zinc-400">
                    Page {previewPageIdx + 1} of {chapterPages.length}
                  </span>

                  <button
                    type="button"
                    disabled={previewPageIdx === chapterPages.length - 1}
                    onClick={() => setPreviewPageIdx(prev => Math.min(chapterPages.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Page</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

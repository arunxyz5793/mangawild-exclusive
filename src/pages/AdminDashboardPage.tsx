import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Star,
  Users,
  CreditCard,
  Layers,
  Sparkles,
  Search,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Flag,
  Trash2,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Clock,
  BookOpen,
  ArrowRight,
  X,
  FileText,
  AlertCircle,
  Download,
  Smartphone,
  Terminal,
  Copy,
  ExternalLink,
  Package,
  RotateCcw,
  Plus,
  Edit3,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { MangaSeries, Chapter, ChapterPanel, SeriesReview, PaymentRecord, CreatorProfile, MangaGenre, ModerationStatus } from '../types/manga';
import { User, UserRole } from '../types/auth';
import { AuthModal } from '../components/AuthModal';
import { getAvatarUrl, readImageFileAsDataUrl } from '../utils/avatar';

interface AdminDashboardPageProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onPreviewChapter: (seriesId: string, chapterId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
  onPreviewChapter,
}) => {
  const { user, canAccessAdmin, switchUserRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'moderation' | 'reviews' | 'catalog' | 'creators' | 'users' | 'analytics' | 'export'>('moderation');

  // Live data from StorageService
  const [seriesList, setSeriesList] = useState<MangaSeries[]>(() => StorageService.getSeries());
  const [chaptersList, setChaptersList] = useState<Chapter[]>(() => StorageService.getChapters());
  const [reviewsList, setReviewsList] = useState<SeriesReview[]>(() => StorageService.getReviews());
  const [creatorsList, setCreatorsList] = useState<CreatorProfile[]>(() => StorageService.getCreators());
  const [usersList, setUsersList] = useState<User[]>(() => StorageService.getUsers());
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>(() => StorageService.getPayments());

  // Review & Flag Moderation Filters & State
  const [reviewFilter, setReviewFilter] = useState<'all' | 'flagged' | 'approved' | 'hidden'>('all');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [expandedReviewFlags, setExpandedReviewFlags] = useState<Record<string, boolean>>({});
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspection Modal States
  const [inspectingSeries, setInspectingSeries] = useState<MangaSeries | null>(null);
  const [inspectingChapter, setInspectingChapter] = useState<{ chapter: Chapter; series?: MangaSeries } | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState<'series' | 'chapter' | null>(null);

  // Admin Full Catalog & Chapter Studio States
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [editingSeries, setEditingSeries] = useState<MangaSeries | null>(null);
  const [seriesForm, setSeriesForm] = useState<{
    title: string;
    author: string;
    synopsis: string;
    genres: string;
    status: 'ongoing' | 'completed' | 'hiatus';
    readingFormat: 'webtoon_vertical' | 'manga_horizontal';
    isExclusive: boolean;
    coverUrl: string;
    moderationStatus: ModerationStatus;
  }>({
    title: '',
    author: '',
    synopsis: '',
    genres: 'Action, Fantasy',
    status: 'ongoing',
    readingFormat: 'webtoon_vertical',
    isExclusive: false,
    coverUrl: '',
    moderationStatus: 'approved',
  });

  const [managingChaptersSeries, setManagingChaptersSeries] = useState<MangaSeries | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [chapterForm, setChapterForm] = useState<{
    chapterNumber: number;
    title: string;
    isExclusiveVIP: boolean;
    panels: ChapterPanel[];
  }>({
    chapterNumber: 1,
    title: '',
    isExclusiveVIP: false,
    panels: [],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    setSeriesList(StorageService.getSeries());
    setChaptersList(StorageService.getChapters());
    setReviewsList(StorageService.getReviews());
    setCreatorsList(StorageService.getCreators());
    setUsersList(StorageService.getUsers());
    setPaymentsList(StorageService.getPayments());
  };

  // Admin Series CRUD Handlers
  const openCreateSeriesModal = () => {
    setSeriesForm({
      title: '',
      author: user?.name || 'Admin',
      synopsis: '',
      genres: 'Action, Fantasy',
      status: 'ongoing',
      readingFormat: 'webtoon_vertical',
      isExclusive: false,
      coverUrl: '',
      moderationStatus: 'approved',
    });
    setIsCreatingSeries(true);
  };

  const openEditSeriesModal = (s: MangaSeries) => {
    setEditingSeries(s);
    setSeriesForm({
      title: s.title,
      author: s.author,
      synopsis: s.synopsis || '',
      genres: (s.genres || []).join(', '),
      status: s.status || 'ongoing',
      readingFormat: s.readingFormat || 'webtoon_vertical',
      isExclusive: Boolean(s.isExclusive),
      coverUrl: s.coverUrl || '',
      moderationStatus: s.moderationStatus || 'approved',
    });
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setSeriesForm(prev => ({ ...prev, coverUrl: dataUrl }));
      showToast('Cover image loaded from device');
    } catch {
      showToast('Failed to read cover image file');
    }
  };

  const handleSaveAdminSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) {
      showToast('Please enter a series title');
      return;
    }
    const parsedGenres = seriesForm.genres
      .split(',')
      .map(g => g.trim())
      .filter(Boolean) as MangaGenre[];

    if (editingSeries) {
      StorageService.updateSeries(editingSeries.id, {
        title: seriesForm.title.trim(),
        author: seriesForm.author.trim() || editingSeries.author,
        artist: seriesForm.author.trim() || editingSeries.artist,
        synopsis: seriesForm.synopsis.trim(),
        genres: parsedGenres.length > 0 ? parsedGenres : ['Action'],
        status: seriesForm.status,
        readingFormat: seriesForm.readingFormat,
        isExclusive: seriesForm.isExclusive,
        coverUrl: seriesForm.coverUrl || editingSeries.coverUrl,
        moderationStatus: seriesForm.moderationStatus,
        isApprovedByAdmin: seriesForm.moderationStatus === 'approved',
      });
      setEditingSeries(null);
      refreshData();
      showToast(`Updated "${seriesForm.title.trim()}"`);
    } else if (isCreatingSeries) {
      const created = StorageService.createSeries({
        title: seriesForm.title.trim(),
        author: seriesForm.author.trim() || 'MangaWild Official',
        creatorId: user?.id || 'user_admin_01',
        synopsis: seriesForm.synopsis.trim(),
        genres: parsedGenres.length > 0 ? parsedGenres : ['Action'],
        status: seriesForm.status,
        readingFormat: seriesForm.readingFormat,
        isExclusive: seriesForm.isExclusive,
        coverUrl: seriesForm.coverUrl || undefined,
      });
      StorageService.updateSeries(created.id, {
        moderationStatus: 'approved',
        isApprovedByAdmin: true,
        status: seriesForm.status,
      });
      setIsCreatingSeries(false);
      refreshData();
      showToast(`Created & published "${created.title}"`);
    }
  };

  const handleAdminDeleteSeries = (s: MangaSeries) => {
    StorageService.deleteSeries(s.id);
    // Also clean up chapters for this series
    const seriesChapters = StorageService.getChapters(s.id);
    seriesChapters.forEach(ch => StorageService.deleteChapter(ch.id));
    refreshData();
    showToast(`Deleted series "${s.title}"`);
  };

  const handleToggleSeriesExclusive = (s: MangaSeries) => {
    StorageService.updateSeries(s.id, { isExclusive: !s.isExclusive });
    refreshData();
    showToast(`"${s.title}" marked as ${!s.isExclusive ? 'Exclusive' : 'Free'}`);
  };

  // Admin Chapter & Panel Management Handlers
  const openManageChaptersModal = (s: MangaSeries) => {
    setManagingChaptersSeries(s);
    setEditingChapter(null);
    setIsCreatingChapter(false);
  };

  const startCreateAdminChapter = (s: MangaSeries) => {
    const existing = StorageService.getChapters(s.id);
    const nextNum = existing.length > 0 ? Math.max(...existing.map(c => c.chapterNumber)) + 1 : 1;
    setEditingChapter(null);
    setIsCreatingChapter(true);
    setChapterForm({
      chapterNumber: nextNum,
      title: `Episode ${nextNum}`,
      isExclusiveVIP: Boolean(s.isExclusive),
      panels: [],
    });
  };

  const startEditAdminChapter = (ch: Chapter) => {
    setIsCreatingChapter(false);
    setEditingChapter(ch);
    setChapterForm({
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      isExclusiveVIP: Boolean(ch.isExclusiveVIP || ch.monetizationType === 'vip'),
      panels: [...(ch.panels || [])],
    });
  };

  const handleUploadChapterPanelsFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const newPanels: ChapterPanel[] = [];
      let startIdx = chapterForm.panels.length + 1;
      for (const file of files) {
        const dataUrl = await readImageFileAsDataUrl(file);
        newPanels.push({
          id: `panel_${Date.now()}_${startIdx}_${Math.random().toString(36).slice(2, 6)}`,
          panelNumber: startIdx,
          imageUrl: dataUrl,
          caption: '',
        });
        startIdx++;
      }
      setChapterForm(prev => ({
        ...prev,
        panels: [...prev.panels, ...newPanels].map((p, i) => ({ ...p, panelNumber: i + 1 })),
      }));
      showToast(`Added ${newPanels.length} panel(s) from device`);
    } catch {
      showToast('Failed to read one or more panel image files');
    }
    e.target.value = '';
  };

  const handleReplaceSinglePanelFromDevice = async (panelIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setChapterForm(prev => {
        const copy = [...prev.panels];
        if (copy[panelIndex]) {
          copy[panelIndex] = { ...copy[panelIndex], imageUrl: dataUrl };
        }
        return { ...prev, panels: copy };
      });
      showToast(`Replaced Page #${panelIndex + 1}`);
    } catch {
      showToast('Failed to replace panel image');
    }
    e.target.value = '';
  };

  const handleMoveAdminPanel = (index: number, direction: 'up' | 'down') => {
    setChapterForm(prev => {
      const copy = [...prev.panels];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return {
        ...prev,
        panels: copy.map((p, idx) => ({ ...p, panelNumber: idx + 1 })),
      };
    });
  };

  const handleRemoveAdminPanel = (index: number) => {
    setChapterForm(prev => ({
      ...prev,
      panels: prev.panels
        .filter((_, idx) => idx !== index)
        .map((p, idx) => ({ ...p, panelNumber: idx + 1 })),
    }));
  };

  const handleSaveAdminChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingChaptersSeries) return;
    if (!chapterForm.title.trim()) {
      showToast('Please enter a chapter title');
      return;
    }
    if (chapterForm.panels.length === 0) {
      showToast('Please upload at least 1 manga panel page from your device');
      return;
    }

    if (editingChapter) {
      StorageService.updateChapter(editingChapter.id, {
        chapterNumber: Number(chapterForm.chapterNumber) || editingChapter.chapterNumber,
        title: chapterForm.title.trim(),
        isExclusiveVIP: chapterForm.isExclusiveVIP,
        monetizationType: chapterForm.isExclusiveVIP ? 'vip' : 'free',
        panels: chapterForm.panels,
        moderationStatus: 'approved',
      });
      setEditingChapter(null);
      refreshData();
      showToast(`Updated Chapter ${chapterForm.chapterNumber}`);
    } else if (isCreatingChapter) {
      const created = StorageService.createChapter({
        seriesId: managingChaptersSeries.id,
        chapterNumber: Number(chapterForm.chapterNumber) || 1,
        title: chapterForm.title.trim(),
        isExclusiveVIP: chapterForm.isExclusiveVIP,
        monetizationType: chapterForm.isExclusiveVIP ? 'vip' : 'free',
        panels: chapterForm.panels,
      });
      StorageService.updateChapter(created.id, { moderationStatus: 'approved' });
      setIsCreatingChapter(false);
      refreshData();
      showToast(`Published Chapter ${created.chapterNumber}`);
    }
  };

  const handleDeleteAdminChapter = (ch: Chapter) => {
    StorageService.deleteChapter(ch.id);
    if (editingChapter?.id === ch.id) {
      setEditingChapter(null);
    }
    refreshData();
    showToast(`Deleted Chapter ${ch.chapterNumber}`);
  };

  // Series Approval / Rejection Handlers
  const handleApproveSeries = (seriesId: string) => {
    const s = seriesList.find(item => item.id === seriesId);
    StorageService.updateSeries(seriesId, {
      moderationStatus: 'approved',
      isApprovedByAdmin: true,
      reviewerNotes: 'Approved by MangaWild Chief Editorial Board. Live on platform.',
    });

    // Notify creator
    if (s) {
      StorageService.addNotification({
        id: `notif_${Date.now()}`,
        userId: s.creatorId,
        title: 'Manga Series Approved!',
        message: `Congratulations! Your manga series "${s.title}" has been approved and is now live for all readers on MangaWild!`,
        type: 'moderation',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/series/${s.slug}`,
      });
    }

    refreshData();
    setInspectingSeries(null);
    showToast(`Series "${s?.title}" approved and published live to catalog!`);
  };

  const handleRejectSeries = (seriesId: string) => {
    const s = seriesList.find(item => item.id === seriesId);
    StorageService.updateSeries(seriesId, {
      moderationStatus: 'rejected',
      reviewerNotes: rejectionFeedback.trim() || 'Submission requires revisions to meet quality guidelines.',
    });

    if (s) {
      StorageService.addNotification({
        id: `notif_${Date.now()}`,
        userId: s.creatorId,
        title: 'Manga Needs Revision',
        message: `Your series "${s.title}" needs revisions: ${rejectionFeedback.trim() || 'Please check editorial feedback.'}`,
        type: 'moderation',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/creator',
      });
    }

    refreshData();
    setShowRejectPrompt(null);
    setInspectingSeries(null);
    setRejectionFeedback('');
    showToast(`Series "${s?.title}" marked for revision.`);
  };

  // Chapter Approval / Rejection Handlers
  const handleApproveChapter = (chapterId: string) => {
    const ch = chaptersList.find(c => c.id === chapterId);
    const s = seriesList.find(item => item.id === ch?.seriesId);

    StorageService.updateChapter(chapterId, {
      moderationStatus: 'approved',
      reviewerNotes: 'Approved by Editorial Board.',
    });

    if (s) {
      StorageService.addNotification({
        id: `notif_${Date.now()}`,
        userId: s.creatorId,
        title: 'Chapter Approved!',
        message: `Chapter ${ch?.chapterNumber} of "${s.title}" has been approved and is now readable by users!`,
        type: 'chapter',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/series/${s.slug}`,
      });
    }

    refreshData();
    setInspectingChapter(null);
    showToast(`Chapter ${ch?.chapterNumber} approved!`);
  };

  const handleRejectChapter = (chapterId: string) => {
    const ch = chaptersList.find(c => c.id === chapterId);
    const s = seriesList.find(item => item.id === ch?.seriesId);

    StorageService.updateChapter(chapterId, {
      moderationStatus: 'rejected',
      reviewerNotes: rejectionFeedback.trim() || 'Panels require reformatting or correction.',
    });

    if (s) {
      StorageService.addNotification({
        id: `notif_${Date.now()}`,
        userId: s.creatorId,
        title: 'Chapter Revision Required',
        message: `Chapter ${ch?.chapterNumber} of "${s.title}" requires revisions: ${rejectionFeedback.trim() || 'Check panel order and resolution.'}`,
        type: 'chapter',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/creator',
      });
    }

    refreshData();
    setShowRejectPrompt(null);
    setInspectingChapter(null);
    setRejectionFeedback('');
    showToast(`Chapter ${ch?.chapterNumber} marked for revision.`);
  };

  // Toggle Trending Rank
  const handleSetTrendingRank = (seriesId: string, rank?: number) => {
    StorageService.updateSeries(seriesId, {
      isTrending: !!rank,
      rankNumber: rank,
    });
    refreshData();
    showToast(rank ? `Assigned Trending rank #${rank}` : 'Removed from Trending leaderboard');
  };

  // Review Moderation Handlers
  const handleToggleReviewFlag = (reviewId: string) => {
    StorageService.toggleReviewFlagStatus(reviewId, user.name);
    refreshData();
    showToast('Review flag status toggled');
  };

  const handleDismissFlag = (reviewId: string) => {
    StorageService.unflagReview(reviewId, user.name);
    refreshData();
    showToast('Flag dismissed and review approved');
  };

  const handleConfirmFlagAndHide = (reviewId: string) => {
    StorageService.updateReviewStatus(reviewId, 'hidden', 'Confirmed policy violation by Administrator', user.name);
    refreshData();
    showToast('Review marked as hidden from public view');
  };

  const handleDeleteReview = (reviewId: string) => {
    StorageService.deleteReview(reviewId);
    refreshData();
    showToast('Review permanently removed');
  };

  const handleToggleFlagInspection = (reviewId: string) => {
    setExpandedReviewFlags(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Toggle Creator Verified Status
  const handleToggleCreatorVerified = (creatorId: string, current: boolean) => {
    StorageService.updateCreatorProfile(creatorId, { verified: !current });
    refreshData();
    showToast(!current ? 'Creator verified successfully' : 'Verification badge removed');
  };

  // Change User Role
  const handleChangeUserRole = (targetUserId: string, newRole: UserRole) => {
    if (targetUserId === 'user_admin_01' && newRole !== 'admin') {
      showToast('Primary system administrator role cannot be demoted');
      return;
    }
    if (newRole === 'admin' && targetUserId !== 'user_admin_01') {
      showToast('Administrator privileges are strictly restricted to the official system admin');
      return;
    }
    StorageService.updateUser(targetUserId, { role: newRole });
    refreshData();
    showToast(`User role updated to ${newRole}`);
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviewsList.filter(r => {
      const matchesSearch =
        r.reviewTitle.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        r.seriesTitle.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        r.userName.toLowerCase().includes(reviewSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (reviewFilter === 'flagged') return r.isFlagged || r.status === 'flagged';
      if (reviewFilter === 'approved') return r.status === 'approved' && !r.isFlagged;
      if (reviewFilter === 'hidden') return r.status === 'hidden';
      return true;
    });
  }, [reviewsList, reviewSearchQuery, reviewFilter]);

  const pendingSeries = seriesList.filter(s => s.moderationStatus === 'pending_review');
  const pendingChapters = chaptersList.filter(c => c.moderationStatus === 'pending_review');
  const flaggedCount = reviewsList.filter(r => r.isFlagged || r.status === 'flagged').length;
  const totalPendingModeration = pendingSeries.length + pendingChapters.length;

  // Role Gate
  if (!canAccessAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-white shadow-xl">
          <Shield className="w-8 h-8 text-zinc-200" />
        </div>
        <h1 className="text-2xl font-black text-white">Administrator Access Required</h1>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
          The MangaWild Editorial Suite is restricted to verified administrators and content moderators. Please sign in with your administrator credentials.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setIsAdminAuthModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-zinc-400" />
            <span>Admin Sign In</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium text-xs transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>

        <AuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          defaultRole="admin"
          defaultMode="signin"
          customTitle="Administrator Sign In"
          customSubtitle="Enter the official MangaWild administrator credentials to access the Editorial Suite."
          onSuccess={() => {
            setIsAdminAuthModalOpen(false);
            refreshData();
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#000000] text-[#fafafa]' : 'bg-[#ffffff] text-[#09090b]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 select-none">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-700 dark:border-zinc-300 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in font-mono">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500">Suite</span>
              <span className="text-zinc-600">/</span>
              <span className="font-bold uppercase tracking-wider text-zinc-200">
                Administrator & Editorial Desk
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              MangaWild Editorial Approval Suite
            </h1>
            <p className="text-xs text-zinc-400">
              Admin approval desk for original manga submissions, multi-page scan verification, review flags, and creator royalties.
            </p>
          </div>

          {/* Theme Switcher & Admin Badge */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin: {user.username ? `@${user.username}` : user.name || 'Editorial Board'}</span>
            </span>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div
          className={`flex items-center gap-1.5 p-1.5 rounded-2xl overflow-x-auto border ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}
        >
          {[
            { id: 'moderation', label: 'Approvals', count: totalPendingModeration },
            { id: 'reviews', label: 'Reviews', count: flaggedCount },
            { id: 'catalog', label: 'Catalog' },
            { id: 'creators', label: 'Creators' },
            { id: 'users', label: 'Users' },
            { id: 'analytics', label: 'Financials' },
            { id: 'export', label: 'Export' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-zinc-950 text-[10px] flex items-center justify-center font-mono font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: APPROVAL DESK (MANGA SERIES & CHAPTER PAGES) */}
        {activeTab === 'moderation' && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Pending Series Approvals</span>
                <p className="text-2xl font-black mt-1 text-white">{pendingSeries.length}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Awaiting editorial review</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Pending Chapter Scans</span>
                <p className="text-2xl font-black mt-1 text-white">{pendingChapters.length}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Multi-page submissions</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Total Approved Manga</span>
                <p className="text-2xl font-black mt-1 text-white font-medium">
                  {seriesList.filter(s => s.moderationStatus === 'approved').length}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Live on public website</p>
              </div>
            </div>

            {/* SECTION 1: MANGA SERIES APPROVAL QUEUE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                    <span>Manga Series Submissions</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {pendingSeries.length} pending
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Verify title, categories, description, and hero cover image before approving to live catalog.
                  </p>
                </div>
              </div>

              {pendingSeries.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20">
                  <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">
                    All submitted manga series have been reviewed! No pending series in queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSeries.map(s => {
                    const creator = creatorsList.find(c => c.id === s.creatorId);
                    return (
                      <div
                        key={s.id}
                        className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row gap-5 items-start justify-between"
                      >
                        <div className="flex gap-4">
                          <img
                            src={s.coverUrl}
                            alt={s.title}
                            className="w-20 h-28 object-cover rounded-xl bg-zinc-800 border border-zinc-700 shrink-0 shadow-md"
                          />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Pending Approval
                              </span>
                              {s.isExclusive && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                  VIP Exclusive
                                </span>
                              )}
                              <span className="text-[11px] text-zinc-400 font-mono">
                                Creator: <strong className="text-white">{s.author}</strong> ({creator?.handle || '@creator'})
                              </span>
                            </div>

                            <h3 className="text-base font-black text-white">{s.title}</h3>
                            <p className="text-xs text-zinc-300 max-w-2xl line-clamp-2 leading-relaxed">
                              {s.synopsis}
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {s.genres.map(g => (
                                <span
                                  key={g}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex md:flex-col items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                          <button
                            onClick={() => setInspectingSeries(s)}
                            className="px-3.5 py-1.5 rounded-xl border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => handleApproveSeries(s.id)}
                            className="px-4 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </button>

                          <button
                            onClick={() => {
                              setInspectingSeries(s);
                              setShowRejectPrompt('series');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: CHAPTER PAGES APPROVAL QUEUE */}
            <div className="space-y-4 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                    <span>Chapter Pages Submissions</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {pendingChapters.length} pending
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Review numbered manga panels (Page 1, 2, 3...) for sequencing, artwork, and readability.
                  </p>
                </div>
              </div>

              {pendingChapters.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">
                    All chapter pages have been moderated!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChapters.map(ch => {
                    const s = seriesList.find(item => item.id === ch.seriesId);
                    return (
                      <div
                        key={ch.id}
                        className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">
                              {s?.title || 'Series'} • Chapter {ch.chapterNumber}: {ch.title}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold uppercase">
                              Pending Review
                            </span>
                            {ch.isExclusiveVIP && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">
                            {ch.panels?.length || 0} Pages submitted • Creator: {s?.author || 'Mangaka'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setInspectingChapter({ chapter: ch, series: s })}
                            className="px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Pages ({ch.panels?.length || 0})</span>
                          </button>

                          <button
                            onClick={() => handleApproveChapter(ch.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => {
                              setInspectingChapter({ chapter: ch, series: s });
                              setShowRejectPrompt('chapter');
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-red-900/60 text-red-400 text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: ALL TRACKED CHAPTERS DIRECTORY */}
            <div className="space-y-4 pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-400">
                All Platform Chapters Directory ({chaptersList.length})
              </h3>
              <div
                className={`rounded-2xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className={`border-b font-mono uppercase ${
                      theme === 'dark' ? 'border-zinc-800 bg-zinc-950 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <tr>
                      <th className="py-3 px-4">Series & Chapter</th>
                      <th className="py-3 px-4">Pages</th>
                      <th className="py-3 px-4">Access Tier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {chaptersList.map(ch => {
                      const s = seriesList.find(item => item.id === ch.seriesId);
                      return (
                        <tr
                          key={ch.id}
                          className={`transition-colors ${
                            theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <p className="font-bold">{s?.title || 'Unknown Series'}</p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Chapter {ch.chapterNumber}: {ch.title}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-mono">{ch.panels?.length || 0} pages</td>
                          <td className="py-3 px-4">
                            {ch.isExclusiveVIP ? (
                              <span className="font-bold font-mono text-[10px] uppercase text-zinc-200">
                                VIP Only
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-mono text-[10px] uppercase">Free</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                ch.moderationStatus === 'approved'
                                  ? 'bg-zinc-800 text-zinc-200'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              {ch.moderationStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => onPreviewChapter(ch.seriesId, ch.id)}
                              className="px-2.5 py-1 bg-zinc-800 text-white rounded-lg text-[11px] font-semibold hover:bg-zinc-700 cursor-pointer"
                            >
                              Preview
                            </button>
                            {ch.moderationStatus !== 'approved' && (
                              <button
                                onClick={() => handleApproveChapter(ch.id)}
                                className="px-2.5 py-1 bg-white text-zinc-950 hover:bg-zinc-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REVIEWS & FLAG MODERATION DESK */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Total Reviews</span>
                <p className="text-2xl font-black font-mono mt-1">{reviewsList.length}</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
                <span className="text-[10px] font-mono uppercase text-zinc-300 font-bold">
                  Flagged Queue
                </span>
                <p className="text-2xl font-black font-mono mt-1 text-white">{flaggedCount}</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Approved Reviews</span>
                <p className="text-2xl font-black font-mono mt-1">
                  {reviewsList.filter(r => r.status === 'approved').length}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Hidden / Violations</span>
                <p className="text-2xl font-black font-mono mt-1 text-zinc-400">
                  {reviewsList.filter(r => r.status === 'hidden').length}
                </p>
              </div>
            </div>

            {/* Reviews list */}
            <div className="space-y-3">
              {filteredReviews.map(review => (
                <div
                  key={review.id}
                  className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{review.userName}</span>
                      <span className="text-[10px] font-mono text-zinc-500">on {review.seriesTitle}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">
                        ★ {review.rating}/5
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200">{review.reviewTitle}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{review.reviewText}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {review.isFlagged ? (
                      <button
                        onClick={() => handleDismissFlag(review.id)}
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs cursor-pointer"
                      >
                        Dismiss Flag
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleReviewFlag(review.id)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs"
                      >
                        Flag
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 rounded-xl text-red-400 hover:bg-zinc-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CATALOG & FULL MANGA STUDIO */}
        {activeTab === 'catalog' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider font-mono">
                  Full Manga Catalog, Chapters &amp; Leaderboard Control
                </h2>
                <p className="text-xs text-zinc-400">
                  Admin full access: create, edit, or delete any manga series, cover artwork, chapters, and pages.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={e => setCatalogSearchQuery(e.target.value)}
                    placeholder="Search title or author..."
                    className="pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>
                <button
                  onClick={openCreateSeriesModal}
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Series</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesList
                .filter(
                  s =>
                    !catalogSearchQuery.trim() ||
                    s.title.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                    s.author.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                )
                .map(s => {
                  const seriesChaptersCount = chaptersList.filter(c => c.seriesId === s.id).length;
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={s.coverUrl}
                          alt={s.title}
                          className="w-16 h-24 object-cover rounded-xl border border-zinc-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-white truncate">{s.title}</p>
                            {s.isExclusive && (
                              <span className="text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded bg-white text-black shrink-0">
                                Exclusive
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">By {s.author}</p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-zinc-800 text-zinc-300">
                              {s.moderationStatus}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {seriesChaptersCount} Ch
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                        <span className="text-zinc-400 font-mono text-[11px]">Trending Rank:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSeriesExclusive(s)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border cursor-pointer transition-colors ${
                              s.isExclusive
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {s.isExclusive ? 'Exclusive' : 'Free'}
                          </button>
                          <select
                            value={s.rankNumber || ''}
                            onChange={e =>
                              handleSetTrendingRank(s.id, e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            className="px-2 py-1 rounded-lg bg-zinc-800 text-white font-mono text-xs"
                          >
                            <option value="">No Rank</option>
                            <option value="1">Rank #1</option>
                            <option value="2">Rank #2</option>
                            <option value="3">Rank #3</option>
                            <option value="4">Rank #4</option>
                            <option value="5">Rank #5</option>
                          </select>
                        </div>
                      </div>

                      {/* Admin Full Edit / Chapters / Delete Controls */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                        <button
                          onClick={() => openEditSeriesModal(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Info</span>
                        </button>
                        <button
                          onClick={() => openManageChaptersModal(s)}
                          className="px-2.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Chapters</span>
                        </button>
                        <button
                          onClick={() => handleAdminDeleteSeries(s)}
                          className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:border-red-500/50 text-red-400 hover:bg-red-950/30 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: CREATORS & PAYOUTS */}
        {activeTab === 'creators' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider font-mono">
              Verified Creators & Royalty Distributions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creatorsList.map(creator => (
                <div key={creator.id} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex gap-4">
                  <img src={getAvatarUrl(creator.avatarUrl)} alt={creator.penName} className="w-16 h-16 rounded-2xl object-cover bg-zinc-800" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">{creator.penName}</p>
                      <button
                        onClick={() => handleToggleCreatorVerified(creator.id, creator.verified)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                          creator.verified
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {creator.verified ? 'Verified ✓' : 'Unverified'}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">{creator.handle}</p>
                    <p className="text-xs text-zinc-300">
                      Earnings: ₹{creator.monthlyEarningsInr.toLocaleString('en-IN')} (70% share)
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">UPI: {creator.upiId || 'Not set'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider font-mono">
              User Directory & Role Assignments
            </h2>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 font-mono uppercase">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {usersList.map((u, idx) => (
                    <tr key={`${u.id}_${idx}`} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">@{u.username || 'user'}</td>
                      <td className="py-3 px-4 text-zinc-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-zinc-800 text-zinc-300">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id === 'user_admin_01' || u.role === 'admin' ? (
                          <span className="text-[11px] font-mono text-zinc-200 font-bold px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg">
                            System Admin (Fixed)
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={e => handleChangeUserRole(u.id, e.target.value as UserRole)}
                            className="px-2 py-1 rounded-lg bg-zinc-800 text-white font-mono text-xs cursor-pointer hover:bg-zinc-700 transition-colors"
                          >
                            <option value="free_user">Free Reader</option>
                            <option value="subscriber">Exclusive Subscriber</option>
                            <option value="creator">Creator</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: FINANCIALS & ANALYTICS */}
        {activeTab === 'analytics' && (() => {
          const allPayments = StorageService.getPayments();
          const allTips = StorageService.getTips();
          const totalSubVolume = allPayments.reduce((sum, p) => sum + (p.amountInr || 0), 0);
          const totalTipVolume = allTips.reduce((sum, t) => sum + (t.amountInr || 0), 0);
          const grossVolume = totalSubVolume + totalTipVolume;
          const creatorRoyalties = Math.round(grossVolume * 0.7);
          const platformNet = grossVolume - creatorRoyalties;

          return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <p className="text-[11px] font-mono text-zinc-400 uppercase">Gross Platform Volume</p>
                <p className="text-3xl font-black text-white mt-1">₹{grossVolume.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Exclusive All-Access Subscriptions &amp; Tips</p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <p className="text-[11px] font-mono text-zinc-400 uppercase">Creator 70% Royalties</p>
                <p className="text-3xl font-black text-white mt-1">₹{creatorRoyalties.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Paid directly to mangakas</p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <p className="text-[11px] font-mono text-zinc-400 uppercase">Platform Net (30%)</p>
                <p className="text-3xl font-black text-white mt-1">₹{platformNet.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Infrastructure &amp; servers</p>
              </div>
            </div>

            {/* Production Launch Readiness & Metrics Clean Slate */}
            <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-950/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white font-bold bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                      Production Ready
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Database Clean Slate
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Public Launch Metrics &amp; Views Control
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed mt-0.5">
                    Before publishing or sharing the platform with real users, ensure that all views, chapter reads, and likes are reset to a clean baseline so organic reader engagement starts at zero.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    StorageService.resetAllViewsAndLikes();
                    setSeriesList(StorageService.getSeries());
                    setChaptersList(StorageService.getChapters());
                    setCreatorsList(StorageService.getCreators());
                    showToast('Success: All series views, chapter reads, likes, and payouts have been reset to 0!');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Reset All Views &amp; Likes to 0</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block uppercase">Total Series in Catalog</span>
                  <span className="text-white font-bold text-sm">{seriesList.length} Series</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block uppercase">Live Chapters</span>
                  <span className="text-white font-bold text-sm">{chaptersList.length} Chapters</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block uppercase">Indexed Creators</span>
                  <span className="text-white font-bold text-sm">{creatorsList.length} Artists</span>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* TAB 7: ANDROID APP & SOURCE KIT */}
        {activeTab === 'export' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Card */}
            <div className="p-6 rounded-3xl border border-zinc-700/60 bg-zinc-900/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    MangaWild Android App & Complete Source Kit
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Download full project files (.ZIP / .tar.gz) or create an Android app with Google AI Studio & Capacitor.
                  </p>
                </div>
              </div>

              {/* Direct Download Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="/mangawild-project.zip"
                  download="mangawild-project.zip"
                  className="px-6 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete Project (.ZIP - 1.1 MB)</span>
                </a>
                <a
                  href="/mangawild-project.tar.gz"
                  download="mangawild-project.tar.gz"
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4 text-zinc-200" />
                  <span>Download .tar.gz Archive</span>
                </a>
              </div>
            </div>

            {/* Methods to build Android App */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method 1: Google AI Studio Android Project */}
              <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <div className="flex items-center gap-2 text-zinc-200 font-mono text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>METHOD 1: Google AI Studio (Native Android)</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Create Native Kotlin / Jetpack Compose App
                </h4>
                <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Open <strong className="text-white">Google AI Studio</strong> and click <strong>"Create New App"</strong>.</li>
                  <li>Choose the <strong className="text-zinc-200">Android (Kotlin / Jetpack Compose)</strong> target template.</li>
                  <li>Copy and paste the ready prompt below into Google AI Studio.</li>
                  <li>Google AI Studio will automatically build the native Android screens, Navigation, and Webtoon viewer.</li>
                </ol>

                <div className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 space-y-2">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>AI Studio Prompt:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`Build a native Android app in Kotlin and Jetpack Compose called MangaWild. It is a high-speed webtoon and manga reader with Hindi and English language support. Features include: 1) Home page with trending, top rated, and genre carousel (Shonen, Seinen, Isekai, Romance). 2) Manga Reader with smooth vertical infinite scroll for webtoon panels and dual-page flip mode. 3) Offline chapter caching using Room database. 4) VIP membership lock for premium chapters. 5) Dark manga aesthetic (OLED black, zinc-900, vivid accents). Connects to Firestore backend.`);
                        showToast('Prompt copied to clipboard!');
                      }}
                      className="text-zinc-200 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Prompt</span>
                    </button>
                  </div>
                  <p className="text-zinc-400 leading-normal line-clamp-3">
                    "Build a native Android app in Kotlin and Jetpack Compose called MangaWild..."
                  </p>
                </div>
              </div>

              {/* Method 2: 1-Click Capacitor Android Build */}
              <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>METHOD 2: Capacitor Android APK (Fastest)</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Convert this React Web App directly to APK
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Extract the downloaded <code>mangawild-project.zip</code> and run these terminal commands:
                </p>

                <div className="p-3 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] text-emerald-400 space-y-1 overflow-x-auto">
                  <p className="text-zinc-500"># 1. Install dependencies & build</p>
                  <p>npm install</p>
                  <p>npm run build</p>
                  <p className="text-zinc-500 pt-1"># 2. Add Capacitor Android platform</p>
                  <p>npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                  <p>npx cap init MangaWild com.mangawild.app --web-dir=dist</p>
                  <p>npx cap add android</p>
                  <p className="text-zinc-500 pt-1"># 3. Open in Android Studio & Generate APK</p>
                  <p>npx cap open android</p>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Android Studio will open automatically, click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK</strong> to generate your <code>app-debug.apk</code>!
                </p>
              </div>
            </div>

            {/* Project Structure Breakdown */}
            <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-200" />
                <span>What's inside the Project ZIP:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/50 border border-zinc-800">
                  <span className="font-mono text-zinc-200 font-bold block">/src/pages</span>
                  <span className="text-[11px] text-zinc-400">HomePage, ReaderPage, SeriesDetailPage, BrowsePage, AdminDashboard</span>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-zinc-800">
                  <span className="font-mono text-zinc-200 font-bold block">/src/components</span>
                  <span className="text-[11px] text-zinc-400">MangaReader, AuthModal, Comments, Reviews, Logo, Header, Footer</span>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-zinc-800">
                  <span className="font-mono text-zinc-200 font-bold block">/src/services</span>
                  <span className="text-[11px] text-zinc-400">StorageService (mock & offline cache), Firebase client</span>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-zinc-800">
                  <span className="font-mono text-zinc-200 font-bold block">Config Files</span>
                  <span className="text-[11px] text-zinc-400">package.json, vite.config.ts, firestore.rules, firebase-blueprint.json</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INSPECTION MODAL: FULL SERIES DETAILS */}
        {inspectingSeries && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-700 bg-[#101014] text-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Editorial Inspection Desk
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">{inspectingSeries.title}</h3>
                </div>
                <button
                  onClick={() => setInspectingSeries(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <img
                  src={inspectingSeries.coverUrl}
                  alt={inspectingSeries.title}
                  className="w-36 h-52 object-cover rounded-2xl border border-zinc-700 shrink-0 shadow-lg"
                />
                <div className="space-y-2 text-xs">
                  {inspectingSeries.titleJapanese && (
                    <p className="text-zinc-400 font-mono">Japanese: {inspectingSeries.titleJapanese}</p>
                  )}
                  <p className="text-zinc-400">Author / Mangaka: <strong className="text-white">{inspectingSeries.author}</strong></p>
                  <p className="text-zinc-300 leading-relaxed text-xs">{inspectingSeries.synopsis}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {inspectingSeries.genres.map(g => (
                      <span key={g} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rejection Feedback Note Form */}
              {showRejectPrompt === 'series' && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 space-y-2">
                  <label className="block text-xs font-bold text-red-200">
                    Reason for Revision / Rejection Note to Creator:
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionFeedback}
                    onChange={e => setRejectionFeedback(e.target.value)}
                    placeholder="e.g. Please upload higher resolution cover artwork and refine the synopsis."
                    className="w-full p-2.5 rounded-xl border border-red-800 bg-black text-white text-xs focus:outline-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowRejectPrompt(null)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectSeries(inspectingSeries.id)}
                      className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setShowRejectPrompt('series')}
                  className="px-4 py-2 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-bold"
                >
                  Send Revision Request
                </button>
                <button
                  onClick={() => handleApproveSeries(inspectingSeries.id)}
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Publish to Catalog</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INSPECTION MODAL: CHAPTER PAGES VIEWER */}
        {inspectingChapter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-3xl rounded-3xl border border-zinc-700 bg-[#101014] text-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Chapter Scan Inspection Desk
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {inspectingChapter.series?.title} • Chapter {inspectingChapter.chapter.chapterNumber}: {inspectingChapter.chapter.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {inspectingChapter.chapter.panels?.length || 0} sequential pages submitted
                  </p>
                </div>
                <button
                  onClick={() => setInspectingChapter(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sequential Pages Grid */}
              <div className="space-y-4">
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Sequential Pages (Page 1 to {inspectingChapter.chapter.panels?.length || 0}):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {inspectingChapter.chapter.panels?.map(panel => (
                    <div
                      key={panel.id}
                      className="p-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2 text-center"
                    >
                      <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-black border border-zinc-700 shadow-inner flex items-center justify-center">
                        <img
                          src={panel.imageUrl}
                          alt={`Page ${panel.panelNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] font-bold text-white font-mono">Page #{panel.panelNumber}</p>
                      {panel.caption && (
                        <p className="text-[10px] text-zinc-400 truncate">{panel.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => handleRejectChapter(inspectingChapter.chapter.id)}
                  className="px-4 py-2 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-bold"
                >
                  Reject Chapter
                </button>
                <button
                  onClick={() => handleApproveChapter(inspectingChapter.chapter.id)}
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Chapter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN CREATE / EDIT SERIES MODAL */}
        {(isCreatingSeries || editingSeries) &&
          typeof document !== 'undefined' &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <form
                onSubmit={handleSaveAdminSeries}
                className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Admin Editorial Override
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {editingSeries ? `Edit Series: ${editingSeries.title}` : 'Create New Manga Series'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSeries(false);
                      setEditingSeries(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cover Upload from Device */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                    {seriesForm.coverUrl ? (
                      <img src={seriesForm.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-bold text-white block">Series Cover Image (Device Upload)</label>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Cover From Device</span>
                      <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                    </label>
                    <p className="text-[10px] text-zinc-400">Select JPG, PNG, or WEBP directly from your device.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Manga Title *</label>
                    <input
                      type="text"
                      required
                      value={seriesForm.title}
                      onChange={e => setSeriesForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                      placeholder="Enter manga title"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Author / Artist *</label>
                    <input
                      type="text"
                      required
                      value={seriesForm.author}
                      onChange={e => setSeriesForm(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                      placeholder="Creator pen name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Synopsis</label>
                  <textarea
                    rows={3}
                    value={seriesForm.synopsis}
                    onChange={e => setSeriesForm(prev => ({ ...prev, synopsis: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                    placeholder="Story description..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Genres (comma sep)</label>
                    <input
                      type="text"
                      value={seriesForm.genres}
                      onChange={e => setSeriesForm(prev => ({ ...prev, genres: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                      placeholder="Action, Horror"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Status</label>
                    <select
                      value={seriesForm.status}
                      onChange={e =>
                        setSeriesForm(prev => ({
                          ...prev,
                          status: e.target.value as 'ongoing' | 'completed' | 'hiatus',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="hiatus">Hiatus</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Access Tier</label>
                    <button
                      type="button"
                      onClick={() => setSeriesForm(prev => ({ ...prev, isExclusive: !prev.isExclusive }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        seriesForm.isExclusive
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {seriesForm.isExclusive ? 'Exclusive Series' : 'Free Series'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSeries(false);
                      setEditingSeries(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black cursor-pointer"
                  >
                    {editingSeries ? 'Save Changes' : 'Publish Series'}
                  </button>
                </div>
              </form>
            </div>,
            document.body
          )}

        {/* ADMIN MANAGE CHAPTERS & PANELS MODAL */}
        {managingChaptersSeries &&
          typeof document !== 'undefined' &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <div className="w-full max-w-3xl rounded-3xl border border-zinc-700 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Admin Chapter &amp; Panel Studio
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {managingChaptersSeries.title} — Chapters
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCreatingChapter && !editingChapter && (
                      <button
                        type="button"
                        onClick={() => startCreateAdminChapter(managingChaptersSeries)}
                        className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chapter</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setManagingChaptersSeries(null);
                        setEditingChapter(null);
                        setIsCreatingChapter(false);
                      }}
                      className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {isCreatingChapter || editingChapter ? (
                  <form onSubmit={handleSaveAdminChapter} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                          Chapter Number *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={chapterForm.chapterNumber}
                          onChange={e =>
                            setChapterForm(prev => ({ ...prev, chapterNumber: parseInt(e.target.value) || 1 }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                          Chapter Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={chapterForm.title}
                          onChange={e => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Access</label>
                        <button
                          type="button"
                          onClick={() => setChapterForm(prev => ({ ...prev, isExclusiveVIP: !prev.isExclusiveVIP }))}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            chapterForm.isExclusiveVIP
                              ? 'bg-white text-black border-white'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {chapterForm.isExclusiveVIP ? 'Exclusive Chapter' : 'Free Chapter'}
                        </button>
                      </div>
                    </div>

                    {/* Upload Panels from Device */}
                    <div className="p-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-white">
                          Chapter Pages ({chapterForm.panels.length} uploaded)
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Upload one or multiple sequential manga pages directly from your device.
                        </p>
                      </div>
                      <label className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Pages From Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleUploadChapterPanelsFromDevice}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {chapterForm.panels.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                        {chapterForm.panels.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 space-y-2"
                          >
                            <div className="aspect-3/4 rounded-lg overflow-hidden bg-black border border-zinc-800">
                              <img src={p.imageUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                              <span>Page #{idx + 1}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveAdminPanel(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveAdminPanel(idx, 'down')}
                                  disabled={idx === chapterForm.panels.length - 1}
                                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <label className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer" title="Replace Page">
                                  <Upload className="w-3 h-3" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleReplaceSinglePanelFromDevice(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdminPanel(idx)}
                                  className="p-1 rounded bg-zinc-800 hover:bg-red-950 text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChapter(null);
                          setIsCreatingChapter(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
                      >
                        Back to Chapters
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black cursor-pointer"
                      >
                        {editingChapter ? 'Save Chapter Changes' : 'Publish Chapter'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2.5">
                    {chaptersList.filter(c => c.seriesId === managingChaptersSeries.id).length === 0 ? (
                      <p className="text-xs text-zinc-400 py-8 text-center">
                        No chapters found for this series. Click &ldquo;Add Chapter&rdquo; to upload pages.
                      </p>
                    ) : (
                      chaptersList
                        .filter(c => c.seriesId === managingChaptersSeries.id)
                        .map(ch => (
                          <div
                            key={ch.id}
                            className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  Chapter {ch.chapterNumber}: {ch.title}
                                </span>
                                {(ch.isExclusiveVIP || ch.monetizationType === 'vip') && (
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white text-black font-black">
                                    Exclusive
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 font-mono">
                                {ch.panels?.length || 0} pages • Released {ch.releaseDate}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditAdminChapter(ch)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Pages</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminChapter(ch)}
                                className="p-2 rounded-xl border border-zinc-800 hover:border-red-500/50 text-red-400 hover:bg-red-950/30 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

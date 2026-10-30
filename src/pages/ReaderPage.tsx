import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Sliders,
  CheckCircle,
  CheckCircle2,
  List,
  X,
  Search,
  MessageSquare,
  Lock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Volume2,
  Cloud,
  Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StorageService } from '../services/storage';
import { Chapter, MangaSeries } from '../types/manga';
import { MangaWildLogo } from '../components/MangaWildLogo';
import { MangaCommentsSection } from '../components/MangaCommentsSection';
import { BlurUpMangaImage } from '../components/BlurUpMangaImage';
import { CreatorTipJar } from '../components/CreatorTipJar';

interface ReaderPageProps {
  seriesId: string;
  chapterId: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenVIPModal?: () => void;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({
  seriesId,
  chapterId,
  onNavigate,
  onOpenVIPModal,
}) => {
  const { user, isVIP, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [series, setSeries] = useState<MangaSeries | undefined>(() =>
    StorageService.getSeriesById(seriesId)
  );
  const [chapters, setChapters] = useState<Chapter[]>(() =>
    StorageService.getChapters(seriesId)
  );
  const [currentChapter, setCurrentChapter] = useState<Chapter | undefined>(() =>
    StorageService.getChapterById(chapterId)
  );

  // Reader Settings - defaults to creator's format preference
  const [readingMode, setReadingMode] = useState<'webtoon' | 'page_flip'>(() => {
    const s = StorageService.getSeriesById(seriesId);
    return s?.readingFormat === 'manga_horizontal' ? 'page_flip' : 'webtoon';
  });
  const [fitMode, setFitMode] = useState<'width' | 'screen'>('width');
  const [brightness, setBrightness] = useState<number>(100);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activePanelIndex, setActivePanelIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState<boolean>(false);
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [tipToast, setTipToast] = useState<string | null>(null);
  const [refreshTipsKey, setRefreshTipsKey] = useState<number>(0);

  // Reading Progress & Firestore Database Cloud Sync States
  const [readingProgress, setReadingProgress] = useState<number>(1);
  const [isSavingProgress, setIsSavingProgress] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cross-device resume notification state
  const [crossDevicePrompt, setCrossDevicePrompt] = useState<{
    show: boolean;
    chapterId: string;
    chapterNumber: number;
    scrollPosition?: number;
    scrollPercent?: number;
    panelIndex?: number;
    isDifferentChapter: boolean;
  } | null>(null);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 250));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handleSendTip = (coins: number) => {
    setRefreshTipsKey(k => k + 1);
    setTipToast(`Tipped +${coins} coins to ${series?.author || 'the mangaka'}! Thank you for supporting indie creators!`);
    setTimeout(() => setTipToast(null), 3500);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if props change, restore prior progress, and initialize tracking
  useEffect(() => {
    const s = StorageService.getSeriesById(seriesId);
    const chs = StorageService.getChapters(seriesId);
    const curCh = StorageService.getChapterById(chapterId) || chs[0];

    setSeries(s);
    setChapters(chs);
    setCurrentChapter(curCh);

    if (s?.readingFormat) {
      setReadingMode(s.readingFormat === 'manga_horizontal' ? 'page_flip' : 'webtoon');
    }

    if (curCh && s) {
      StorageService.incrementChapterViews(curCh.id, s.id);

      // Check existing reading progress for this series
      const historyList = StorageService.getReadingHistory(user.id);
      const localProgress = historyList.find(h => h.seriesId === s.id);
      let initialPanel = 0;

      // If user previously read this chapter, resume from their last panel
      if (
        localProgress &&
        localProgress.chapterId === curCh.id &&
        localProgress.panelIndex > 1
      ) {
        initialPanel = Math.min(curCh.panels.length - 1, localProgress.panelIndex - 1);
      }
      setActivePanelIndex(initialPanel);

      const totalPanels = curCh.panels.length || 1;
      const initialPercent = Math.max(1, Math.round(((initialPanel + 1) / totalPanels) * 100));
      setReadingProgress(initialPercent);
      setIsCloudSynced(true);

      // Save initial progress to local storage
      StorageService.saveReadingProgress(user.id, {
        seriesId: s.id,
        chapterId: curCh.id,
        chapterNumber: curCh.chapterNumber,
        panelIndex: initialPanel + 1,
        totalPanels,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [seriesId, chapterId, user.id]);

  // Webtoon Continuous Scroll Reading Progress Tracking
  useEffect(() => {
    if (readingMode !== 'webtoon' || !currentChapter || !series) return;

    const computeWebtoonScroll = () => {
      const el = containerRef.current;
      let scrollTop = window.scrollY;
      let scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (el && isFullscreen) {
        scrollTop = el.scrollTop;
        scrollHeight = el.scrollHeight - el.clientHeight;
      }

      if (scrollHeight <= 0) {
        setReadingProgress(100);
        return;
      }

      const ratio = Math.min(1, Math.max(0, scrollTop / scrollHeight));
      const pct = Math.min(100, Math.max(1, Math.round(ratio * 100)));
      const totalPanels = currentChapter.panels.length;
      const currentPanel = Math.min(totalPanels, Math.max(1, Math.ceil(ratio * totalPanels)));
      const isCompleted = pct >= 92;

      setReadingProgress(pct);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        StorageService.saveReadingProgress(user.id, {
          seriesId: series.id,
          chapterId: currentChapter.id,
          chapterNumber: currentChapter.chapterNumber,
          panelIndex: currentPanel,
          totalPanels,
          updatedAt: new Date().toISOString(),
        });
      }, 500);
    };

    window.addEventListener('scroll', computeWebtoonScroll, { passive: true });
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', computeWebtoonScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', computeWebtoonScroll);
      if (el) {
        el.removeEventListener('scroll', computeWebtoonScroll);
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [readingMode, currentChapter, series, user.id, isFullscreen]);

  // Page Flip Mode Reading Progress Tracking
  useEffect(() => {
    if (readingMode !== 'page_flip' || !currentChapter || !series) return;
    const totalPanels = currentChapter.panels.length;
    if (totalPanels === 0) return;

    const panelNum = Math.min(totalPanels, activePanelIndex + 1);
    const pct = Math.min(100, Math.round((panelNum / totalPanels) * 100));
    const isCompleted = activePanelIndex >= totalPanels || pct >= 95;

    setReadingProgress(pct);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      StorageService.saveReadingProgress(user.id, {
        seriesId: series.id,
        chapterId: currentChapter.id,
        chapterNumber: currentChapter.chapterNumber,
        panelIndex: panelNum,
        totalPanels,
        updatedAt: new Date().toISOString(),
      });
    }, 450);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activePanelIndex, readingMode, currentChapter, series, user.id]);

  if (!series || !currentChapter) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Chapter not found</h2>
          <button
            onClick={() => onNavigate('series', { id: seriesId })}
            className="px-4 py-2 bg-white text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
          >
            Back to Series
          </button>
        </div>
      </div>
    );
  }

  const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const isCreatorOfSeries = series && (
    series.creatorId === user.creatorProfileId ||
    series.creatorId === `creator_${user.id}` ||
    series.author.toLowerCase() === user.name.toLowerCase()
  );
  // VIP Subscribers, creators, and admins have unrestricted full access to all chapters
  const hasFullAccess = Boolean(isVIP || user.isVIP || user.subscription?.status === 'active' || user.role === 'admin' || user.role === 'subscriber' || isCreatorOfSeries);
  const isSeriesExclusive = Boolean(series?.isExclusive);
  const isChapterVIP = Boolean(isSeriesExclusive || currentChapter?.isExclusiveVIP);
  const isLocked = Boolean(isChapterVIP && !hasFullAccess);

  // Fullscreen Handler & Event Listener
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
        setTimeout(() => {
          containerRef.current?.focus();
        }, 50);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any)?.webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed, falling back:', err);
      setIsFullscreen(prev => !prev);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (isFs) {
        setTimeout(() => containerRef.current?.focus(), 50);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Global anti-download security: blocks right-clicks, drag-and-drop, and save keyboard shortcuts
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    const handleGlobalDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('contextmenu', handleGlobalContextMenu);
    window.addEventListener('dragstart', handleGlobalDragStart);

    return () => {
      window.removeEventListener('contextmenu', handleGlobalContextMenu);
      window.removeEventListener('dragstart', handleGlobalDragStart);
    };
  }, []);

  // Instant Single-Swipe Engine (Zero Animation Lag & Anti-Double-Swipe Guard)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef(false);
  const lastSwipeTimestampRef = useRef<number>(0);
  const lastTouchTimestampRef = useRef<number>(0);

  const handleFlipNext = useCallback(() => {
    const now = Date.now();
    // Anti-double-swipe throttle: prevent multiple flips from firing within 280ms
    if (now - lastSwipeTimestampRef.current < 280) return;
    lastSwipeTimestampRef.current = now;

    if (activePanelIndex >= currentChapter.panels.length) {
      if (nextChapter) {
        onNavigate('read', { seriesId, chapterId: nextChapter.id });
      }
      return;
    }
    // Instant switch to next page without animation delay
    setActivePanelIndex(prev => prev + 1);
  }, [activePanelIndex, currentChapter.panels.length, nextChapter, onNavigate, seriesId]);

  const handleFlipPrev = useCallback(() => {
    const now = Date.now();
    // Anti-double-swipe throttle: prevent multiple flips from firing within 280ms
    if (now - lastSwipeTimestampRef.current < 280) return;
    lastSwipeTimestampRef.current = now;

    if (activePanelIndex <= 0) return;
    // Instant switch to previous page without animation delay
    setActivePanelIndex(prev => prev - 1);
  }, [activePanelIndex]);

  // Preload adjacent panels for instantaneous, shutter-free page turns
  useEffect(() => {
    if (!currentChapter?.panels) return;
    const preloadIndexes = [activePanelIndex + 1, activePanelIndex + 2, activePanelIndex - 1];
    preloadIndexes.forEach(idx => {
      if (idx >= 0 && idx < currentChapter.panels.length) {
        const img = new Image();
        img.src = currentChapter.panels[idx].imageUrl;
      }
    });
  }, [activePanelIndex, currentChapter?.panels]);

  // High-precision Single-Swipe Detection (Triggers once per gesture, immune to double swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchCurrentRef.current) {
      touchStartRef.current = null;
      touchCurrentRef.current = null;
      return;
    }

    const deltaX = touchCurrentRef.current.x - touchStartRef.current.x;
    const deltaY = touchCurrentRef.current.y - touchStartRef.current.y;

    // Immediately clear coordinates so duplicate events cannot re-trigger
    touchStartRef.current = null;
    touchCurrentRef.current = null;

    // Direct single-swipe evaluation:
    // 1. Dominant horizontal intent: horizontal travel must clearly exceed vertical travel (deltaX > 1.2 * deltaY)
    // 2. Minimum 30px distance to prevent accidental micro-touches
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const isSwipe = Math.abs(deltaX) >= 30;

    if (isHorizontal && isSwipe) {
      if (deltaX < 0) {
        // Swiped Left -> Next Page
        handleFlipNext();
      } else {
        // Swiped Right -> Previous Page
        handleFlipPrev();
      }
    }
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    touchCurrentRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // If touch was recently active (mobile touch emulating mouse), completely ignore mouse
    if (Date.now() - lastTouchTimestampRef.current < 1000) return;
    isMouseDownRef.current = true;
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    touchCurrentRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !touchStartRef.current) return;
    touchCurrentRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    if (Date.now() - lastTouchTimestampRef.current < 1000) return;
    handleTouchEnd();
  };

  // Keyboard navigation for both page_flip and webtoon continuous vertical scrolling in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S / Cmd+S save shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }

      // Vertical continuous scroll mode navigation
      if (readingMode === 'webtoon') {
        const scrollAmount = 380;
        if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault();
          if (containerRef.current) {
            containerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          }
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault();
          if (containerRef.current) {
            containerRef.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
          }
          window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        } else if (e.key === 'Space') {
          e.preventDefault();
          const paged = window.innerHeight * 0.8;
          if (containerRef.current) {
            containerRef.current.scrollBy({ top: paged, behavior: 'smooth' });
          }
          window.scrollBy({ top: paged, behavior: 'smooth' });
        } else if (e.key === 'PageDown') {
          e.preventDefault();
          const paged = window.innerHeight * 0.85;
          if (containerRef.current) {
            containerRef.current.scrollBy({ top: paged, behavior: 'smooth' });
          }
          window.scrollBy({ top: paged, behavior: 'smooth' });
        } else if (e.key === 'PageUp') {
          e.preventDefault();
          const paged = window.innerHeight * 0.85;
          if (containerRef.current) {
            containerRef.current.scrollBy({ top: -paged, behavior: 'smooth' });
          }
          window.scrollBy({ top: -paged, behavior: 'smooth' });
        }
      }

      // Horizontal Page Flip navigation
      if (readingMode === 'page_flip') {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
          handleFlipNext();
        } else if (e.key === 'ArrowLeft') {
          handleFlipPrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, handleFlipNext, handleFlipPrev]);

  const filteredChapters = chapters.filter(c => {
    if (!chapterSearchQuery.trim()) return true;
    const q = chapterSearchQuery.toLowerCase().trim();
    return (
      c.title.toLowerCase().includes(q) ||
      c.chapterNumber.toString().includes(q)
    );
  });

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-reader-fullscreen="true"
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
      className={`bg-[#050608] text-white flex flex-col relative select-none w-full outline-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen overflow-y-auto overflow-x-hidden'
          : 'min-h-screen overflow-y-auto overflow-x-hidden'
      }`}
      style={{
        filter: `brightness(${brightness}%)`,
        height: isFullscreen ? '100vh' : 'auto',
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: readingMode === 'webtoon' ? 'pan-y' : 'pan-x',
      }}
    >
      {/* High-Precision MangaWild Pinned Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3.5px] bg-zinc-950/80 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-white to-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.9)] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Fullscreen Floating Controls Bar with Interactive Zoom, Mode Switch & Exit */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 sm:gap-2 bg-black/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-2xl text-white select-none animate-fade-in">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold min-w-[42px] text-center text-zinc-100">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoomLevel !== 100 && (
            <button
              type="button"
              onClick={handleZoomReset}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          {/* Reading Mode Switcher in Fullscreen */}
          <button
            type="button"
            onClick={() => setReadingMode(prev => prev === 'webtoon' ? 'page_flip' : 'webtoon')}
            className="px-2 py-1 text-[11px] font-mono font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors cursor-pointer"
            title="Toggle Mode"
          >
            {readingMode === 'webtoon' ? 'Vertical' : 'Flip'}
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Floating Top Reader Bar */}
      <header
        className={`sticky top-0 z-40 bg-[#090b12]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-2.5 flex items-center justify-between transition-transform duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('series', { id: seriesId })}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Back to Series"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="hidden md:flex items-center cursor-pointer transition-transform duration-150 active:scale-95 drop-shadow-md hover:opacity-90"
            title="MangaWild Home"
          >
            <MangaWildLogo size="sm" />
          </button>
          <div className="max-w-[140px] sm:max-w-xs truncate">
            <h1 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
              <span className="truncate">{series.title}</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
              Ch. {currentChapter.chapterNumber} · {currentChapter.title}
            </p>
          </div>
        </div>

        {/* Center Chapter Switcher & Directory Opener */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            disabled={!prevChapter}
            onClick={(e) => {
              e.stopPropagation();
              prevChapter && onNavigate('read', { seriesId, chapterId: prevChapter.id });
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Previous Chapter"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Chapters Directory Button (Always visible on mobile & desktop) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowChaptersDrawer(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 hover:bg-zinc-800"
            title="Open Chapters Directory"
          >
            <List className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden sm:inline">Chapters</span>
            <span className="text-[11px] text-zinc-300">
              Ch. {currentChapter.chapterNumber}
            </span>
            <span className="hidden sm:inline text-[10px] text-zinc-500 font-normal">
              /{chapters.length}
            </span>
          </button>

          <button
            disabled={!nextChapter}
            onClick={(e) => {
              e.stopPropagation();
              nextChapter && onNavigate('read', { seriesId, chapterId: nextChapter.id });
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Next Chapter"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Reader Display Mode, Zoom & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls (Header desktop pill) */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-bold text-zinc-300 min-w-[36px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>


          {/* Mode toggle (Available across mobile and desktop so readers can switch anytime) */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] sm:text-xs shrink-0">
            <button
              onClick={() => setReadingMode('webtoon')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                readingMode === 'webtoon' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => setReadingMode('page_flip')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                readingMode === 'page_flip' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Flip
            </button>
          </div>

          {/* Quick Settings Drawer Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Reader Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 space-y-4 z-50 animate-in fade-in">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Viewer Settings
                </h4>

                {/* Zoom Level in Settings */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" /> Zoom Level
                    </span>
                    <span>{zoomLevel}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="25"
                      value={zoomLevel}
                      onChange={e => setZoomLevel(Number(e.target.value))}
                      className="flex-1 accent-white"
                    />
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                    >
                      +
                    </button>
                    {zoomLevel !== 100 && (
                      <button
                        type="button"
                        onClick={handleZoomReset}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                        title="Reset"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Brightness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5" /> Brightness
                    </span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={brightness}
                    onChange={e => setBrightness(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                {/* Fit Mode */}
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-400 font-mono">Page Sizing</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => setFitMode('width')}
                      className={`p-1.5 rounded-lg border text-center cursor-pointer ${
                        fitMode === 'width' ? 'border-white bg-white text-zinc-950 font-bold' : 'border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Fit Width
                    </button>
                    <button
                      onClick={() => setFitMode('screen')}
                      className={`p-1.5 rounded-lg border text-center cursor-pointer ${
                        fitMode === 'screen' ? 'border-white bg-white text-zinc-950 font-bold' : 'border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Fit Screen
                    </button>
                  </div>
                </div>

                {/* Mode Selector for Mobile */}
                <div className="md:hidden space-y-1.5">
                  <span className="text-xs text-zinc-400 font-mono">Scroll Direction</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => setReadingMode('webtoon')}
                      className={`p-1.5 rounded-lg border text-center ${
                        readingMode === 'webtoon' ? 'border-white bg-white text-zinc-950 font-bold' : 'border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Vertical
                    </button>
                    <button
                      onClick={() => setReadingMode('page_flip')}
                      className={`p-1.5 rounded-lg border text-center ${
                        readingMode === 'page_flip' ? 'border-white bg-white text-zinc-950 font-bold' : 'border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Page Flip
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>
 
      {/* Tip Toast Notification */}
      {tipToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-zinc-900 border border-white/20 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-medium">
            <Coins className="w-4 h-4 text-white" />
            <span>{tipToast}</span>
          </div>
        </div>
      )}

      {/* Real-time Cross-Device Resume Banner */}
      {crossDevicePrompt?.show && (
        <div className="sticky top-12 z-35 w-full max-w-2xl mx-auto px-4 py-2 animate-fadeIn">
          <div className="bg-zinc-900/95 border border-zinc-700 shadow-2xl rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-white">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {crossDevicePrompt.isDifferentChapter
                    ? `Resume on other device: Ch. ${crossDevicePrompt.chapterNumber}`
                    : `Resume scroll position (${crossDevicePrompt.scrollPercent || 0}%)`}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {crossDevicePrompt.isDifferentChapter
                    ? `You were reading Chapter ${crossDevicePrompt.chapterNumber} on another device.`
                    : `Saved position from your previous session`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (crossDevicePrompt.isDifferentChapter) {
                    onNavigate('read', { seriesId, chapterId: crossDevicePrompt.chapterId });
                  } else {
                    if (crossDevicePrompt.scrollPosition) {
                      window.scrollTo({ top: crossDevicePrompt.scrollPosition, behavior: 'smooth' });
                    }
                  }
                  setCrossDevicePrompt(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => setCrossDevicePrompt(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Reader Canvas */}
      <main
        className={`flex-1 flex flex-col items-center p-2 sm:p-4 w-full ${
          readingMode === 'webtoon' ? 'justify-start' : 'justify-center my-auto'
        }`}
        onClick={() => setShowControls(!showControls)}
        onWheel={(e) => {
          if (readingMode === 'webtoon' && containerRef.current) {
            containerRef.current.scrollTop += e.deltaY;
          }
        }}
      >
        {/* VIP Lock Wall */}
        {isLocked ? (
          <div className="max-w-md w-full my-16 p-8 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                Exclusive VIP Manga
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {series?.title} · Chapter {currentChapter.chapterNumber}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                This manga is part of MangaWild&apos;s Exclusive Series catalog. Get an active VIP subscription to read all chapters and support indie manga creators.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVIPModal?.();
                }}
                className="w-full py-3.5 px-5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>{isAuthenticated ? 'Get VIP Subscription to Read' : 'Sign In to Get VIP Subscription'}</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-3 flex items-center justify-between">
              <span>Plans from ₹199/month</span>
              <button
                type="button"
                onClick={() => onNavigate('series', { id: seriesId })}
                className="text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Back to Series
              </button>
            </div>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Seamless Continuous Flow (Gapless vertical webtoon layout) */
          <div
            className="w-full space-y-0 gap-0 p-0 my-0 flex flex-col items-center webtoon-scroll transition-all duration-200 select-none leading-none"
            style={{
              maxWidth: fitMode === 'width' ? `${(zoomLevel / 100) * 850}px` : `${(zoomLevel / 100) * 650}px`,
              width: `${zoomLevel}%`,
            }}
          >
            {currentChapter.panels.map((panel, idx) => (
              <div
                key={panel.id}
                className="w-full shadow-none relative group select-none overflow-hidden m-0 p-0 block leading-none"
              >
                <BlurUpMangaImage
                  src={panel.imageUrl}
                  alt={`Chapter ${currentChapter.chapterNumber} Panel ${idx + 1}`}
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  panelNumber={idx + 1}
                  className="w-full m-0 p-0 block leading-none"
                  imgClassName="w-full h-auto block select-none pointer-events-none m-0 p-0 leading-none align-middle"
                />
                {panel.hasError && (
                  <div className="absolute top-2 right-2 z-20 bg-zinc-800/90 border border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Scan Issue Flagged
                  </div>
                )}
              </div>
            ))}

            {/* Creator Tipping / Support Jar */}
            {currentChapter.tippingEnabled !== false && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl mx-auto my-6"
              >
                <CreatorTipJar
                  creatorId={series.creatorId || `creator_${series.author.toLowerCase().replace(/\s+/g, '_')}`}
                  creatorName={series.author}
                  seriesId={series.id}
                  seriesTitle={series.title}
                  chapterId={currentChapter.id}
                  chapterNumber={currentChapter.chapterNumber}
                  onTipSent={handleSendTip}
                />
              </div>
            )}

            {/* Vertical Chapter Completion Section - appears vertically after the last page */}
            {!isLocked && (
              <div className="w-full max-w-2xl py-12 px-4 text-center space-y-4 mt-4 border-t border-zinc-800/80">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shadow-md">
                  <CheckCircle className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700">
                    Chapter Completed
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">
                    You&apos;ve completed Chapter {currentChapter.chapterNumber}!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {series.title} · {currentChapter.panels.length} Pages Read
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  {prevChapter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('read', { seriesId, chapterId: prevChapter.id });
                      }}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                    >
                      ← Chapter {prevChapter.chapterNumber}
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChaptersDrawer(true);
                    }}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <List className="w-4 h-4 text-zinc-300" />
                    <span>All Chapters ({chapters.length})</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('series', { id: seriesId });
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Series Overview
                  </button>

                  {nextChapter ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('read', { seriesId, chapterId: nextChapter.id });
                      }}
                      className="px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-950 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      Chapter {nextChapter.chapterNumber} →
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
                      End of available chapters
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reader Comments Section in Webtoon Mode */}
            <div
              className="w-full max-w-2xl px-4 py-8 mt-4 border-t border-zinc-800 text-left"
              onClick={e => e.stopPropagation()}
            >
              <MangaCommentsSection
                seriesId={seriesId}
                chapterId={currentChapter.id}
                chapterTitle={`Ch. ${currentChapter.chapterNumber}: ${currentChapter.title}`}
                onOpenAuthModal={() => onNavigate('series', { id: seriesId })}
              />
            </div>
          </div>
        ) : (
          /* Page Flip Mode (Single Panel or Horizontal End-Card) */
          <div className="relative flex flex-col items-center justify-center max-w-4xl w-full my-auto">
            {activePanelIndex >= currentChapter.panels.length ? (
              /* Horizontal End-Card Slide - Only shown after the last page! */
              <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl max-w-xl w-full my-auto text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700">
                    Chapter Completed
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">
                    You&apos;ve completed Chapter {currentChapter.chapterNumber}!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {series.title} • {currentChapter.panels.length} Pages Read
                  </p>
                </div>

                {/* Creator Tipping / Support Jar in Page Flip */}
                {currentChapter.tippingEnabled !== false && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full"
                  >
                    <CreatorTipJar
                      creatorId={series.creatorId || `creator_${series.author.toLowerCase().replace(/\s+/g, '_')}`}
                      creatorName={series.author}
                      seriesId={series.id}
                      seriesTitle={series.title}
                      chapterId={currentChapter.id}
                      chapterNumber={currentChapter.chapterNumber}
                      onTipSent={handleSendTip}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePanelIndex(currentChapter.panels.length - 1);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Page {currentChapter.panels.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChaptersDrawer(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <List className="w-4 h-4 text-zinc-300" />
                    <span>All Chapters ({chapters.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('series', { id: seriesId });
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Series Overview
                  </button>

                  {nextChapter ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('read', { seriesId, chapterId: nextChapter.id });
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-950 shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>Chapter {nextChapter.chapterNumber}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono py-2">No more chapters</span>
                  )}
                </div>

                {prevChapter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('read', { seriesId, chapterId: prevChapter.id });
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-mono pt-1 cursor-pointer"
                  >
                    ← Read Chapter {prevChapter.chapterNumber}
                  </button>
                )}
              </div>
            ) : (
              currentChapter.panels[activePanelIndex] && (
                <div
                  className="relative select-none w-full max-w-4xl h-[78vh] sm:h-[82vh] min-h-[480px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden rounded-2xl bg-[#06070a] border border-white/10 shadow-2xl"
                  style={{ touchAction: 'none' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Instant Static Panel Layer (Zero Animation Delay, Instant Page Switch with Blur-Up Loading) */}
                  <div className="relative z-0 w-full h-full flex items-center justify-center select-none overflow-hidden">
                    <BlurUpMangaImage
                      key={currentChapter.panels[activePanelIndex].id || activePanelIndex}
                      src={currentChapter.panels[activePanelIndex].imageUrl}
                      alt={`Panel ${activePanelIndex + 1}`}
                      loading="eager"
                      panelNumber={activePanelIndex + 1}
                      className="max-h-[80vh] w-auto max-w-[95%] mx-auto flex items-center justify-center bg-transparent"
                      imgStyle={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'center center',
                        maxHeight: '80vh',
                        maxWidth: '95%',
                        objectFit: 'contain',
                        margin: '0 auto',
                      }}
                      imgClassName="max-h-[80vh] w-auto max-w-[95%] object-contain mx-auto block select-none pointer-events-none"
                    />

                    {/* Anti-Download Transparent Security Shield */}
                    <div
                      className="absolute inset-0 z-20 bg-transparent select-none cursor-grab active:cursor-grabbing"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Left & Right page flip zones & clickable buttons */}
                  <button
                    type="button"
                    disabled={activePanelIndex === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlipPrev();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 hover:bg-zinc-700 text-white disabled:opacity-0 transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 border border-white/10"
                    title="Previous Page (← Swipe Right)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlipNext();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 hover:bg-zinc-700 text-white transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 border border-white/10"
                    title="Next Page (Swipe Left →)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )
            )}

            {/* Tactile gesture hint */}
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Slide finger or use arrow keys to flip pages</span>
            </div>

            {/* Page Index indicator & Quick Chapter Switch */}
            <div className="mt-3 flex items-center gap-2.5 text-xs text-stone-400 font-mono">
              <span>
                {activePanelIndex >= currentChapter.panels.length
                  ? 'Chapter Completed'
                  : `Page ${activePanelIndex + 1} of ${currentChapter.panels.length}`}
              </span>
              <span>·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChaptersDrawer(true);
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer bg-zinc-900/90 hover:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
                title="View All Chapters"
              >
                <List className="w-3.5 h-3.5 text-zinc-300" />
                <span>Chapters ({chapters.length})</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic Reading Progress & Firestore Sync Floating HUD */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-700/80 shadow-2xl text-xs font-mono select-none">
          {/* Progress Percentage & Panel Count */}
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="text-white font-black">{readingProgress}%</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300 text-[11px]">
              {readingMode === 'webtoon' ? 'Scroll Progress' : `Panel ${activePanelIndex + 1}/${currentChapter.panels.length}`}
            </span>
          </span>
        </div>
      </div>

      {/* 3. Chapters Directory Slide-Over Drawer */}
      {showChaptersDrawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowChaptersDrawer(false)}
        >
          <div
            className="w-full max-w-md h-full bg-[#0d0f17] border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 select-none"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white leading-tight truncate">
                    {series.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    All Chapters ({chapters.length})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChaptersDrawer(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/30">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={chapterSearchQuery}
                  onChange={e => setChapterSearchQuery(e.target.value)}
                  placeholder="Search chapter title or number..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredChapters.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">No matching chapters found</p>
              ) : (
                filteredChapters.map(ch => {
                  const isCurrent = ch.id === currentChapter.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        onNavigate('read', { seriesId, chapterId: ch.id });
                        setShowChaptersDrawer(false);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-purple-950/40 border-purple-500/80 shadow-md ring-1 ring-purple-500/50'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-purple-600 text-white'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {ch.chapterNumber}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{ch.title}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                Reading
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {ch.panels?.length || 0} pages {ch.releaseDate ? `· ${ch.releaseDate}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        <span className={`text-xs font-mono ${isCurrent ? 'text-purple-400 font-bold' : 'text-zinc-400'}`}>
                          {isCurrent ? 'Current' : 'Read →'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  RotateCcw,
  Volume2,
  Cloud,
  Coins,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { Chapter, MangaSeries } from '../types/manga';
import { MangaWildLogo } from '../components/MangaWildLogo';
import { MangaCommentsSection } from '../components/MangaCommentsSection';
import { BlurUpMangaImage } from '../components/BlurUpMangaImage';
import { CreatorTipJar } from '../components/CreatorTipJar';
import { ShareModal } from '../components/ShareModal';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activePanelIndex, setActivePanelIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
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

  const zoomStateRef = useRef<{ zoom: number; x: number; y: number }>({ zoom: 100, x: 0, y: 0 });
  const applyZoomAndPan = useCallback((nextZoom: number, nextX: number, nextY: number) => {
    zoomStateRef.current = { zoom: nextZoom, x: nextX, y: nextY };
    setZoomLevel(nextZoom);
    setPanOffset({ x: nextX, y: nextY });
  }, []);

  const handleZoomReset = useCallback(() => {
    applyZoomAndPan(100, 0, 0);
  }, [applyZoomAndPan]);

  const handleSendTip = () => {
    setRefreshTipsKey(k => k + 1);
    setTipToast(`Tip sent to ${series?.author || 'the mangaka'}! Thank you for supporting indie creators!`);
    setTimeout(() => setTipToast(null), 3500);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const webtoonStripRef = useRef<HTMLDivElement>(null);
  const flipViewportRef = useRef<HTMLDivElement>(null);
  const flipZoomTargetRef = useRef<HTMLDivElement>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(100);
  const pinchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartMidRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number }>({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const wasPinchingRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);

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

  // Webtoon Continuous Scroll Reading Progress Tracking (rAF-throttled for 60fps scrolling)
  useEffect(() => {
    if (readingMode !== 'webtoon' || !currentChapter || !series) return;

    let rafId: number | null = null;

    const computeWebtoonScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const el = containerRef.current;
        let scrollTop = window.scrollY;
        let scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (el && isFullscreen) {
          scrollTop = el.scrollTop;
          scrollHeight = el.scrollHeight - el.clientHeight;
        }

        if (scrollHeight <= 0) {
          setReadingProgress(prev => (prev === 100 ? prev : 100));
          return;
        }

        const ratio = Math.min(1, Math.max(0, scrollTop / scrollHeight));
        const pct = Math.min(100, Math.max(1, Math.round(ratio * 100)));
        const totalPanels = currentChapter.panels.length;
        const currentPanel = Math.min(totalPanels, Math.max(1, Math.ceil(ratio * totalPanels)));

        setReadingProgress(prev => (prev === pct ? prev : pct));

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
        }, 600);
      });
    };

    window.addEventListener('scroll', computeWebtoonScroll, { passive: true });
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', computeWebtoonScroll, { passive: true });
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
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
    applyZoomAndPan(100, 0, 0);
    setActivePanelIndex(prev => prev + 1);
  }, [activePanelIndex, currentChapter.panels.length, nextChapter, onNavigate, seriesId, applyZoomAndPan]);

  const handleFlipPrev = useCallback(() => {
    const now = Date.now();
    // Anti-double-swipe throttle: prevent multiple flips from firing within 280ms
    if (now - lastSwipeTimestampRef.current < 280) return;
    lastSwipeTimestampRef.current = now;

    if (activePanelIndex <= 0) return;
    // Instant switch to previous page without animation delay
    applyZoomAndPan(100, 0, 0);
    setActivePanelIndex(prev => prev - 1);
  }, [activePanelIndex, applyZoomAndPan]);

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

  const clampPanOffset = useCallback((x: number, y: number, targetZoom: number) => {
    if (targetZoom <= 100) return { x: 0, y: 0 };
    const target = readingMode === 'webtoon' ? webtoonStripRef.current : flipZoomTargetRef.current;
    const scale = targetZoom / 100;
    const baseW = target?.offsetWidth || window.innerWidth;
    const baseH = target?.offsetHeight || window.innerHeight;
    const minPanX = -baseW * (scale - 1);
    const maxPanX = 0;

    if (readingMode === 'webtoon' && target) {
      const rect = target.getBoundingClientRect();
      const unscaledTop = rect.top - zoomStateRef.current.y;
      const maxPanY = Math.max(0, -unscaledTop);
      const minPanY = Math.min(0, window.innerHeight - unscaledTop - baseH * scale);
      return {
        x: Math.min(maxPanX, Math.max(minPanX, x)),
        y: Math.min(maxPanY, Math.max(minPanY, y)),
      };
    }

    const minPanY = -baseH * (scale - 1);
    const maxPanY = 0;
    return {
      x: Math.min(maxPanX, Math.max(minPanX, x)),
      y: Math.min(maxPanY, Math.max(minPanY, y)),
    };
  }, [readingMode]);

  const initTwoFingerPinch = (touches: React.TouchList) => {
    const t0 = touches[0];
    const t1 = touches[1];
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    const midX = (t0.clientX + t1.clientX) / 2;
    const midY = (t0.clientY + t1.clientY) / 2;
    const target = readingMode === 'webtoon' ? webtoonStripRef.current : flipZoomTargetRef.current;
    const rect = target?.getBoundingClientRect();

    pinchStartDistRef.current = Math.max(10, Math.hypot(dx, dy));
    pinchStartZoomRef.current = zoomStateRef.current.zoom;
    pinchStartPanRef.current = { x: zoomStateRef.current.x, y: zoomStateRef.current.y };
    pinchStartMidRef.current = {
      x: midX,
      y: midY,
      offsetX: rect ? midX - rect.left : midX,
      offsetY: rect ? midY - rect.top : midY,
    };
    wasPinchingRef.current = true;
    touchStartRef.current = null;
    touchCurrentRef.current = null;
    panStartRef.current = null;
  };

  // Natural Two-Finger Pinch-to-Zoom & Single-Swipe Detection
  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    if (e.touches.length >= 2) {
      initTwoFingerPinch(e.touches);
      return;
    }

    const touch = e.touches[0];
    if (zoomStateRef.current.zoom > 100) {
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        origX: zoomStateRef.current.x,
        origY: zoomStateRef.current.y,
      };
      return;
    }

    if (readingMode === 'page_flip') {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      if (!pinchStartDistRef.current) {
        initTwoFingerPinch(e.touches);
        return;
      }
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t0.clientX - t1.clientX;
      const dy = t0.clientY - t1.clientY;
      const dist = Math.max(10, Math.hypot(dx, dy));
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      const nextZoom = Math.min(350, Math.max(100, (pinchStartZoomRef.current * dist) / pinchStartDistRef.current));
      const scaleRatio = nextZoom / pinchStartZoomRef.current;
      const { x: startMidX, y: startMidY, offsetX, offsetY } = pinchStartMidRef.current;
      const { x: startPanX, y: startPanY } = pinchStartPanRef.current;
      const rawPanX = startPanX + (midX - startMidX) - offsetX * (scaleRatio - 1);
      const rawPanY = startPanY + (midY - startMidY) - offsetY * (scaleRatio - 1);

      if (nextZoom <= 101) {
        if (readingMode === 'webtoon' && Math.abs(rawPanY) > 1) {
          if (isFullscreen && containerRef.current) {
            containerRef.current.scrollTop += -rawPanY;
          } else {
            window.scrollBy(0, -rawPanY);
          }
        }
        applyZoomAndPan(100, 0, 0);
      } else {
        const clamped = clampPanOffset(rawPanX, rawPanY, nextZoom);
        applyZoomAndPan(nextZoom, clamped.x, clamped.y);
      }
      return;
    }

    if (zoomStateRef.current.zoom > 100 && panStartRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const nextX = panStartRef.current.origX + (touch.clientX - panStartRef.current.x);
      const nextY = panStartRef.current.origY + (touch.clientY - panStartRef.current.y);
      const clamped = clampPanOffset(nextX, nextY, zoomStateRef.current.zoom);
      applyZoomAndPan(zoomStateRef.current.zoom, clamped.x, clamped.y);
      return;
    }

    if (readingMode !== 'page_flip' || !touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e?: React.TouchEvent) => {
    if (e && e.touches.length === 1) {
      // Transition smoothly from 2-finger pinch to 1-finger pan without jumping
      pinchStartDistRef.current = null;
      if (zoomStateRef.current.zoom > 100) {
        panStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          origX: zoomStateRef.current.x,
          origY: zoomStateRef.current.y,
        };
      }
      return;
    }

    pinchStartDistRef.current = null;
    panStartRef.current = null;

    if (wasPinchingRef.current) {
      wasPinchingRef.current = false;
      touchStartRef.current = null;
      touchCurrentRef.current = null;
      if (zoomStateRef.current.zoom <= 102) {
        if (readingMode === 'webtoon' && Math.abs(zoomStateRef.current.y) > 1) {
          if (isFullscreen && containerRef.current) {
            containerRef.current.scrollTop += -zoomStateRef.current.y;
          } else {
            window.scrollBy(0, -zoomStateRef.current.y);
          }
        }
        applyZoomAndPan(100, 0, 0);
      }
      return;
    }

    if (readingMode !== 'page_flip' || !touchStartRef.current || !touchCurrentRef.current) {
      touchStartRef.current = null;
      touchCurrentRef.current = null;
      return;
    }

    const deltaX = touchCurrentRef.current.x - touchStartRef.current.x;
    const deltaY = touchCurrentRef.current.y - touchStartRef.current.y;

    // Immediately clear coordinates so duplicate events cannot re-trigger
    touchStartRef.current = null;
    touchCurrentRef.current = null;

    const nativeScale = window.visualViewport?.scale ?? 1;
    if (zoomStateRef.current.zoom > 100 || nativeScale > 1.02) return;

    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const isSwipe = Math.abs(deltaX) >= 35;

    if (isHorizontal && isSwipe) {
      if (deltaX < 0) {
        handleFlipNext();
      } else {
        handleFlipPrev();
      }
    }
  };

  const handleTouchCancel = () => {
    pinchStartDistRef.current = null;
    panStartRef.current = null;
    wasPinchingRef.current = false;
    touchStartRef.current = null;
    touchCurrentRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimestampRef.current < 1000) return;
    isMouseDownRef.current = true;
    if (zoomStateRef.current.zoom > 100 && readingMode === 'page_flip') {
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        origX: zoomStateRef.current.x,
        origY: zoomStateRef.current.y,
      };
      return;
    }
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    touchCurrentRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    if (zoomStateRef.current.zoom > 100 && readingMode === 'page_flip' && panStartRef.current) {
      const nextX = panStartRef.current.origX + (e.clientX - panStartRef.current.x);
      const nextY = panStartRef.current.origY + (e.clientY - panStartRef.current.y);
      const clamped = clampPanOffset(nextX, nextY, zoomStateRef.current.zoom);
      applyZoomAndPan(zoomStateRef.current.zoom, clamped.x, clamped.y);
      return;
    }
    if (!touchStartRef.current) return;
    touchCurrentRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    panStartRef.current = null;
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
      className={`flex flex-col relative select-none w-full outline-none transition-colors ${
        isLight ? 'bg-white text-black' : 'bg-black text-white'
      } ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen overflow-y-auto overflow-x-hidden'
          : 'min-h-screen'
      }`}
      style={{
        height: isFullscreen ? '100vh' : 'auto',
        minHeight: '100vh',
        overflowY: isFullscreen ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch',
        touchAction: readingMode === 'webtoon' ? 'auto' : 'pan-y pinch-zoom',
      }}
    >
      {/* Strict Monochrome Pinned Reading Progress Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 h-[3px] pointer-events-none ${
          isLight ? 'bg-black/10' : 'bg-white/10'
        }`}
      >
        <div
          className={`h-full transition-all duration-150 ease-out ${
            isLight ? 'bg-black' : 'bg-white'
          }`}
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Fullscreen Floating Controls Bar with Mode Switch & Exit */}
      {isFullscreen && (
        <div
          className={`fixed top-3 right-3 z-50 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border shadow-2xl select-none animate-fade-in ${
            isLight
              ? 'bg-white/95 text-black border-black'
              : 'bg-black/90 text-white border-white/25 backdrop-blur-md'
          }`}
        >
          {/* Reading Mode Switcher in Fullscreen */}
          <button
            type="button"
            onClick={() => {
              setReadingMode(prev => prev === 'webtoon' ? 'page_flip' : 'webtoon');
              handleZoomReset();
            }}
            className={`px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full border transition-colors cursor-pointer ${
              isLight
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-white'
            }`}
            title="Toggle Mode"
          >
            {readingMode === 'webtoon' ? 'Vertical' : 'Flip'}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 rounded-full hover:opacity-75 transition-opacity cursor-pointer"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Top Reader Header Bar — 100% Visible in Both White and Black Themes */}
      <header
        className={`sticky top-0 z-40 border-b px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-3 transition-transform duration-300 max-w-full overflow-visible box-border ${
          isLight
            ? 'bg-white text-black border-black'
            : 'bg-black/95 backdrop-blur-md text-white border-white/15'
        } ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('series', { id: seriesId })}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                : 'bg-zinc-900 text-white border-white/20 hover:bg-white hover:text-black'
            }`}
            title="Back to Series"
            aria-label="Back to Series"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hidden md:flex items-center cursor-pointer transition-transform duration-150 active:scale-95 hover:opacity-90"
            title="MangaWild Home"
          >
            <MangaWildLogo size="sm" />
          </button>
          <div className="max-w-[100px] xs:max-w-[140px] sm:max-w-xs truncate min-w-0">
            <h1
              className={`text-xs sm:text-sm font-black leading-tight truncate ${
                isLight ? 'text-black' : 'text-white'
              }`}
            >
              {series.title}
            </h1>
            <p
              className={`text-[10px] sm:text-[11px] font-medium truncate ${
                isLight ? 'text-black/75' : 'text-white/75'
              }`}
            >
              by {series.author} · Ch. {currentChapter.chapterNumber}
            </p>
          </div>
        </div>

        {/* Center Chapter Switcher & Directory Opener */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            disabled={!prevChapter}
            onClick={(e) => {
              e.stopPropagation();
              prevChapter && onNavigate('read', { seriesId, chapterId: prevChapter.id });
            }}
            className={`p-1.5 rounded-lg border disabled:opacity-25 cursor-pointer transition-colors ${
              isLight
                ? 'text-black border-black/25 hover:border-black hover:bg-black hover:text-white'
                : 'text-white border-white/15 hover:border-white hover:bg-white hover:text-black'
            }`}
            title="Previous Chapter"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Chapters Directory Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowChaptersDrawer(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                : 'bg-zinc-900 text-white border-white/25 hover:bg-white hover:text-black'
            }`}
            title="Open Chapters Directory"
          >
            <List className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Chapters</span>
            <span className="text-[11px]">Ch.{currentChapter.chapterNumber}</span>
          </button>

          <button
            type="button"
            disabled={!nextChapter}
            onClick={(e) => {
              e.stopPropagation();
              nextChapter && onNavigate('read', { seriesId, chapterId: nextChapter.id });
            }}
            className={`p-1.5 rounded-lg border disabled:opacity-25 cursor-pointer transition-colors ${
              isLight
                ? 'text-black border-black/25 hover:border-black hover:bg-black hover:text-white'
                : 'text-white border-white/15 hover:border-white hover:bg-white hover:text-black'
            }`}
            title="Next Chapter"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Reader Display Mode & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mode toggle (Vertical / Flip) */}
          <div
            className={`flex items-center p-0.5 rounded-lg border text-[11px] sm:text-xs shrink-0 ${
              isLight ? 'bg-white border-black text-black' : 'bg-zinc-900 border-white/20 text-white'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setReadingMode('webtoon');
                handleZoomReset();
              }}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer font-bold ${
                readingMode === 'webtoon'
                  ? isLight
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              Vertical
            </button>
            <button
              type="button"
              onClick={() => {
                setReadingMode('page_flip');
                handleZoomReset();
              }}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer font-bold ${
                readingMode === 'page_flip'
                  ? isLight
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              Flip
            </button>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer hidden sm:flex items-center justify-center ${
              isLight
                ? 'border-black/25 text-black hover:border-black hover:bg-black hover:text-white'
                : 'border-white/20 text-white hover:bg-white hover:text-black'
            }`}
            title="Share Chapter"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'border-black/25 text-black hover:border-black hover:bg-black hover:text-white'
                : 'border-white/20 text-white hover:bg-white hover:text-black'
            }`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Tip Toast Notification */}
      {tipToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={`border px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold ${
              isLight ? 'bg-white text-black border-black' : 'bg-black text-white border-white/25'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{tipToast}</span>
          </div>
        </div>
      )}

      {/* Real-time Cross-Device Resume Banner */}
      {crossDevicePrompt?.show && (
        <div className="sticky top-12 z-35 w-full max-w-2xl mx-auto px-4 py-2 animate-fadeIn">
          <div
            className={`border shadow-2xl rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 backdrop-blur-md ${
              isLight ? 'bg-white text-black border-black' : 'bg-zinc-900/95 text-white border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-black text-white border-black' : 'bg-zinc-800 text-white border-zinc-700'
                }`}
              >
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  {crossDevicePrompt.isDifferentChapter
                    ? `Resume on other device: Ch. ${crossDevicePrompt.chapterNumber}`
                    : `Resume scroll position (${crossDevicePrompt.scrollPercent || 0}%)`}
                </p>
                <p className="text-[11px] opacity-70 font-mono truncate">
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
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isLight ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => setCrossDevicePrompt(null)}
                className="p-1.5 opacity-70 hover:opacity-100 rounded-lg transition-opacity"
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
        className={`flex-1 flex flex-col items-center w-full ${
          readingMode === 'webtoon'
            ? 'justify-start p-0 sm:p-2'
            : isFullscreen
            ? 'justify-center p-0 h-screen w-screen'
            : 'justify-center p-0 sm:p-2 my-auto'
        }`}
        style={brightness !== 100 ? { filter: `brightness(${brightness}%)` } : undefined}
        onClick={() => setShowControls(!showControls)}
      >
        {/* Exclusive Lock Wall */}
        {isLocked ? (
          <div
            className={`max-w-md w-full my-16 p-8 rounded-2xl border text-center space-y-6 shadow-2xl ${
              isLight ? 'bg-white text-black border-black' : 'bg-zinc-900/90 text-white border-zinc-800'
            }`}
          >
            <div
              className={`w-14 h-14 mx-auto rounded-xl border flex items-center justify-center ${
                isLight ? 'bg-black text-white border-black' : 'bg-zinc-800 text-white border-zinc-700'
              }`}
            >
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-70 font-mono">
                Exclusive Manga
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                {series?.title} · Chapter {currentChapter.chapterNumber}
              </h3>
              <p className="text-xs opacity-75 leading-relaxed max-w-sm mx-auto">
                This manga is part of MangaWild&apos;s Exclusive Series catalog. Get an active Exclusive subscription to read all chapters and support indie manga creators.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVIPModal?.();
                }}
                className={`w-full py-3.5 px-5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{isAuthenticated ? 'Get Exclusive Subscription to Read' : 'Sign In to Get Exclusive'}</span>
              </button>
            </div>

            <div className="text-[11px] opacity-70 border-t border-current/15 pt-3 flex items-center justify-between">
              <span>Plans from ₹199/month</span>
              <button
                type="button"
                onClick={() => onNavigate('series', { id: seriesId })}
                className="underline cursor-pointer font-bold"
              >
                Back to Series
              </button>
            </div>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Seamless Continuous Flow (Gapless vertical webtoon layout with natural two-finger zoom) */
          <div
            ref={webtoonStripRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="w-full max-w-4xl space-y-0 gap-0 p-0 my-0 flex flex-col items-center webtoon-scroll select-none leading-none"
            style={{
              touchAction: zoomLevel > 100 ? 'none' : 'pan-y',
              transform:
                zoomLevel > 100
                  ? `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel / 100})`
                  : 'none',
              transformOrigin: '0 0',
              willChange: zoomLevel > 100 ? 'transform' : 'auto',
            }}
          >
            {currentChapter.panels.map((panel, idx) => (
              <div
                key={panel.id || idx}
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
                  <div className="absolute top-2 right-2 z-20 bg-black/90 border border-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Scan Issue Flagged
                  </div>
                )}
              </div>
            ))}

            {/* Creator Tipping / Support Jar */}
            {currentChapter.tippingEnabled !== false && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl mx-auto my-6 px-3"
              >
                <CreatorTipJar
                  creatorId={series.creatorId || `creator_${series.author.toLowerCase().replace(/\s+/g, '_')}`}
                  creatorName={series.author}
                  seriesId={series.id}
                  seriesTitle={series.title}
                  chapterNumber={currentChapter.chapterNumber}
                  onTipSent={handleSendTip}
                />
              </div>
            )}

            {/* Vertical Chapter Completion Section */}
            {!isLocked && (
              <div className="w-full max-w-2xl py-12 px-4 text-center space-y-4 mt-4 border-t border-current/15">
                <div
                  className={`w-12 h-12 mx-auto rounded-full border flex items-center justify-center shadow-md ${
                    isLight ? 'bg-black text-white border-black' : 'bg-zinc-800 text-white border-zinc-700'
                  }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${
                      isLight ? 'bg-white text-black border-black' : 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    Chapter Completed
                  </span>
                  <h3 className="text-2xl font-black mt-2">
                    You&apos;ve completed Chapter {currentChapter.chapterNumber}!
                  </h3>
                  <p className="text-xs opacity-70 mt-1 font-mono">
                    {series.title} · {currentChapter.panels.length} Pages Read
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  {prevChapter && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('read', { seriesId, chapterId: prevChapter.id });
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isLight ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white/20 text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      ← Chapter {prevChapter.chapterNumber}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChaptersDrawer(true);
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isLight ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white/20 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>All Chapters ({chapters.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('series', { id: seriesId });
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      isLight ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white/20 text-white hover:bg-white hover:text-black'
                    }`}
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
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 ${
                        isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      Chapter {nextChapter.chapterNumber} →
                    </button>
                  ) : (
                    <span className="text-xs opacity-60 font-mono px-3 py-2 rounded-xl border border-current/20">
                      End of available chapters
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reader Comments Section in Webtoon Mode */}
            <div
              className="w-full max-w-2xl px-4 py-8 mt-4 border-t border-current/15 text-left"
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
          /* Page Flip Mode (Full-Screen Large Panel View + Manual Zoom & Pan) */
          <div className="relative flex flex-col items-center justify-center w-full max-w-6xl my-auto">
            {activePanelIndex >= currentChapter.panels.length ? (
              /* Horizontal End-Card Slide */
              <div
                className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border shadow-2xl max-w-xl w-full my-auto text-center space-y-5 ${
                  isLight ? 'bg-white text-black border-black' : 'bg-zinc-900/90 text-white border-zinc-800'
                }`}
              >
                <div
                  className={`w-16 h-16 mx-auto rounded-full border flex items-center justify-center shadow-lg ${
                    isLight ? 'bg-black text-white border-black' : 'bg-zinc-800 text-white border-zinc-700'
                  }`}
                >
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${
                      isLight ? 'bg-white text-black border-black' : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    }`}
                  >
                    Chapter Completed
                  </span>
                  <h3 className="text-2xl font-black mt-2">
                    You&apos;ve completed Chapter {currentChapter.chapterNumber}!
                  </h3>
                  <p className="text-xs opacity-70 mt-1 font-mono">
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
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white/25 text-white hover:bg-white hover:text-black'
                    }`}
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
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white/25 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>All Chapters ({chapters.length})</span>
                  </button>

                  {nextChapter ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('read', { seriesId, chapterId: nextChapter.id });
                      }}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      <span>Chapter {nextChapter.chapterNumber}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs opacity-60 font-mono py-2">No more chapters</span>
                  )}
                </div>
              </div>
            ) : (
              currentChapter.panels[activePanelIndex] && (
                <div
                  ref={flipViewportRef}
                  className={`relative select-none flex items-center justify-center overflow-hidden ${
                    isFullscreen
                      ? 'w-screen h-screen rounded-none border-0'
                      : 'w-full max-w-6xl h-[calc(100vh-105px)] sm:h-[calc(100vh-92px)] min-h-[520px] rounded-none sm:rounded-2xl border'
                  } ${
                    isLight
                      ? 'bg-white border-black/15'
                      : 'bg-black border-white/10'
                  }`}
                  style={{ touchAction: 'none' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchCancel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Full-screen Panel Image Layer with Natural Two-Finger Pinch-to-Zoom & Pan */}
                  <div
                    ref={flipZoomTargetRef}
                    className="relative z-0 w-full h-full flex items-center justify-center select-none overflow-hidden"
                    style={{
                      transform:
                        zoomLevel > 100
                          ? `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel / 100})`
                          : 'none',
                      transformOrigin: '0 0',
                      willChange: zoomLevel > 100 ? 'transform' : 'auto',
                    }}
                  >
                    <BlurUpMangaImage
                      key={currentChapter.panels[activePanelIndex].id || activePanelIndex}
                      src={currentChapter.panels[activePanelIndex].imageUrl}
                      alt={`Panel ${activePanelIndex + 1}`}
                      loading="eager"
                      panelNumber={activePanelIndex + 1}
                      className="w-full h-full flex items-center justify-center bg-transparent"
                      imgStyle={{
                        maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 110px)',
                        maxWidth: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        margin: '0 auto',
                      }}
                      imgClassName="max-h-full max-w-full w-auto h-auto object-contain mx-auto block select-none pointer-events-none"
                    />

                    {/* Anti-Download Transparent Security Shield */}
                    <div
                      className="absolute inset-0 z-20 bg-transparent select-none"
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
                      setPanOffset({ x: 0, y: 0 });
                      handleFlipPrev();
                    }}
                    className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full border disabled:opacity-0 transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
                      isLight
                        ? 'bg-white/90 text-black border-black hover:bg-black hover:text-white'
                        : 'bg-black/80 text-white border-white/25 hover:bg-white hover:text-black'
                    }`}
                    title="Previous Page (← Swipe Right)"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPanOffset({ x: 0, y: 0 });
                      handleFlipNext();
                    }}
                    className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full border transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
                      isLight
                        ? 'bg-white/90 text-black border-black hover:bg-black hover:text-white'
                        : 'bg-black/80 text-white border-white/25 hover:bg-white hover:text-black'
                    }`}
                    title="Next Page (Swipe Left →)"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              )
            )}

            {/* Page Index indicator & Quick Chapter Switch */}
            {!isFullscreen && (
              <div className="mt-2.5 px-3 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
                <span className="font-bold">
                  {activePanelIndex >= currentChapter.panels.length
                    ? 'Chapter Completed'
                    : `Page ${activePanelIndex + 1} / ${currentChapter.panels.length}`}
                </span>
                <span>·</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChaptersDrawer(true);
                  }}
                  className={`flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border font-bold transition-colors ${
                    isLight
                      ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                      : 'bg-zinc-900 text-white border-white/20 hover:bg-white hover:text-black'
                  }`}
                  title="View All Chapters"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Chapters ({chapters.length})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dynamic Reading Progress Floating HUD */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border shadow-2xl text-xs font-mono select-none ${
            isLight
              ? 'bg-white/95 text-black border-black'
              : 'bg-black/90 backdrop-blur-md text-white border-white/25'
          }`}
        >
          <span className="font-bold flex items-center gap-1.5">
            <span className="font-black">{readingProgress}%</span>
            <span className="opacity-50">•</span>
            <span className="text-[11px] opacity-85">
              {readingMode === 'webtoon' ? 'Scroll' : `Page ${Math.min(currentChapter.panels.length, activePanelIndex + 1)}/${currentChapter.panels.length}`}
            </span>
          </span>
        </div>
      </div>

      {/* 3. Chapters Directory Slide-Over Drawer (Strictly Monochrome Black & White — Zero Purple) */}
      {showChaptersDrawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowChaptersDrawer(false)}
        >
          <div
            className={`w-full max-w-md h-full border-l flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 select-none ${
              isLight
                ? 'bg-white text-black border-black'
                : 'bg-black text-white border-white/20'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'border-black bg-white' : 'border-white/15 bg-black'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-black leading-tight truncate">
                    {series.title}
                  </h3>
                  <p className="text-[11px] opacity-70 font-mono">
                    All Chapters ({chapters.length})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChaptersDrawer(false)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? 'border-black/20 hover:bg-black hover:text-white'
                    : 'border-white/20 hover:bg-white hover:text-black'
                }`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter */}
            <div className={`p-3 border-b ${isLight ? 'border-black/15' : 'border-white/15'}`}>
              <div className="relative">
                <Search className="w-4 h-4 opacity-50 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={chapterSearchQuery}
                  onChange={e => setChapterSearchQuery(e.target.value)}
                  placeholder="Search chapter title or number..."
                  className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                    isLight
                      ? 'bg-white text-black border-black/30 focus:border-black placeholder-black/45'
                      : 'bg-zinc-950 text-white border-white/20 focus:border-white placeholder-white/45'
                  }`}
                />
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredChapters.length === 0 ? (
                <p className="text-xs opacity-60 py-8 text-center">No matching chapters found</p>
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
                          ? isLight
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white text-black border-white shadow-md'
                          : isLight
                          ? 'bg-white text-black border-black/20 hover:border-black'
                          : 'bg-zinc-950 text-white border-white/15 hover:border-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                            isCurrent
                              ? isLight
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-white border-black'
                              : isLight
                              ? 'bg-white text-black border-black/30'
                              : 'bg-zinc-900 text-white border-white/20'
                          }`}
                        >
                          {ch.chapterNumber}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span className="truncate">{ch.title}</span>
                            {isCurrent && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 uppercase font-black ${
                                  isLight
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black text-white border-black'
                                }`}
                              >
                                Reading
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] opacity-70 font-mono mt-0.5">
                            {ch.panels?.length || 0} pages {ch.releaseDate ? `· ${ch.releaseDate}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        <span className="text-xs font-mono font-bold">
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

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${series.title} - Chapter ${currentChapter.chapterNumber}`}
        text={`Read "${series.title}" Chapter ${currentChapter.chapterNumber}: ${currentChapter.title} on MangaWild!`}
      />
    </div>
  );
};

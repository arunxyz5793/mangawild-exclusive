import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StorageService } from '../services/storage';
import { Chapter, MangaSeries } from '../types/manga';
import { MangaWildLogo } from '../components/MangaWildLogo';
import { MangaCommentsSection } from '../components/MangaCommentsSection';

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
  const { user } = useAuth();
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

  // Reader Settings
  const [readingMode, setReadingMode] = useState<'webtoon' | 'page_flip'>('webtoon');
  const [fitMode, setFitMode] = useState<'width' | 'screen'>('width');
  const [brightness, setBrightness] = useState<number>(100);
  const [activePanelIndex, setActivePanelIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState<boolean>(false);
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if props change
  useEffect(() => {
    const s = StorageService.getSeriesById(seriesId);
    const chs = StorageService.getChapters(seriesId);
    const curCh = StorageService.getChapterById(chapterId) || chs[0];

    setSeries(s);
    setChapters(chs);
    setCurrentChapter(curCh);
    setActivePanelIndex(0);

    // Save reading progress
    if (curCh && s) {
      StorageService.saveReadingProgress(user.id, {
        seriesId: s.id,
        chapterId: curCh.id,
        chapterNumber: curCh.chapterNumber,
        panelIndex: 1,
        totalPanels: curCh.panels.length,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [seriesId, chapterId, user.id]);

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
  const isLocked = false;

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation for page flip mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode === 'page_flip') {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
          if (activePanelIndex < currentChapter.panels.length) {
            setActivePanelIndex(prev => prev + 1);
          } else if (nextChapter) {
            onNavigate('read', { seriesId, chapterId: nextChapter.id });
          }
        } else if (e.key === 'ArrowLeft') {
          if (activePanelIndex > 0) {
            setActivePanelIndex(prev => prev - 1);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, activePanelIndex, currentChapter, nextChapter, onNavigate, seriesId]);

  const filteredChapters = chapters.filter(c => {
    if (!chapterSearchQuery.trim()) return true;
    const q = chapterSearchQuery.toLowerCase().trim();
    return (
      c.title.toLowerCase().includes(q) ||
      c.chapterNumber.toString().includes(q) ||
      Boolean(c.titleHindi && c.titleHindi.toLowerCase().includes(q))
    );
  });

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#050608] text-white flex flex-col relative select-none"
      style={{ filter: `brightness(${brightness}%)` }}
    >
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
            <List className="w-3.5 h-3.5 text-purple-400" />
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

        {/* Reader Display Mode & Brightness Controls */}
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="hidden md:flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setReadingMode('webtoon')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                readingMode === 'webtoon' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => setReadingMode('page_flip')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                readingMode === 'page_flip' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'
              }`}
            >
              Page Flip
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

      {/* 2. Main Reader Canvas */}
      <main
        className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4"
        onClick={() => setShowControls(!showControls)}
      >
        {isLocked ? (
          /* VIP Lock Wall */
          <div className="max-w-md w-full my-12 p-8 rounded-2xl bg-zinc-900 border border-zinc-700 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5" /> VIP Exclusive Chapter
              </span>
              <h3 className="text-2xl font-black text-white font-display">
                CHAPTER {currentChapter.chapterNumber} LOCKED
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This chapter is available for VIP subscribers. Join VIP to unlock the full chapter archive and support original artists.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVIPModal?.();
                }}
                className="w-full py-3 px-5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unlock with VIP Pass</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
              Free chapters available on the series page.
            </div>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Endless Scroll Mode */
          <div
            className={`w-full space-y-1 my-4 flex flex-col items-center webtoon-scroll ${
              fitMode === 'width' ? 'max-w-3xl' : 'max-w-2xl'
            }`}
          >
            {currentChapter.panels.map((panel, idx) => (
              <div
                key={panel.id}
                className="w-full shadow-2xl shadow-black relative group"
              >
                <img
                  src={panel.imageUrl}
                  alt={`Chapter ${currentChapter.chapterNumber} Panel ${idx + 1}`}
                  className="w-full h-auto block select-none pointer-events-auto"
                  loading="lazy"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  data-protected-img="true"
                />
                {panel.hasError && (
                  <div className="absolute top-2 right-2 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Scan Issue Flagged
                  </div>
                )}
              </div>
            ))}

            {/* Vertical Chapter Completion Section - appears vertically after the last page */}
            {!isLocked && (
              <div className="w-full max-w-2xl py-16 px-4 text-center space-y-4 mt-8 border-t border-zinc-800/80">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
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
                    className="px-4 py-2.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/50 rounded-xl text-xs font-semibold text-purple-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <List className="w-4 h-4 text-purple-400" />
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
              <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl max-w-xl w-full my-auto text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                    Chapter Completed
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">
                    You&apos;ve completed Chapter {currentChapter.chapterNumber}!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {series.title} • {currentChapter.panels.length} Pages Read
                  </p>
                </div>

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
                    className="w-full sm:w-auto px-4 py-2.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/50 rounded-xl text-xs font-semibold text-purple-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <List className="w-4 h-4 text-purple-400" />
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
                <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 max-h-[85vh]">
                  <img
                    src={currentChapter.panels[activePanelIndex].imageUrl}
                    alt={`Panel ${activePanelIndex + 1}`}
                    className="max-h-[82vh] w-auto object-contain mx-auto block select-none pointer-events-auto"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    data-protected-img="true"
                  />

                  {/* Left & Right page flip zones */}
                  <button
                    type="button"
                    disabled={activePanelIndex === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activePanelIndex > 0) setActivePanelIndex(prev => prev - 1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-0 transition-opacity cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activePanelIndex < currentChapter.panels.length) {
                        setActivePanelIndex(prev => prev + 1);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-opacity cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )
            )}

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
                <List className="w-3.5 h-3.5 text-purple-400" />
                <span>Chapters ({chapters.length})</span>
              </button>
            </div>
          </div>
        )}
      </main>

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

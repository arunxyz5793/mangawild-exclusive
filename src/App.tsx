/**
 * MangaWild Exclusive - Main Application Shell & Dynamic Route Controller
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { CreatorDashboardPage } from './pages/CreatorDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MembershipPage } from './pages/MembershipPage';
import { LibraryPage } from './pages/LibraryPage';
import { CreatorsDirectoryPage } from './pages/CreatorsDirectoryPage';
import { CreatorProfilePage } from './pages/CreatorProfilePage';
import { NewsPage } from './pages/NewsPage';
import { RazorpayCheckoutModal } from './components/RazorpayCheckoutModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { BottomNavBar } from './components/BottomNavBar';
import { StorageService } from './services/storage';
import { MangaSeries, Chapter } from './types/manga';

/**
 * Route resolution helper: resolves series by ID, slug, or search term (e.g. 'chintu')
 */
function resolveSeriesIdentifier(identifier: string): MangaSeries | undefined {
  if (!identifier) return undefined;
  const allSeries = StorageService.getSeries();
  const cleanId = decodeURIComponent(identifier).trim().toLowerCase();

  // 1. Direct ID match
  const byId = allSeries.find(s => s.id.toLowerCase() === cleanId);
  if (byId) return byId;

  // 2. Direct slug match
  const bySlug = allSeries.find(s => s.slug.toLowerCase() === cleanId);
  if (bySlug) return bySlug;

  // 3. Normalized slug / title match (e.g. 'chintu' -> 'chitrakatha-chintu')
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normTarget = normalize(cleanId);

  const byNorm = allSeries.find(s => {
    const sNormSlug = normalize(s.slug);
    const sNormTitle = normalize(s.title);
    return sNormSlug === normTarget || sNormTitle === normTarget || sNormSlug.includes(normTarget) || sNormTitle.includes(normTarget);
  });

  return byNorm;
}

/**
 * Route resolution helper: resolves chapter by ID, slug, or number
 */
function resolveChapterIdentifier(seriesId: string, chapterIdentifier: string): Chapter | undefined {
  if (!chapterIdentifier) return undefined;
  const chapters = StorageService.getChapters(seriesId);
  const cleanCh = decodeURIComponent(chapterIdentifier).trim().toLowerCase();

  // 1. Direct ID match
  const byId = chapters.find(c => c.id.toLowerCase() === cleanCh);
  if (byId) return byId;

  // 2. Direct slug match
  const bySlug = chapters.find(c => c.slug.toLowerCase() === cleanCh);
  if (bySlug) return bySlug;

  // 3. Match chapter number (e.g. '1', 'ch-1', 'chapter-1')
  const chNum = parseInt(cleanCh.replace(/\D/g, ''), 10);
  if (!isNaN(chNum)) {
    const byNum = chapters.find(c => c.chapterNumber === chNum);
    if (byNum) return byNum;
  }

  return chapters[0];
}

/**
 * Parses current window.location.pathname into an internal route state
 */
function parseUrlToRoute(pathname: string): { view: string; params: Record<string, string> } {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '/home') {
    return { view: 'home', params: {} };
  }

  if (cleanPath === '/browse') {
    return { view: 'browse', params: {} };
  }

  if (cleanPath === '/new-series' || cleanPath === '/new_series' || cleanPath === '/trending' || cleanPath === '/leaderboard') {
    return { view: 'new_series', params: {} };
  }

  if (cleanPath === '/creator' || cleanPath === '/creator-studio') {
    return { view: 'creator', params: {} };
  }

  if (cleanPath === '/admin' || cleanPath === '/admin-suite') {
    return { view: 'admin', params: {} };
  }

  if (cleanPath === '/membership' || cleanPath === '/subscription' || cleanPath === '/vip') {
    return { view: 'membership', params: {} };
  }

  if (cleanPath === '/library') {
    return { view: 'library', params: {} };
  }

  if (cleanPath === '/creators') {
    return { view: 'creators', params: {} };
  }

  if (cleanPath.startsWith('/creator/')) {
    const creatorId = cleanPath.slice('/creator/'.length);
    return { view: 'creator-profile', params: { id: creatorId } };
  }

  if (cleanPath.startsWith('/author/')) {
    const authorName = cleanPath.slice('/author/'.length);
    return { view: 'creator-profile', params: { author: decodeURIComponent(authorName) } };
  }

  if (cleanPath === '/news') {
    return { view: 'news', params: {} };
  }

  // Series detail route: /series/:identifier (e.g. /series/chitrakatha-chintu, /series/chintu)
  if (cleanPath.startsWith('/series/')) {
    const identifier = cleanPath.slice('/series/'.length);
    const matched = resolveSeriesIdentifier(identifier);
    return {
      view: 'series',
      params: { id: matched ? matched.id : identifier },
    };
  }

  // Reader route: /read/:seriesIdentifier/:chapterIdentifier?
  if (cleanPath.startsWith('/read/')) {
    const parts = cleanPath.slice('/read/'.length).split('/');
    const seriesIden = parts[0] || '';
    const chapterIden = parts[1] || '';

    const matchedSeries = resolveSeriesIdentifier(seriesIden);
    const seriesId = matchedSeries ? matchedSeries.id : seriesIden;
    const matchedChapter = chapterIden ? resolveChapterIdentifier(seriesId, chapterIden) : undefined;
    const effectiveChapterId = matchedChapter ? matchedChapter.id : (StorageService.getChapters(seriesId)[0]?.id || '');

    return {
      view: 'read',
      params: {
        seriesId,
        chapterId: effectiveChapterId,
      },
    };
  }

  return { view: 'home', params: {} };
}

/**
 * Builds the canonical browser URL for a given view & params
 */
function getRouteUrl(view: string, params?: Record<string, string>): string {
  switch (view) {
    case 'home':
      return '/';
    case 'browse':
      return '/browse';
    case 'new_series':
      return '/new-series';
    case 'trending':
      return '/new-series';
    case 'creator':
      return '/creator';
    case 'admin':
      return '/admin';
    case 'membership':
      return '/membership';
    case 'library':
      return '/library';
    case 'creators':
      return '/creators';
    case 'creator-profile': {
      if (params?.id) return `/creator/${params.id}`;
      if (params?.author) return `/author/${encodeURIComponent(params.author)}`;
      return '/creators';
    }
    case 'news':
      return '/news';
    case 'series': {
      if (!params?.id) return '/browse';
      const s = StorageService.getSeriesById(params.id);
      return s ? `/series/${s.slug}` : `/series/${params.id}`;
    }
    case 'read': {
      const seriesId = params?.seriesId || params?.id;
      if (!seriesId) return '/';
      const s = StorageService.getSeriesById(seriesId);
      const chId = params?.chapterId;
      const ch = chId ? StorageService.getChapterById(chId) : undefined;
      const sSlug = s ? s.slug : seriesId;
      const chSlug = ch ? ch.slug : chId || 'ch1';
      return `/read/${sSlug}/${chSlug}`;
    }
    default:
      return '/';
  }
}

function AppContent() {
  const { isAuthenticated, isAuthModalOpen, authModalOptions, openAuthModal, closeAuthModal } = useAuth();
  const { theme } = useTheme();
  // Initialize route from current browser URL
  const initialRoute = parseUrlToRoute(window.location.pathname);
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [viewParams, setViewParams] = useState<Record<string, string>>(initialRoute.params);

  const [isVIPModalOpen, setIsVIPModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'yearly'>('monthly');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Lock background page scroll whenever any global modal is open
  useEffect(() => {
    if (isVIPModalOpen || isSearchOpen || isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isVIPModalOpen, isSearchOpen, isAuthModalOpen]);

  // Check if visitor arrived from an official Firebase Password Reset email link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlMode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      if (urlMode === 'resetPassword' || oobCode) {
        openAuthModal({
          title: 'Reset Account Password',
          subtitle: 'Verification code received from your email link. Enter your new password below.',
          defaultMode: 'signin',
        });
      }
    }
  }, []);

  // VIP Purchase Handler: strictly requires user to be logged in!
  const handleOpenVIPModal = (planId: 'monthly' | 'yearly' = 'yearly') => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Create Account or Sign In for Exclusive',
        subtitle: `Create an account or sign in to purchase the ${planId === 'yearly' ? 'Annual' : 'Monthly'} Exclusive membership.`,
        defaultMode: 'signup',
        onSuccess: () => {
          setSelectedPlanId(planId);
          setIsVIPModalOpen(true);
        },
      });
      return;
    }
    setSelectedPlanId(planId);
    setIsVIPModalOpen(true);
  };

  // Navigate handler that synchronizes with the Browser History API
  const handleNavigate = useCallback((view: string, params?: Record<string, string>, replace = false) => {
    const targetUrl = getRouteUrl(view, params);

    // Update browser URL if different
    if (window.location.pathname !== targetUrl) {
      if (replace) {
        window.history.replaceState({ view, params }, '', targetUrl);
      } else {
        window.history.pushState({ view, params }, '', targetUrl);
      }
    }

    setCurrentView(view);
    setViewParams(params || {});
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Listen to browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = parseUrlToRoute(window.location.pathname);
      setCurrentView(route.view);
      setViewParams(route.params);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Normalize initial route if needed (e.g. if loaded on `/series/chintu`, canonicalize to `/series/chitrakatha-chintu`)
  useEffect(() => {
    const canonicalUrl = getRouteUrl(currentView, viewParams);
    if (window.location.pathname !== '/' && window.location.pathname !== canonicalUrl) {
      window.history.replaceState({ view: currentView, params: viewParams }, '', canonicalUrl);
    }
  }, [currentView, viewParams]);

  // Anti-download & Image Protection: prevent long-press / hold to download / dragging on images & save shortcuts
  useEffect(() => {
    const preventContextMenuOnImages = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'IMG' ||
          target.closest('img') ||
          target.hasAttribute('data-protected-img') ||
          target.closest('[data-protected-img]'))
      ) {
        e.preventDefault();
      }
    };

    const preventDragOnImages = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'IMG' ||
          target.closest('img') ||
          target.hasAttribute('data-protected-img') ||
          target.closest('[data-protected-img]'))
      ) {
        e.preventDefault();
      }
    };

    const preventSaveShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', preventContextMenuOnImages, { passive: false });
    window.addEventListener('dragstart', preventDragOnImages, { passive: false });
    window.addEventListener('keydown', preventSaveShortcuts);

    return () => {
      window.removeEventListener('contextmenu', preventContextMenuOnImages);
      window.removeEventListener('dragstart', preventDragOnImages);
      window.removeEventListener('keydown', preventSaveShortcuts);
    };
  }, []);

  // Dynamic document title & meta tags update based on current view & series
  useEffect(() => {
    let title = 'MangaWild Exclusive - Premium Indie Manga Publishing & Reader';
    let desc = 'Read original indie manga, exclusive webtoons, and serial chapters like Chitra Khatha Chintu & Silent Heads. Support creators with VIP passes.';

    if (currentView === 'series' && viewParams.id) {
      const s = StorageService.getSeriesById(viewParams.id);
      if (s) {
        title = `${s.title} - Read Manga Online | MangaWild Exclusive`;
        desc = s.synopsis ? `${s.synopsis.slice(0, 150)}... Read ${s.title} on MangaWild.` : desc;
      } else {
        title = 'Manga Series - MangaWild Exclusive';
      }
    } else if (currentView === 'read') {
      const s = viewParams.seriesId ? StorageService.getSeriesById(viewParams.seriesId) : undefined;
      const ch = viewParams.chapterId ? StorageService.getChapterById(viewParams.chapterId) : undefined;
      if (s && ch) {
        title = `${s.title} Chapter ${ch.chapterNumber}: ${ch.title} - MangaWild Reader`;
        desc = `Read Chapter ${ch.chapterNumber} of ${s.title} online in high quality. Exclusive release on MangaWild.`;
      } else {
        title = 'Reading Manga - MangaWild';
      }
    } else if (currentView === 'browse') {
      title = 'Browse All Manga & Webtoons Catalog - MangaWild';
      desc = 'Explore our library of indie manga, thrillers, supernatural horrors, and action comics from passionate creators.';
    } else if (currentView === 'new_series' || currentView === 'trending') {
      title = 'New Manga Series & Fresh Releases - MangaWild';
      desc = 'Discover the newest serialized manga, fresh chapter releases, and exciting stories on MangaWild.';
    } else if (currentView === 'creator') {
      title = 'Creator Studio & Indie Publishing Desk - MangaWild';
      desc = 'Publish your original manga, earn 70% royalties, track reader analytics, and reach a passionate audience.';
    } else if (currentView === 'admin') {
      title = 'Admin Editorial & Moderation Suite - MangaWild';
      desc = 'Editorial desk for verifying scan quality, approving new series, and managing creator payouts.';
    } else if (currentView === 'membership') {
      title = 'VIP Pass & Unlimited Subscription Plans - MangaWild';
      desc = 'Unlock all locked VIP manga chapters, read without delays, and directly support indie mangaka artists.';
    } else if (currentView === 'library') {
      title = 'My Manga Library & Bookmarks - MangaWild';
      desc = 'Access your saved manga collection, reading history, and bookmarked chapters.';
    } else if (currentView === 'creators') {
      title = 'Featured Indie Manga Creators & Artists - MangaWild';
      desc = 'Meet the mangaka and artists behind MangaWild original series and follow their journeys.';
    } else if (currentView === 'news') {
      title = 'Manga Community News, Releases & Announcements - MangaWild';
      desc = 'Stay updated with the latest manga releases, author interviews, and community updates on MangaWild.';
    }

    document.title = title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
    // Update og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    // Update og:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', desc);
    }
  }, [currentView, viewParams]);

  const handleSelectSeries = (seriesId: string) => {
    handleNavigate('series', { id: seriesId });
  };

  const handleReadChapter = (seriesId: string, chapterId: string) => {
    handleNavigate('read', { seriesId, chapterId });
  };

  // If currently reading, render the ReaderPage full screen without header/footer
  if (currentView === 'read') {
    const effectiveSeriesId = viewParams.seriesId || viewParams.id;
    if (effectiveSeriesId) {
      let effectiveChapterId = viewParams.chapterId;
      if (!effectiveChapterId) {
        const chs = StorageService.getChapters(effectiveSeriesId);
        effectiveChapterId = chs[0]?.id;
      }

      if (effectiveChapterId) {
        return (
          <div className="min-h-screen bg-[#050608]">
            <ReaderPage
              seriesId={effectiveSeriesId}
              chapterId={effectiveChapterId}
              onNavigate={handleNavigate}
              onOpenVIPModal={() => handleOpenVIPModal('monthly')}
            />
            <RazorpayCheckoutModal
              isOpen={isVIPModalOpen}
              planId={selectedPlanId}
              onClose={() => setIsVIPModalOpen(false)}
              onSuccess={() => {
                setIsVIPModalOpen(false);
              }}
            />
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={closeAuthModal}
              defaultRole={authModalOptions.defaultRole || 'reader'}
              defaultMode={authModalOptions.defaultMode || 'signup'}
              customTitle={authModalOptions.title}
              customSubtitle={authModalOptions.subtitle}
              onSuccess={() => {
                if (authModalOptions.onSuccess) {
                  authModalOptions.onSuccess();
                }
                closeAuthModal();
              }}
            />
          </div>
        );
      }
    }
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Strict 3-zone Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenVIPModal={() => handleOpenVIPModal('monthly')}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onSelectSeries={handleSelectSeries}
            onReadChapter={handleReadChapter}
            onNavigate={handleNavigate}
            onOpenVIPModal={() => handleOpenVIPModal('monthly')}
          />
        )}

        {currentView === 'new_series' && (
          <BrowsePage
            onSelectSeries={handleSelectSeries}
            onOpenVIPModal={() => handleOpenVIPModal('monthly')}
            onNavigate={handleNavigate}
            initialSortBy="latest"
            isNewSeriesView={true}
          />
        )}

        {(currentView === 'browse' || currentView === 'trending') && (
          <BrowsePage
            onSelectSeries={handleSelectSeries}
            onOpenVIPModal={() => handleOpenVIPModal('monthly')}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'series' && viewParams.id && (
          <SeriesDetailPage
            seriesId={viewParams.id}
            onReadChapter={handleReadChapter}
            onNavigate={handleNavigate}
            onOpenVIPModal={() => handleOpenVIPModal('monthly')}
          />
        )}

        {currentView === 'creator' && (
          <CreatorDashboardPage
            onNavigate={handleNavigate}
            onPreviewChapter={handleReadChapter}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardPage
            onNavigate={handleNavigate}
            onPreviewChapter={handleReadChapter}
          />
        )}

        {currentView === 'membership' && (
          <MembershipPage
            onOpenVIPModal={handleOpenVIPModal}
          />
        )}

        {currentView === 'library' && (
          <LibraryPage
            onSelectSeries={handleSelectSeries}
            onReadChapter={handleReadChapter}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'creators' && (
          <CreatorsDirectoryPage
            onNavigate={handleNavigate}
            onSelectSeries={handleSelectSeries}
          />
        )}

        {currentView === 'creator-profile' && (
          <CreatorProfilePage
            creatorId={viewParams.id}
            authorName={viewParams.author}
            onNavigate={handleNavigate}
            onSelectSeries={handleSelectSeries}
          />
        )}

        {currentView === 'news' && (
          <NewsPage />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenVIPModal={() => handleOpenVIPModal('monthly')}
      />

      {/* Global Razorpay Checkout Modal */}
      <RazorpayCheckoutModal
        isOpen={isVIPModalOpen}
        planId={selectedPlanId}
        onClose={() => setIsVIPModalOpen(false)}
        onSuccess={() => {
          setIsVIPModalOpen(false);
        }}
      />

      {/* Global Search & Genre Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSeries={handleSelectSeries}
      />

      {/* Global Auth Modal triggered by purchases, login, or actions */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultRole={authModalOptions.defaultRole || 'reader'}
        defaultMode={authModalOptions.defaultMode || 'signup'}
        customTitle={authModalOptions.title}
        customSubtitle={authModalOptions.subtitle}
        onSuccess={() => {
          if (authModalOptions.onSuccess) {
            authModalOptions.onSuccess();
          }
          closeAuthModal();
        }}
      />

      {/* Minimal Bottom Navigation Bar Dock (matches screenshot) */}
      <BottomNavBar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenProfileMenu={() => window.dispatchEvent(new CustomEvent('mw-toggle-menu'))}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

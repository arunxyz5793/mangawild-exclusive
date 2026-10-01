/**
 * MangaWild Exclusive - Multi-Language Localization System
 */

export type Language = 'en' | 'hi' | 'ja';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    browse: string;
    trending: string;
    exclusiveVIP: string;
    creators: string;
    news: string;
    reader: string;
    library: string;
    creatorDashboard: string;
    adminDashboard: string;
    signIn: string;
    signOut: string;
    myAccount: string;
  };
  banner: {
    badge: string;
    title: string;
    subtitle: string;
    becomeCreator: string;
    howEarningsWork: string;
    reads: string;
    creatorsPublishing: string;
    chaptersLive: string;
    originalSeries: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  sections: {
    supernaturalRecs: string;
    trendingWeek: string;
    newlyReleased: string;
    newChapters: string;
    newCreators: string;
    worldwideNews: string;
    allGenres: string;
    viewAll: string;
    moreSupernatural: string;
    follow: string;
    following: string;
    freeTag: string;
    vipTag: string;
    chapters: string;
    readsCount: string;
  };
  reader: {
    verticalScroll: string;
    pageFlip: string;
    fitWidth: string;
    fitPage: string;
    brightness: string;
    prevChapter: string;
    nextChapter: string;
    panel: string;
    of: string;
    comments: string;
    lockedTitle: string;
    lockedDesc: string;
    unlockVIP: string;
    freePreviewNotice: string;
  };
  membership: {
    title: string;
    subtitle: string;
    monthlyPlan: string;
    yearlyPlan: string;
    perMonth: string;
    perYear: string;
    savePercentage: string;
    subscribeNow: string;
    activeMembership: string;
    razorpayGuaranteed: string;
    featuresIncluded: string;
    upiCardsNetbanking: string;
  };
  creator: {
    dashboardTitle: string;
    mySeries: string;
    uploadNewSeries: string;
    chapterManager: string;
    panelFixer: string;
    earningsSummary: string;
    inReviewNotice: string;
    submitForAdminReview: string;
    dragPanelsToReorder: string;
    fixPanelError: string;
    addPanel: string;
    removePanel: string;
    resolutionCheck: string;
  };
  admin: {
    dashboardTitle: string;
    moderationQueue: string;
    pendingSeriesChapters: string;
    approvePublish: string;
    requestChanges: string;
    reject: string;
    creatorsManagement: string;
    usersAndRoles: string;
    paymentLogs: string;
    platformSettings: string;
    reviewerFeedback: string;
  };
}

const enTranslations: Translations = {
  appName: 'MangaWild Exclusive',
  tagline: 'Premium Original Manga Publishing & Reading Platform',
    nav: {
      browse: 'Browse',
      trending: 'Trending',
      exclusiveVIP: 'VIP Exclusive',
      creators: 'Creators',
      news: 'Manga News',
      reader: 'Reader',
      library: 'My Library',
      creatorDashboard: 'Creator Studio',
      adminDashboard: 'Admin Desk',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      myAccount: 'Account & Billing',
    },
    banner: {
      badge: 'MangaWild Spotlight',
      title: 'Unleash Original Stories. Experience Pure Manga.',
      subtitle: 'Dive into thrilling supernatural sagas, mythic urban fantasies, and sports adrenaline created by visionary independent artists.',
      becomeCreator: 'Start Publishing — Creator Studio',
      howEarningsWork: 'Creator Royalties & Payouts',
      reads: 'active readers',
      creatorsPublishing: 'pro creators',
      chaptersLive: 'chapters online',
      originalSeries: 'exclusive series',
      step1Title: 'Direct Studio Upload',
      step1Desc: 'Upload pages, arrange reading flows, and scan for panel errors in real-time.',
      step2Title: 'Build Your Global Fanbase',
      step2Desc: 'Featured spotlights, weekly release calendars, and reader discussions.',
      step3Title: 'Fair Monetization',
      step3Desc: '70% subscription revenue share, direct UPI payouts, and complete creator copyright ownership.',
    },
    sections: {
      supernaturalRecs: 'Because You Read Supernatural',
      trendingWeek: 'Trending this week',
      newlyReleased: 'Newly Released & Popular Series',
      newChapters: 'New chapters',
      newCreators: 'New creators',
      worldwideNews: 'Worldwide Manga News',
      allGenres: 'All',
      viewAll: 'View all →',
      moreSupernatural: 'More Supernatural →',
      follow: 'Follow',
      following: 'Following',
      freeTag: 'Free',
      vipTag: 'VIP Exclusive',
      chapters: 'ch',
      readsCount: 'reads this week',
    },
    reader: {
      verticalScroll: 'Webtoon Vertical',
      pageFlip: 'Manga Page Flip',
      fitWidth: 'Fit Width',
      fitPage: 'Fit Screen',
      brightness: 'Brightness',
      prevChapter: 'Previous Chapter',
      nextChapter: 'Next Chapter',
      panel: 'Panel',
      of: 'of',
      comments: 'Discussion',
      lockedTitle: 'Exclusive VIP Chapter',
      lockedDesc: 'This chapter is reserved for MangaWild Exclusive members or early-access patrons. Support the artist directly to read now.',
      unlockVIP: 'Unlock with MangaWild VIP Pass (₹199/mo)',
      freePreviewNotice: 'Free chapters available for all registered readers.',
    },
    membership: {
      title: 'Join MangaWild Exclusive VIP',
      subtitle: 'Unlimited access to premiere manga, early release chapters, and 70% direct royalty payout to indie manga creators.',
      monthlyPlan: 'Monthly VIP Pass',
      yearlyPlan: 'Annual VIP Pass',
      perMonth: '/ month',
      perYear: '/ year',
      savePercentage: 'Save 37%',
      subscribeNow: 'Subscribe with Razorpay',
      activeMembership: 'VIP Member Active',
      razorpayGuaranteed: 'Secure Payments via Razorpay · Instant Activation · Cancel anytime',
      featuresIncluded: 'All exclusive chapters unlocked · 100% Ad-Free · HD Page Reader · VIP Badge on Comments',
      upiCardsNetbanking: 'Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & Netbanking',
    },
    creator: {
      dashboardTitle: 'MangaWild Creator Studio',
      mySeries: 'My Manga Series',
      uploadNewSeries: 'Create New Manga',
      chapterManager: 'Chapter & Panel Manager',
      panelFixer: 'Interactive Panel Fixer & Scanner',
      earningsSummary: 'Royalty & UPI Payouts',
      inReviewNotice: 'Every submitted chapter undergoes rapid Admin review to maintain reading quality and safety.',
      submitForAdminReview: 'Submit Chapter for Admin Review',
      dragPanelsToReorder: 'Drag or click up/down to arrange reading flow',
      fixPanelError: 'Fix Panel / Replace Scan',
      addPanel: 'Add New Panel',
      removePanel: 'Delete Panel',
      resolutionCheck: 'Aspect Ratio & Sharpness Verified',
    },
    admin: {
      dashboardTitle: 'MangaWild Editorial Admin Console',
      moderationQueue: 'Content Review Queue',
      pendingSeriesChapters: 'Pending Series & Chapters',
      approvePublish: 'Approve & Publish Live',
      requestChanges: 'Request Changes',
      reject: 'Reject Submission',
      creatorsManagement: 'Creator Verification & Approvals',
      usersAndRoles: 'User Management & Role Permissions',
      paymentLogs: 'Razorpay Transactions & Invoices',
      platformSettings: 'Site Settings & System Announcements',
      reviewerFeedback: 'Reviewer Notes / Feedback to Creator',
    },
};

// Site default native language is pure English across all settings
export const TRANSLATIONS: Record<Language, Translations> = {
  en: enTranslations,
  hi: enTranslations,
  ja: enTranslations,
};


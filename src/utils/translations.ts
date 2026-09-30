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

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
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
  },
  hi: {
    appName: 'मांगा वाइल्ड एक्सक्लूसिव',
    tagline: 'भारत और दुनिया का पहला प्रीमियम मांगा पब्लिशिंग प्लेटफॉर्म',
    nav: {
      browse: 'खोजें (Browse)',
      trending: 'ट्रेंडिंग (Trending)',
      exclusiveVIP: 'वीआईपी एक्सक्लूसिव',
      creators: 'रचनाकार (Creators)',
      news: 'मांगा समाचार',
      reader: 'रीडर',
      library: 'मेरी लाइब्रेरी',
      creatorDashboard: 'क्रिएटर स्टूडियो',
      adminDashboard: 'एडमिन डेस्क',
      signIn: 'साइन इन करें',
      signOut: 'लॉग आउट',
      myAccount: 'खाता एवं बिलिंग',
    },
    banner: {
      badge: 'क्रिएटर्स के लिए',
      title: 'अपनी मांगा पब्लिश करें। पाठक बनाएं। अपनी कला से कमाई करें।',
      subtitle: 'भारतीय पौराणिक कथाओं, शहरी रोमांच और फैंटेसी पर आधारित अनूठी कहानियां — क्रिएटर्स द्वारा, पाठकों के लिए।',
      becomeCreator: 'क्रिएटर बनें — बिल्कुल मुफ्त',
      howEarningsWork: 'कमाई कैसे काम करती है',
      reads: 'चैप्टर पढ़े गए',
      creatorsPublishing: 'सक्रिय क्रिएटर्स',
      chaptersLive: 'लाइव चैप्टर्स',
      originalSeries: 'ओरिजिनल सीरीज',
      step1Title: 'अपने पेज अपलोड करें',
      step1Desc: 'इमेज, जिप या हमारे पैनल एडिटर से अपलोड करें — एडमिन रिव्यू के बाद तुरंत पब्लिश।',
      step2Title: 'पाठक पाएं',
      step2Desc: 'ट्रेंडिंग चार्ट्स और होमपेज से लाखों पाठकों तक पहुंचें।',
      step3Title: 'अपनी कला से कमाएं',
      step3Desc: '70% सब्सक्रिप्शन रॉयल्टी और 100% टिप्स सीधे आपके UPI में।',
    },
    sections: {
      supernaturalRecs: 'क्योंकि आपने सुपरनैचुरल पढ़ा',
      trendingWeek: 'इस सप्ताह ट्रेंडिंग',
      newlyReleased: 'नई और लोकप्रिय सीरीज',
      newChapters: 'नए चैप्टर्स',
      newCreators: 'नए क्रिएटर्स',
      worldwideNews: 'ग्लोबल मांगा न्यूज़',
      allGenres: 'सभी (All)',
      viewAll: 'सभी देखें →',
      moreSupernatural: 'अधिक सुपरनैचुरल →',
      follow: 'फॉलो करें',
      following: 'फॉलो किया गया',
      freeTag: 'मुफ्त (Free)',
      vipTag: 'वीआईपी एक्सक्लूसिव',
      chapters: 'अध्याय',
      readsCount: 'इस हफ्ते पढ़ा गया',
    },
    reader: {
      verticalScroll: 'वेबटून वर्टिकल स्क्रॉल',
      pageFlip: 'मांगा पेज फ्लिप (जापानी स्टाइल)',
      fitWidth: 'चौड़ाई फिट करें',
      fitPage: 'स्क्रीन में फिट करें',
      brightness: 'ब्राइटनेस',
      prevChapter: 'पिछला अध्याय',
      nextChapter: 'अगला अध्याय',
      panel: 'पैनल',
      of: 'का',
      comments: 'पाठक चर्चा',
      lockedTitle: 'एक्सक्लूसिव वीआईपी अध्याय',
      lockedDesc: 'यह अध्याय केवल मांगा वाइल्ड एक्सक्लूसिव मेंबर्स के लिए है। अभी सपोर्ट करें और तुरंत पढ़ें।',
      unlockVIP: 'वीआईपी पास से अनलॉक करें (₹199/माह)',
      freePreviewNotice: 'मुफ्त अध्याय सभी पाठकों के लिए उपलब्ध हैं।',
    },
    membership: {
      title: 'मांगा वाइल्ड एक्सक्लूसिव वीआईपी सदस्य बनें',
      subtitle: 'सभी एक्सक्लूसिव अध्यायों तक असीमित पहुंच, प्रारंभिक रिलीज, और क्रिएटर्स को 70% सीधी रॉयल्टी।',
      monthlyPlan: 'मासिक वीआईपी पास',
      yearlyPlan: 'वार्षिक वीआईपी पास',
      perMonth: '/ महीना',
      perYear: '/ वर्ष',
      savePercentage: '37% की बचत',
      subscribeNow: 'Razorpay से सब्सक्राइब करें',
      activeMembership: 'वीआईपी सदस्यता सक्रिय है',
      razorpayGuaranteed: 'Razorpay द्वारा 100% सुरक्षित भुगतान · तुरंत सक्रिय · कभी भी रद्द करें',
      featuresIncluded: 'सभी एक्सक्लूसिव अध्याय अनलॉक · विज्ञापन-मुक्त · एचडी पैनल रीडर · विशेष वीआईपी बैज',
      upiCardsNetbanking: 'UPI (GPay, PhonePe, Paytm), कार्ड और नेटबैंकिंग समर्थित',
    },
    creator: {
      dashboardTitle: 'मांगा वाइल्ड क्रिएटर स्टूडियो',
      mySeries: 'मेरी मांगा सीरीज',
      uploadNewSeries: 'नई सीरीज बनाएं',
      chapterManager: 'चैप्टर एवं पैनल मैनेजर',
      panelFixer: 'इंटरैक्टिव पैनल फिक्सर और स्कैनर',
      earningsSummary: 'रॉयल्टी और UPI पेआउट',
      inReviewNotice: 'हर सबमिट किया गया चैप्टर गुणवत्ता और सुरक्षा सुनिश्चित करने के लिए एडमिन रिव्यू से गुजरता है।',
      submitForAdminReview: 'एडमिन रिव्यू के लिए सबमिट करें',
      dragPanelsToReorder: 'पैनल का क्रम बदलने के लिए ऊपर-नीचे करें',
      fixPanelError: 'पैनल त्रुटि सुधारें / नया स्कैन लगाएं',
      addPanel: 'नया पैनल जोड़ें',
      removePanel: 'पैनल हटाएं',
      resolutionCheck: 'आस्पेक्ट रेशियो और शार्पनेस सत्यापित',
    },
    admin: {
      dashboardTitle: 'मांगा वाइल्ड एडमिन कंसोल',
      moderationQueue: 'कंटेंट रिव्यू कतार',
      pendingSeriesChapters: 'लंबित सीरीज और चैप्टर्स',
      approvePublish: 'स्वीकृत करें और लाइव करें',
      requestChanges: 'सुधार का अनुरोध करें',
      reject: 'अस्वीकृत करें',
      creatorsManagement: 'क्रिएटर वेरिफिकेशन और अनुमोदन',
      usersAndRoles: 'यूजर प्रबंधन और भूमिका अनुमतियां',
      paymentLogs: 'Razorpay लेनदेन एवं बिलिंग',
      platformSettings: 'प्लेटफॉर्म सेटिंग्स व घोषणाएं',
      reviewerFeedback: 'क्रिएटर को फीडबैक / निर्देश',
    },
  },
  ja: {
    appName: 'MangaWild Exclusive',
    tagline: 'プレミアム マンガ パブリッシング＆リーダー',
    nav: {
      browse: '探す (Browse)',
      trending: 'トレンド (Trending)',
      exclusiveVIP: 'VIP限定',
      creators: 'クリエイター',
      news: 'マンガニュース',
      reader: 'リーダー',
      library: 'マイライブラリ',
      creatorDashboard: 'クリエイタースタジオ',
      adminDashboard: '管理コンソール',
      signIn: 'ログイン',
      signOut: 'ログアウト',
      myAccount: 'アカウント・請求',
    },
    banner: {
      badge: 'クリエイター向け',
      title: 'マンガを投稿しよう。読者を広げよう。作品で収益化。',
      subtitle: '神話、伝承、都市型ファンタジー — 才能あふれるクリエイターの作品を世界中の読者へ。',
      becomeCreator: 'クリエイター登録（無料）',
      howEarningsWork: '収益の仕組み',
      reads: 'チャプター閲覧数',
      creatorsPublishing: '投稿クリエイター',
      chaptersLive: '公開チャプター',
      originalSeries: 'オリジナルシリーズ',
      step1Title: '原稿をアップロード',
      step1Desc: '画像・ZIPファイル対応。審査後すぐに全世界へ公開。',
      step2Title: 'ファンを獲得',
      step2Desc: 'トレンドチャートやジャンル別特集であなたの作品を強力プロモーション。',
      step3Title: '収益を受け取る',
      step3Desc: '課金・購読収益の70%および投げ銭の100%を還元。',
    },
    sections: {
      supernaturalRecs: '超常現象・ダークファンタジー特集',
      trendingWeek: '今週のトレンド',
      newlyReleased: '新作・人気タイトル',
      newChapters: '新着チャプター',
      newCreators: '注目のクリエイター',
      worldwideNews: '世界マンガ速報',
      allGenres: 'すべて',
      viewAll: 'もっと見る →',
      moreSupernatural: '超常現象をもっと見る →',
      follow: 'フォロー',
      following: 'フォロー中',
      freeTag: '無料',
      vipTag: 'VIP限定',
      chapters: '話',
      readsCount: '今週の閲覧',
    },
    reader: {
      verticalScroll: '縦スクロール (Webtoon)',
      pageFlip: '見開き・ページ送り',
      fitWidth: '幅に合わせる',
      fitPage: '画面全体',
      brightness: '明度調整',
      prevChapter: '前の話',
      nextChapter: '次の話',
      panel: 'コマ',
      of: '/',
      comments: 'コメント',
      lockedTitle: 'VIP限定チャプター',
      lockedDesc: 'このチャプターはVIP会員限定または先行配信です。クリエイターを支援して今すぐ読もう。',
      unlockVIP: 'VIPパスで解除 (₹199/月)',
      freePreviewNotice: '無料チャプターは会員登録ですぐにお読みいただけます。',
    },
    membership: {
      title: 'MangaWild VIP メンバーシップ',
      subtitle: '全限定マンガの読み放題、先行配信、そしてクリエイターへの70%直接還元。',
      monthlyPlan: '月額VIPパス',
      yearlyPlan: '年額VIPパス',
      perMonth: '/ 月',
      perYear: '/ 年',
      savePercentage: '37%お得',
      subscribeNow: 'Razorpayで申し込む',
      activeMembership: 'VIP会員 有効',
      razorpayGuaranteed: 'Razorpay安全決済 · 即時有効化 · いつでも解約可能',
      featuresIncluded: '全VIP限定話アンロック · 完全広告なし · 高画質ビューア · コメントVIPバッジ',
      upiCardsNetbanking: 'UPI、クレジットカード、デビットカード対応',
    },
    creator: {
      dashboardTitle: 'クリエイタースタジオ',
      mySeries: '投稿したマンガ',
      uploadNewSeries: '新規マンガ作成',
      chapterManager: 'チャプター・コマ管理',
      panelFixer: 'コマ画像補正・スキャナー',
      earningsSummary: '収益と振込先設定',
      inReviewNotice: '読者に安全で高品質な体験を提供するため、投稿された全話は迅速な審査を経て公開されます。',
      submitForAdminReview: '審査へ提出する',
      dragPanelsToReorder: 'コマの並び順を調整',
      fixPanelError: '画像の差し替え・修正',
      addPanel: 'コマを追加',
      removePanel: 'コマを削除',
      resolutionCheck: '解像度・アスペクト比確認済み',
    },
    admin: {
      dashboardTitle: '編集部 管理デスク',
      moderationQueue: '作品審査キュー',
      pendingSeriesChapters: '審査待ちの作品・話',
      approvePublish: '承認して即時公開',
      requestChanges: '修正を要請する',
      reject: '却下',
      creatorsManagement: 'クリエイター認証と管理',
      usersAndRoles: 'ユーザー管理と権限設定',
      paymentLogs: 'Razorpay決済履歴',
      platformSettings: 'サイト設定と全体通知',
      reviewerFeedback: 'クリエイターへのフィードバック',
    },
  },
};

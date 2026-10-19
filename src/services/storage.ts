/**
 * MangaWild - Official Production Data Engine & Local Storage Persistence
 * Authentically synced with https://www.mangawild.online/
 */

import { User, UserRole } from '../types/auth';
import {
  MangaSeries,
  Chapter,
  ChapterPanel,
  CreatorProfile,
  Comment,
  SeriesReview,
  ReviewSummary,
  ReadingHistoryItem,
  PaymentRecord,
  PlatformNotification,
  WorldwideMangaNews,
  UserReport,
} from '../types/manga';
import { generateMangaCoverSvg, generateChapterPanelSvg } from '../utils/mangaAssets';

const STORAGE_KEYS = {
  USERS: 'mw_users_v4',
  CURRENT_USER: 'mw_current_user_v4',
  SERIES: 'mw_series_v4',
  CHAPTERS: 'mw_chapters_v4',
  CREATORS: 'mw_creators_v4',
  COMMENTS: 'mw_comments_v5',
  REVIEWS: 'mw_reviews_v5',
  READING_HISTORY: 'mw_history_v4',
  BOOKMARKS: 'mw_bookmarks_v4',
  LIKED_SERIES: 'mw_liked_series_v4',
  PAYMENTS: 'mw_payments_v4',
  NOTIFICATIONS: 'mw_notifications_v4',
  FOLLOWED_CREATORS: 'mw_followed_creators_v4',
  REPORTS: 'mw_user_reports_v1',
  PASSWORD_RESETS: 'mw_password_resets_v1',
};

// Official System Administrator Configuration
export const OFFICIAL_ADMIN = {
  id: 'user_admin_01',
  email: 'admin@mangawild.com',
  altEmail: 'callmedevoc@gmail.com',
  username: 'admin',
  password: 'Admin@Wild2026',
};

// Seed Users
const INITIAL_USERS: User[] = [
  {
    "id": "user_admin_01",
    "email": "admin@mangawild.com",
    "name": "Admin",
    "username": "admin",
    "password": "Admin@Wild2026",
    "role": "admin",
    "avatarUrl": "/avatars/admin.svg",
    "isVIP": true,
    "createdAt": "2026-01-01T00:00:00Z"
  },
  {
    "id": "user_creator_deep",
    "email": "deep@mangawild.online",
    "name": "deep_mangaka",
    "username": "deep_mangaka",
    "password": "password123",
    "role": "creator",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7462bc7a3d20.36721854_1000320735.jpg",
    "isVIP": false,
    "creatorProfileId": "creator_deep_mangaka",
    "createdAt": "2026-01-05T00:00:00Z"
  },
  {
    "id": "user_creator_flad",
    "email": "fladz@mangawild.online",
    "name": "flad_z",
    "username": "flad_z",
    "password": "password123",
    "role": "creator",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12639bb7eff1.25665941_1000305668.png",
    "isVIP": false,
    "creatorProfileId": "creator_flad_z",
    "createdAt": "2026-01-10T00:00:00Z"
  },
  {
    "id": "user_creator_jay",
    "email": "jay@mangawild.online",
    "name": "jay_artist",
    "username": "jay_artist",
    "password": "password123",
    "role": "creator",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23ae06c732d3.48371140_1000309056.png",
    "isVIP": false,
    "creatorProfileId": "creator_jay",
    "createdAt": "2026-01-15T00:00:00Z"
  },
  {
    "id": "user_creator_vikalp",
    "email": "vikalp@mangawild.online",
    "name": "vikalp_draws",
    "username": "vikalp_draws",
    "password": "password123",
    "role": "creator",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a17c073d7a2d4.64550190_1000306730.png",
    "isVIP": false,
    "creatorProfileId": "creator_vikalp_draws",
    "createdAt": "2026-01-20T00:00:00Z"
  },
  {
    "id": "user_creator_aries",
    "email": "aries@mangawild.online",
    "name": "aries_chitrakatha",
    "username": "aries_chitrakatha",
    "password": "password123",
    "role": "creator",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f45d1311d958.61477609_1000300162.png",
    "isVIP": false,
    "creatorProfileId": "creator_arieschitrakatha",
    "createdAt": "2026-01-25T00:00:00Z"
  },
  {
    "id": "user_vip_01",
    "email": "vip.reader@mangawild.online",
    "name": "rahul_otaku",
    "username": "rahul_otaku",
    "password": "password123",
    "role": "subscriber",
    "avatarUrl": "/avatars/avatar-1.svg",
    "isVIP": true,
    "subscription": {
      "planId": "monthly",
      "status": "active",
      "startDate": "2026-09-01T00:00:00Z",
      "expiresAt": "2026-10-01T00:00:00Z",
      "razorpayPaymentId": "pay_MW_SAMPLE_998"
    },
    "createdAt": "2026-02-01T00:00:00Z"
  },
  {
    "id": "user_free_01",
    "email": "guest.reader@mangawild.online",
    "name": "tanvi_manga",
    "username": "tanvi_manga",
    "password": "password123",
    "role": "free_user",
    "avatarUrl": "/avatars/avatar-2.svg",
    "isVIP": false,
    "createdAt": "2026-03-15T00:00:00Z"
  }
];

// Seed Creators from mangawild.online
const INITIAL_CREATORS: CreatorProfile[] = [
  {
    "id": "creator_deep_mangaka",
    "userId": "user_creator_deep",
    "penName": "Deep Mangaka",
    "handle": "@deep_mangaka",
    "bio": "Independent manga artist who usually draws traditionally. Bringing original dark mystery, psychological horror, and slice-of-life manga to a global audience.",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7462bc7a3d20.36721854_1000320735.jpg",
    "socialLinks": {
      "instagram": "https://instagram.com/deep_mangaka",
      "twitter": "https://x.com/deep_mangaka",
      "facebook": "https://facebook.com/deep.mangaka",
      "youtube": "https://youtube.com/@deep_mangaka",
      "website": "https://mangawild.online/creators/deep"
    },
    "followersCount": 0,
    "seriesCount": 4,
    "totalReads": 0,
    "monthlyEarningsInr": 0,
    "revenueSharePercent": 70,
    "upiId": "deep.mangaka@okhdfcbank",
    "bankAccountHolder": "Deep Mangaka",
    "verified": true,
    "joinedAt": "2026-01-05T00:00:00Z"
  },
  {
    "id": "creator_flad_z",
    "userId": "user_creator_flad",
    "penName": "Flad Z",
    "handle": "@fladez",
    "bio": "Aspiring mangaka and young artist who loves creating cool art and unique stories. A chill guy who draws for fun, keeps it real, and crafts chaotic absurdist adventures.",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12639bb7eff1.25665941_1000305668.png",
    "socialLinks": {
      "instagram": "https://instagram.com/fladez_art",
      "twitter": "https://x.com/fladez_art",
      "discord": "https://discord.gg/mangawild",
      "youtube": "https://youtube.com/@fladz"
    },
    "followersCount": 0,
    "seriesCount": 1,
    "totalReads": 0,
    "monthlyEarningsInr": 0,
    "revenueSharePercent": 70,
    "upiId": "fladz.art@okaxis",
    "bankAccountHolder": "Flad Z",
    "verified": true,
    "joinedAt": "2026-01-10T00:00:00Z"
  },
  {
    "id": "creator_jay",
    "userId": "user_creator_jay",
    "penName": "Jay",
    "handle": "@jay_manga",
    "bio": "Aspiring mangaka crafting suspenseful wilderness thrillers, psychological mysteries, and dark forest survival stories.",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23ae06c732d3.48371140_1000309056.png",
    "socialLinks": {
      "instagram": "https://instagram.com/jay_manga_arts",
      "twitter": "https://x.com/jay_manga",
      "facebook": "https://facebook.com/jay.mangaka"
    },
    "followersCount": 0,
    "seriesCount": 1,
    "totalReads": 0,
    "monthlyEarningsInr": 0,
    "revenueSharePercent": 70,
    "upiId": "jay.manga@paytm",
    "bankAccountHolder": "Jay",
    "verified": true,
    "joinedAt": "2026-01-15T00:00:00Z"
  },
  {
    "id": "creator_vikalp_draws",
    "userId": "user_creator_vikalp",
    "penName": "Vikalp Draws (OPUSHON)",
    "handle": "@vikalp_draws",
    "bio": "Indie creator & visual artist. Discover beautifully crafted one-shots exploring heartfelt emotional reflections, sacred promises, and fantasy themes.",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a17c073d7a2d4.64550190_1000306730.png",
    "socialLinks": {
      "instagram": "https://instagram.com/vikalp_draws",
      "twitter": "https://x.com/vikalp_draws",
      "youtube": "https://youtube.com/@vikalp_draws"
    },
    "followersCount": 0,
    "seriesCount": 1,
    "totalReads": 0,
    "monthlyEarningsInr": 0,
    "revenueSharePercent": 70,
    "upiId": "vikalp.draws@ybl",
    "bankAccountHolder": "Vikalp Draws",
    "verified": true,
    "joinedAt": "2026-01-20T00:00:00Z"
  },
  {
    "id": "creator_arieschitrakatha",
    "userId": "user_creator_aries",
    "penName": "Arieschitrakatha",
    "handle": "@team_arieschitrakatha",
    "bio": "Collaborative comic collective consisting of Ankush, Sarathi, Akansha, Yashu, Haru, and Moumita. Dedicated to rich sci-fi sagas and otherworldly adventure manga.",
    "avatarUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f45d1311d958.61477609_1000300162.png",
    "socialLinks": {
      "instagram": "https://instagram.com/arieschitrakatha",
      "facebook": "https://facebook.com/arieschitrakatha",
      "youtube": "https://youtube.com/@arieschitrakatha",
      "website": "https://arieschitrakatha.com"
    },
    "followersCount": 0,
    "seriesCount": 1,
    "totalReads": 0,
    "monthlyEarningsInr": 0,
    "revenueSharePercent": 70,
    "upiId": "team.aries@sbi",
    "bankAccountHolder": "Aries Chitrakatha",
    "verified": true,
    "joinedAt": "2026-01-25T00:00:00Z"
  }
];

// Seed Manga Series from mangawild.online
const INITIAL_SERIES: MangaSeries[] = [
  {
    "id": "series_silent_heads",
    "title": "SILENT HEADS",
    "titleJapanese": "\u30b5\u30a4\u30ec\u30f3\u30c8\u30fb\u30d8\u30c3\u30ba",
    "slug": "silent-heads",
    "synopsis": "Established in 14th century India. A mysterious killer randomly starts killing people. Prathoksh who handles this case discovers more murders. As the story goes, the mystery behind the killer gets more creepy and uncanny.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d2da116131.63252921_1000331958.jpg",
    "bannerUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d2da116131.63252921_1000331958.jpg",
    "author": "Deep Mangaka",
    "artist": "Deep Mangaka",
    "creatorId": "creator_deep_mangaka",
    "genres": [
      "Mystery",
      "Horror",
      "Dark Fantasy"
    ],
    "status": "ongoing",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.9,
    "releaseYear": 2026,
    "isExclusive": true,
    "isTrending": true,
    "rankNumber": 1,
    "tags": [
      "14th Century",
      "Serial Killer",
      "Historical Mystery",
      "Uncanny Horror",
      "India"
    ],
    "createdAt": "2026-01-10T00:00:00Z",
    "updatedAt": "2026-09-27T00:00:00Z"
  },
  {
    "id": "series_randamu_boken",
    "title": "Randamu Boken",
    "titleJapanese": "\u30e9\u30f3\u30c0\u30e0\u5192\u967a",
    "slug": "randamu-boken",
    "synopsis": "Two chaotic teens, Asun and Prol, get dragged into a bizarre world where random events turn deadly\u2014like the mysterious Starfall Abyss that pulls them into a dangerous dimension. After barely surviving a madman, they\u2019re thrown into a desert where a stolen gem has caused a giant sandworm to go on a rampage. Now stuck in a world full of nonsense and danger, they must survive the chaos\u2026 while uncovering the truth behind why everything is so broken.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a87137777dab3.48759567_1000323788.jpg",
    "bannerUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a871274e871c1.28942451_1000324206.png",
    "author": "Flad Z",
    "artist": "Flad Z",
    "creatorId": "creator_flad_z",
    "genres": [
      "Dark Comedy",
      "Action",
      "Sci-Fi",
      "Adventure"
    ],
    "status": "ongoing",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.8,
    "releaseYear": 2026,
    "isExclusive": false,
    "isTrending": true,
    "rankNumber": 2,
    "tags": [
      "Absurdist Fiction",
      "Dark Comedy",
      "Dimension Shift",
      "Sandworm",
      "Sci-Fi"
    ],
    "createdAt": "2026-01-18T00:00:00Z",
    "updatedAt": "2026-09-28T00:00:00Z"
  },
  {
    "id": "series_the_trek",
    "title": "THE TREK - a point of no return",
    "titleJapanese": "ザ・トレック",
    "slug": "the-trek-a-point-of-no-return",
    "synopsis": "THE TREK: Point of No Return. Six friends. One trek. A dense forest filled with unanswered questions. What begins as a simple adventure soon takes an unexpected turn as strange, terrifying events begin to unfold deep within the wilderness. Some journeys change you forever.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a29076d89c372.16893369_1000309960.jpg",
    "bannerUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2bd2ef261ae3.40628049_1000310677.jpg",
    "author": "Jay",
    "artist": "Jay",
    "creatorId": "creator_jay",
    "genres": [
      "Mystery",
      "Horror",
      "Thriller"
    ],
    "status": "completed",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.9,
    "releaseYear": 2026,
    "isExclusive": false,
    "isTrending": true,
    "rankNumber": 3,
    "tags": [
      "Forest Horror",
      "Wilderness",
      "Survival Thriller",
      "Six Friends",
      "Mystery"
    ],
    "createdAt": "2026-02-05T00:00:00Z",
    "updatedAt": "2026-09-15T00:00:00Z"
  },
  {
    "id": "series_chitrakatha_chintu",
    "title": "Chitra Khatha Chintu",
    "titleJapanese": "チントゥの地球漂流記",
    "slug": "chitrakatha-chintu",
    "synopsis": "“Crash-landed on a strange planet... alone.” An alien finds himself stranded on Earth after a sudden cosmic accident separates him from his spaceship. With no knowledge of this unfamiliar world, every step he takes is filled with danger, mystery, and unexpected encounters. Lost and confused, he has only one goal — find his spaceship and return home. But on a planet he doesn’t understand... can he survive long enough to find it? Or will Earth become his new prison forever? 🌍",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69fb04706d6c19.15945013_1000301442.png",
    "bannerUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69da3e114cd0e0.37468586_1000295904.jpg",
    "author": "Team Arieschitrakatha",
    "artist": "Ankush, Sarathi, Akansha, Yashu, Haru, Moumita",
    "creatorId": "creator_arieschitrakatha",
    "genres": [
      "Sci-Fi",
      "Adventure",
      "Comedy"
    ],
    "status": "ongoing",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.8,
    "releaseYear": 2026,
    "isExclusive": true,
    "isTrending": true,
    "rankNumber": 4,
    "tags": [
      "Alien on Earth",
      "Sci-Fi Adventure",
      "Spaceship Quest",
      "Extraterrestrial"
    ],
    "createdAt": "2026-02-12T00:00:00Z",
    "updatedAt": "2026-09-22T00:00:00Z"
  },
  {
    "id": "series_a_promise_never_broken",
    "title": "A Promise Never Broken",
    "titleJapanese": "破られない約束",
    "slug": "a-promise-never-broken",
    "synopsis": "A beautifully crafted one-shot manga by indie creator OPUSHON. A deeply emotional, heart-touching, and relatable story revolving around personal reflections, sacred promises, and human emotions, blending everyday life with a touch of mystical fantasy.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b7ebae80b6.31186119_1000305770.png",
    "bannerUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a17bff0138eb3.09994118_1000305770.png",
    "author": "Vikalp Draws (OPUSHON)",
    "artist": "Vikalp Draws",
    "creatorId": "creator_vikalp_draws",
    "genres": [
      "Slice of Life",
      "Fantasy",
      "Romance"
    ],
    "status": "completed",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.9,
    "releaseYear": 2026,
    "isExclusive": false,
    "isTrending": true,
    "rankNumber": 5,
    "tags": [
      "Emotional",
      "Heart Touching",
      "One Shot",
      "Promises",
      "Wholesome Fantasy"
    ],
    "createdAt": "2026-02-20T00:00:00Z",
    "updatedAt": "2026-09-18T00:00:00Z"
  },
  {
    "id": "series_veynx",
    "title": "Veynx",
    "titleJapanese": "ヴェインクス",
    "slug": "veynx",
    "synopsis": "This is a story of a mysterious guy who meets his closest friend and reveals his dark, awakening superpowers. A spine-chilling supernatural encounter where shadows bleed into reality.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bc5fa1c0e2.59529213_1000325583.png",
    "author": "Deep Mangaka",
    "artist": "Deep Mangaka",
    "creatorId": "creator_deep_mangaka",
    "genres": [
      "Horror",
      "Mystery",
      "Supernatural"
    ],
    "status": "completed",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.7,
    "releaseYear": 2026,
    "isExclusive": false,
    "isTrending": false,
    "tags": [
      "Superpowers",
      "Psychological Horror",
      "Dark Secrets",
      "One Shot"
    ],
    "createdAt": "2026-03-01T00:00:00Z",
    "updatedAt": "2026-09-20T00:00:00Z"
  },
  {
    "id": "series_kivya",
    "title": "Kivya",
    "titleJapanese": "キヴヤ",
    "slug": "kivya",
    "synopsis": "The quiet story of a girl who finds a bird while taking photographs through her vintage camera. Experience Kivya's chance encounter in this high-contrast, deeply meditative one-shot original.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7452656099c1.42883679_1000320734.png",
    "bannerUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7455f08f3754.03522061_1000320734.png",
    "author": "Deep Mangaka",
    "artist": "Deep Mangaka",
    "creatorId": "creator_deep_mangaka",
    "genres": [
      "Slice of Life",
      "Drama"
    ],
    "status": "completed",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.8,
    "releaseYear": 2026,
    "isExclusive": false,
    "isTrending": false,
    "tags": [
      "Photography",
      "Slice of Life",
      "Quiet Moments",
      "One Shot",
      "Artistic Line Art"
    ],
    "createdAt": "2026-03-05T00:00:00Z",
    "updatedAt": "2026-09-22T00:00:00Z"
  },
  {
    "id": "series_my_dad_wants_a_daughter",
    "title": "My dad wants a daughter",
    "titleJapanese": "父は娘を欲しがっている",
    "slug": "my-dad-wants-a-daughter",
    "synopsis": "Explore a raw, unfiltered narrative of a son's radical transformation and the complex, shocking reactions within a traditional household. Mature themes and deep character tension.",
    "coverUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c07df350083.34172826_1000321898.png",
    "author": "Deep Mangaka",
    "artist": "Deep Mangaka",
    "creatorId": "creator_deep_mangaka",
    "genres": [
      "Slice of Life",
      "Drama",
      "Adult"
    ],
    "status": "completed",
    "moderationStatus": "approved",
    "totalViews": 0,
    "totalReads": 0,
    "rating": 4.6,
    "releaseYear": 2026,
    "isExclusive": false,
    "isTrending": false,
    "tags": [
      "Adult (18+)",
      "Family Drama",
      "Identity",
      "Raw Narrative",
      "One Shot"
    ],
    "createdAt": "2026-03-12T00:00:00Z",
    "updatedAt": "2026-09-25T00:00:00Z"
  }
];

// Seed Chapters & Real CloudFront Panels from mangawild.online
const INITIAL_CHAPTERS: Chapter[] = [
  {
    "id": "ch_silent_heads_01",
    "seriesId": "series_silent_heads",
    "chapterNumber": 1,
    "title": "Chapter 1: The First Clue",
    "slug": "chapter-1-the-first-clue",
    "releaseDate": "2026-03-01",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_sh1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d330eb7d00.27097762_1000332138.jpg"
      },
      {
        "id": "panel_sh1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d341b4f557.12776600_1000332157.png"
      },
      {
        "id": "panel_sh1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d34e247795.86597032_1000332140.jpg"
      },
      {
        "id": "panel_sh1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d360284d77.44138132_1000332141.jpg"
      },
      {
        "id": "panel_sh1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d37089ea63.91320579_1000332142.jpg"
      },
      {
        "id": "panel_sh1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d386a428b5.36433032_1000332143.jpg"
      },
      {
        "id": "panel_sh1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d39928b915.04210779_1000332144.jpg"
      },
      {
        "id": "panel_sh1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d3ad390ff2.05964065_1000332145.jpg"
      },
      {
        "id": "panel_sh1_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d3bd3a9386.47886266_1000332146.jpg"
      },
      {
        "id": "panel_sh1_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d3cfe2b0d8.25344132_1000332147.jpg"
      },
      {
        "id": "panel_sh1_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d3e165e3a1.25826703_1000332148.jpg"
      },
      {
        "id": "panel_sh1_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d3f54cd648.82731715_1000332149.jpg"
      },
      {
        "id": "panel_sh1_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d40be199b0.63550022_1000332150.jpg"
      },
      {
        "id": "panel_sh1_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d421247143.99053656_1000332151.jpg"
      },
      {
        "id": "panel_sh1_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d43567eb37.35236614_1000332152.jpg"
      },
      {
        "id": "panel_sh1_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d550c14b78.86007796_1000332163.jpg"
      },
      {
        "id": "panel_sh1_17",
        "panelNumber": 17,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d5c81d1fd2.86820667_1000332153.jpg"
      },
      {
        "id": "panel_sh1_18",
        "panelNumber": 18,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d5f473b943.55125074_1000332164.jpg"
      },
      {
        "id": "panel_sh1_19",
        "panelNumber": 19,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d60d58e3d6.26112350_1000332154.jpg"
      }
    ]
  },
  {
    "id": "ch_randamu_01",
    "seriesId": "series_randamu_boken",
    "chapterNumber": 1,
    "title": "Chapter 1: Starfall Abyss",
    "slug": "chapter-1-chapter-1-starfall-abyss",
    "releaseDate": "2026-03-01",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_rb1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0ebd791ff2f1.53336041_1000304925.jpg"
      },
      {
        "id": "panel_rb1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eafc0dbd383.57557950_1000304926.jpg"
      },
      {
        "id": "panel_rb1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb0d55ee6c2.71203148_1000304927.jpg"
      },
      {
        "id": "panel_rb1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb103671e66.68364673_1000304928.jpg"
      },
      {
        "id": "panel_rb1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb112d84134.17160530_1000304929.jpg"
      },
      {
        "id": "panel_rb1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb12653dbc7.72913582_1000304930.jpg"
      },
      {
        "id": "panel_rb1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb13a0fd0b8.78474222_1000304931.jpg"
      },
      {
        "id": "panel_rb1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb1534b2363.07770337_1000304933.jpg"
      },
      {
        "id": "panel_rb1_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb168d5d716.65339933_1000304932.jpg"
      },
      {
        "id": "panel_rb1_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb17ac108f3.52681409_1000304934.jpg"
      },
      {
        "id": "panel_rb1_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb18dbcb364.57557753_1000304935.jpg"
      },
      {
        "id": "panel_rb1_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb1a72fe3d5.98664586_1000304936.jpg"
      },
      {
        "id": "panel_rb1_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb1c03d1888.22507496_1000304937.jpg"
      },
      {
        "id": "panel_rb1_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb1d5481fe9.80382060_1000304938.jpg"
      },
      {
        "id": "panel_rb1_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12912ed64fd8.65593672_1000305733.jpg"
      },
      {
        "id": "panel_rb1_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12914f6096c7.19873135_1000305734.jpg"
      },
      {
        "id": "panel_rb1_17",
        "panelNumber": 17,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb22f75d2c7.99771359_1000304941.jpg"
      },
      {
        "id": "panel_rb1_18",
        "panelNumber": 18,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0eb24ac700a3.83584632_1000304942.jpg"
      },
      {
        "id": "panel_rb1_19",
        "panelNumber": 19,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a1291721d07f2.93408029_1000305737.jpg"
      },
      {
        "id": "panel_rb1_20",
        "panelNumber": 20,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a129189203531.02118395_1000305738.jpg"
      },
      {
        "id": "panel_rb1_21",
        "panelNumber": 21,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a0ebc0b57e326.75239063_1000305111.jpg"
      }
    ]
  },
  {
    "id": "ch_randamu_02",
    "seriesId": "series_randamu_boken",
    "chapterNumber": 2,
    "title": "Chapter 2: Sandworm Rampage",
    "slug": "chapter-2-chapter-2-sandworm-rampage",
    "releaseDate": "2026-03-02",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_rb2_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152df91da8c5.05127266_1000306340.jpg"
      },
      {
        "id": "panel_rb2_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152e0c49bc45.43688298_1000306341.jpg"
      },
      {
        "id": "panel_rb2_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152e8f8f9c60.24099870_1000306342.jpg"
      },
      {
        "id": "panel_rb2_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152ee54e5122.55235344_1000306343.jpg"
      },
      {
        "id": "panel_rb2_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152ef55797e8.77227214_1000306344.jpg"
      },
      {
        "id": "panel_rb2_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152f05c68357.25677324_1000306345.jpg"
      },
      {
        "id": "panel_rb2_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152f15d63cb2.10172413_1000306346.jpg"
      },
      {
        "id": "panel_rb2_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152f2809e584.29497484_1000306347.jpg"
      },
      {
        "id": "panel_rb2_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152f36556e71.62004630_1000306348.jpg"
      },
      {
        "id": "panel_rb2_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152f4653cb22.88088705_1000306349.jpg"
      },
      {
        "id": "panel_rb2_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152f6ccf8f14.85015937_1000306350.jpg"
      },
      {
        "id": "panel_rb2_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a155a86067919.74148921_1000306401.jpg"
      },
      {
        "id": "panel_rb2_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a155af23a9ce4.19398219_1000306402.jpg"
      },
      {
        "id": "panel_rb2_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a155b288a0081.80261626_1000306400.jpg"
      },
      {
        "id": "panel_rb2_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152fb5523154.74353094_1000306354.jpg"
      },
      {
        "id": "panel_rb2_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a152fc777b2e8.73443311_1000306355.jpg"
      }
    ]
  },
  {
    "id": "ch_randamu_03",
    "seriesId": "series_randamu_boken",
    "chapterNumber": 3,
    "title": "Chapter 3: The Broken Dimension",
    "slug": "chapter-3-chapter-3-the-broken-dimension",
    "releaseDate": "2026-03-03",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_rb3_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2294fc7419c6.83515215_1000308843.jpg"
      },
      {
        "id": "panel_rb3_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22950bc91081.21013905_1000308844.jpg"
      },
      {
        "id": "panel_rb3_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22951998c779.23945491_1000308845.jpg"
      },
      {
        "id": "panel_rb3_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22952805e7f9.07095328_1000308846.jpg"
      },
      {
        "id": "panel_rb3_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22953c6ee822.52864106_1000308847.jpg"
      },
      {
        "id": "panel_rb3_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22954b180440.62160090_1000308848.jpg"
      },
      {
        "id": "panel_rb3_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2295593df972.66970717_1000308849.jpg"
      },
      {
        "id": "panel_rb3_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22957b3dac12.54889055_1000308850.jpg"
      },
      {
        "id": "panel_rb3_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22958f6f7455.69773337_1000308851.jpg"
      },
      {
        "id": "panel_rb3_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22959e73f197.35818878_1000308852.jpg"
      },
      {
        "id": "panel_rb3_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2295b3890571.11915038_1000308853.jpg"
      },
      {
        "id": "panel_rb3_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2295d8120cf1.63740165_1000308854.jpg"
      },
      {
        "id": "panel_rb3_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2295e8b6ab27.06748281_1000308855.jpg"
      },
      {
        "id": "panel_rb3_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2295f88db680.41308338_1000308856.jpg"
      },
      {
        "id": "panel_rb3_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2296057ec873.97505799_1000308857.jpg"
      },
      {
        "id": "panel_rb3_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22961466d2b1.62538209_1000308858.jpg"
      },
      {
        "id": "panel_rb3_17",
        "panelNumber": 17,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a22962e00d439.66380911_1000308859.jpg"
      }
    ]
  },
  {
    "id": "ch_randamu_04",
    "seriesId": "series_randamu_boken",
    "chapterNumber": 4,
    "title": "Chapter 4: Nonsense & Danger",
    "slug": "chapter-4-chapter-4-nonsense-and-danger",
    "releaseDate": "2026-03-04",
    "isExclusiveVIP": true,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_rb4_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817b2248d865.88406279_1000322882.jpg"
      },
      {
        "id": "panel_rb4_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817b70cae546.73744007_1000322883.jpg"
      },
      {
        "id": "panel_rb4_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817b8125baa0.61778080_1000322884.jpg"
      },
      {
        "id": "panel_rb4_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817b91ea5bd1.49505775_1000322885.jpg"
      },
      {
        "id": "panel_rb4_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817ba0c9a710.31394757_1000322886.jpg"
      },
      {
        "id": "panel_rb4_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817bb04ca099.14760507_1000322887.jpg"
      },
      {
        "id": "panel_rb4_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817bc108fe70.09204047_1000322888.jpg"
      },
      {
        "id": "panel_rb4_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817be4405135.79349789_1000322889.jpg"
      },
      {
        "id": "panel_rb4_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817bf09e9f96.86138385_1000322890.jpg"
      },
      {
        "id": "panel_rb4_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817bfe3c0080.31365935_1000322891.jpg"
      },
      {
        "id": "panel_rb4_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817c10333dd9.61880564_1000322892.jpg"
      },
      {
        "id": "panel_rb4_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817c1e707641.79130075_1000322893.jpg"
      },
      {
        "id": "panel_rb4_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817c2ae21235.48899516_1000322894.jpg"
      },
      {
        "id": "panel_rb4_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817c38831ae8.52614068_1000322895.jpg"
      },
      {
        "id": "panel_rb4_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817c445932d9.12807728_1000322896.jpg"
      },
      {
        "id": "panel_rb4_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a817c53340b32.47306194_1000322897.jpg"
      }
    ]
  },
  {
    "id": "ch_randamu_05",
    "seriesId": "series_randamu_boken",
    "chapterNumber": 5,
    "title": "Chapter 5: Unraveling the Chaos",
    "slug": "chapter-5-chapter-5-unraveling-the-chaos",
    "releaseDate": "2026-03-05",
    "isExclusiveVIP": true,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_rb5_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c82bdccf90.23401849_1000323789.jpg"
      },
      {
        "id": "panel_rb5_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c855a72b48.41347755_1000323791.jpg"
      },
      {
        "id": "panel_rb5_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c883962191.50338841_1000323792.jpg"
      },
      {
        "id": "panel_rb5_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c89f12aea2.65262903_1000323793.jpg"
      },
      {
        "id": "panel_rb5_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c8c563a1b2.96885836_1000323794.jpg"
      },
      {
        "id": "panel_rb5_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c8e483f697.74242980_1000323795.jpg"
      },
      {
        "id": "panel_rb5_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c93b633660.83697738_1000323796.jpg"
      },
      {
        "id": "panel_rb5_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c9527add16.46477946_1000323797.jpg"
      },
      {
        "id": "panel_rb5_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c9847c5b87.54576420_1000323798.jpg"
      },
      {
        "id": "panel_rb5_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c995a10692.52401772_1000323799.jpg"
      },
      {
        "id": "panel_rb5_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c9b1524095.53401575_1000323800.jpg"
      },
      {
        "id": "panel_rb5_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86c9c8670161.55311152_1000323801.jpg"
      },
      {
        "id": "panel_rb5_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86ca27d58116.32836012_1000323802.jpg"
      },
      {
        "id": "panel_rb5_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86ca36c25ff8.49061934_1000323803.jpg"
      },
      {
        "id": "panel_rb5_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86ca46756448.66664013_1000323804.jpg"
      },
      {
        "id": "panel_rb5_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86ca7f8f0301.34801565_1000323805.jpg"
      },
      {
        "id": "panel_rb5_17",
        "panelNumber": 17,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86ca58a60f87.02058073_1000323806.jpg"
      },
      {
        "id": "panel_rb5_18",
        "panelNumber": 18,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cb6d7164b8.64978235_1000323807.jpg"
      },
      {
        "id": "panel_rb5_19",
        "panelNumber": 19,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cb9a6c58d5.26524511_1000323808.jpg"
      },
      {
        "id": "panel_rb5_20",
        "panelNumber": 20,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cbad230065.99291512_1000323809.jpg"
      },
      {
        "id": "panel_rb5_21",
        "panelNumber": 21,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cbbf3c46b9.71558413_1000323810.jpg"
      },
      {
        "id": "panel_rb5_22",
        "panelNumber": 22,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cbcf190e48.01731023_1000323811.jpg"
      },
      {
        "id": "panel_rb5_23",
        "panelNumber": 23,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cbde27a044.56374500_1000323812.jpg"
      },
      {
        "id": "panel_rb5_24",
        "panelNumber": 24,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cbef84c770.92809823_1000323813.jpg"
      },
      {
        "id": "panel_rb5_25",
        "panelNumber": 25,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a86cc04de8245.44088624_1000323814.jpg"
      }
    ]
  },
  {
    "id": "ch_the_trek_01",
    "seriesId": "series_the_trek",
    "chapterNumber": 1,
    "title": "Chapter 1: Point of No Return (Complete)",
    "slug": "chapter-1-point-of-no-return-complete",
    "releaseDate": "2026-03-05",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_trek1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23aeecc52647.20867798_1000308977.png"
      },
      {
        "id": "panel_trek1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23b377a8b6d0.62601742_1000308978.png"
      },
      {
        "id": "panel_trek1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23dc9ac5b056.43855899_3_20260606_104301_0002.png"
      },
      {
        "id": "panel_trek1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23dcb32d27c2.78514796_1000308980.png"
      },
      {
        "id": "panel_trek1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23dcd4c1d3c6.53804714_1000308981.png"
      },
      {
        "id": "panel_trek1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23dce65d2139.57726610_1000308982.png"
      },
      {
        "id": "panel_trek1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23dd04455c21.19499249_1000308983.png"
      },
      {
        "id": "panel_trek1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a23dd2168f2c4.66183420_1000308984.png"
      },
      {
        "id": "panel_trek1_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e887148d13.08601199_1000309948.png"
      },
      {
        "id": "panel_trek1_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e8d03c7ce7.19013357_1000309947.png"
      },
      {
        "id": "panel_trek1_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e90162a2c9.80619191_1000309946.png"
      },
      {
        "id": "panel_trek1_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e9324fa7d8.22231342_1000309945.png"
      },
      {
        "id": "panel_trek1_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e97d57c634.44294308_1000309944.png"
      },
      {
        "id": "panel_trek1_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e9cc958678.71120610_1000309943.png"
      },
      {
        "id": "panel_trek1_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28e9feb45b93.25841425_1000309942.png"
      },
      {
        "id": "panel_trek1_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ea43959d23.05812694_1000309941.png"
      },
      {
        "id": "panel_trek1_17",
        "panelNumber": 17,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ea717c4f04.05839512_1000309940.png"
      },
      {
        "id": "panel_trek1_18",
        "panelNumber": 18,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28eadf612890.43834311_1000309939.png"
      },
      {
        "id": "panel_trek1_19",
        "panelNumber": 19,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28eb161a1a75.80078246_1000309938.png"
      },
      {
        "id": "panel_trek1_20",
        "panelNumber": 20,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ea9c566275.34785194_1000309938.png"
      },
      {
        "id": "panel_trek1_21",
        "panelNumber": 21,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28eb5f04dca8.81391583_1000309937.png"
      },
      {
        "id": "panel_trek1_22",
        "panelNumber": 22,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ebd2487725.35057924_1000309936.png"
      },
      {
        "id": "panel_trek1_23",
        "panelNumber": 23,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ec24da1712.67131320_1000309935.png"
      },
      {
        "id": "panel_trek1_24",
        "panelNumber": 24,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ec64d0b371.71936761_1000309934.png"
      },
      {
        "id": "panel_trek1_25",
        "panelNumber": 25,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28eca954cf07.86900454_1000309933.png"
      },
      {
        "id": "panel_trek1_26",
        "panelNumber": 26,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ed06190d20.85822054_1000309932.png"
      },
      {
        "id": "panel_trek1_27",
        "panelNumber": 27,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28eda8af4608.73764053_1000309931.png"
      },
      {
        "id": "panel_trek1_28",
        "panelNumber": 28,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ee0fa014e9.78771992_1000309930.png"
      },
      {
        "id": "panel_trek1_29",
        "panelNumber": 29,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ee8d4f6814.72461401_1000309929.png"
      },
      {
        "id": "panel_trek1_30",
        "panelNumber": 30,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28eef8f1c919.63686554_1000309928.png"
      },
      {
        "id": "panel_trek1_31",
        "panelNumber": 31,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28ef85894288.27374618_1000309927.png"
      },
      {
        "id": "panel_trek1_32",
        "panelNumber": 32,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28efd9bdc919.25730983_1000309926.png"
      },
      {
        "id": "panel_trek1_33",
        "panelNumber": 33,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f0395228e6.50991713_1000309925.png"
      },
      {
        "id": "panel_trek1_34",
        "panelNumber": 34,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f08b49ee91.17205158_1000309924.png"
      },
      {
        "id": "panel_trek1_35",
        "panelNumber": 35,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f0ff97dfd9.26190801_1000309923.png"
      },
      {
        "id": "panel_trek1_36",
        "panelNumber": 36,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f139225c51.98667301_1000309922.png"
      },
      {
        "id": "panel_trek1_37",
        "panelNumber": 37,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f16cdf2ea7.89315498_1000309921.png"
      },
      {
        "id": "panel_trek1_38",
        "panelNumber": 38,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f1bfc533b1.85497831_1000309920.png"
      },
      {
        "id": "panel_trek1_39",
        "panelNumber": 39,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f1ec5405a7.91889570_1000309919.png"
      },
      {
        "id": "panel_trek1_40",
        "panelNumber": 40,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f23393df81.26814431_1000309918.png"
      },
      {
        "id": "panel_trek1_41",
        "panelNumber": 41,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f414d43de7.31422160_1000309917.png"
      },
      {
        "id": "panel_trek1_42",
        "panelNumber": 42,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f448a696e8.01296371_1000309916.png"
      },
      {
        "id": "panel_trek1_43",
        "panelNumber": 43,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f54dc2a899.89510227_1000309915.png"
      },
      {
        "id": "panel_trek1_44",
        "panelNumber": 44,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f5f77ed721.89577895_1000309914.png"
      },
      {
        "id": "panel_trek1_45",
        "panelNumber": 45,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f662313c02.48355747_1000309913.png"
      },
      {
        "id": "panel_trek1_46",
        "panelNumber": 46,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f6cd62eee6.11329804_1000309912.png"
      },
      {
        "id": "panel_trek1_47",
        "panelNumber": 47,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f71083d0e8.94484233_1000309911.png"
      },
      {
        "id": "panel_trek1_48",
        "panelNumber": 48,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f79d237994.39754412_1000309910.png"
      },
      {
        "id": "panel_trek1_49",
        "panelNumber": 49,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f7dc63cc83.84254817_1000309909.png"
      },
      {
        "id": "panel_trek1_50",
        "panelNumber": 50,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f8505de339.48535378_1000309908.png"
      },
      {
        "id": "panel_trek1_51",
        "panelNumber": 51,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a28f8a161a7a5.27383923_1000309907.png"
      },
      {
        "id": "panel_trek1_52",
        "panelNumber": 52,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9b80eb5d23.18838737_1000309906.png"
      },
      {
        "id": "panel_trek1_53",
        "panelNumber": 53,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9bd0597873.13263673_1000309905.png"
      },
      {
        "id": "panel_trek1_54",
        "panelNumber": 54,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9c21d49ff0.08406850_1000309904.png"
      },
      {
        "id": "panel_trek1_55",
        "panelNumber": 55,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9c6f6e7a68.38230493_1000309903.png"
      },
      {
        "id": "panel_trek1_56",
        "panelNumber": 56,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9ca2dfe639.07356055_1000309902.png"
      },
      {
        "id": "panel_trek1_57",
        "panelNumber": 57,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9ce6aa9575.47786485_1000309901.png"
      },
      {
        "id": "panel_trek1_58",
        "panelNumber": 58,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9d2d5ec796.33503420_1000309900.png"
      },
      {
        "id": "panel_trek1_59",
        "panelNumber": 59,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9d601c66c8.75884372_1000309899.png"
      },
      {
        "id": "panel_trek1_60",
        "panelNumber": 60,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9d94c81e17.95475826_1000309898.png"
      },
      {
        "id": "panel_trek1_61",
        "panelNumber": 61,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9dc2b58bb3.85902952_1000309897.png"
      },
      {
        "id": "panel_trek1_62",
        "panelNumber": 62,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9dde2c6df9.45492327_1000309896.png"
      },
      {
        "id": "panel_trek1_63",
        "panelNumber": 63,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9df43fbe06.84761235_1000309895.png"
      },
      {
        "id": "panel_trek1_64",
        "panelNumber": 64,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9e42e658d8.54436291_1000309894.png"
      },
      {
        "id": "panel_trek1_65",
        "panelNumber": 65,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9e94ea70f6.67712471_1000309893.png"
      },
      {
        "id": "panel_trek1_66",
        "panelNumber": 66,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9eeb67baa5.54276724_1000309892.png"
      },
      {
        "id": "panel_trek1_67",
        "panelNumber": 67,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9f23ee5798.61823122_1000309891.png"
      },
      {
        "id": "panel_trek1_68",
        "panelNumber": 68,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9f6f1700e1.20133875_1000309890.png"
      },
      {
        "id": "panel_trek1_69",
        "panelNumber": 69,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9fae3e8937.35064346_1000309889.png"
      },
      {
        "id": "panel_trek1_70",
        "panelNumber": 70,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2b9ff0944da5.60863651_1000309888.png"
      },
      {
        "id": "panel_trek1_71",
        "panelNumber": 71,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba068a84ba0.93875342_1000309887.png"
      },
      {
        "id": "panel_trek1_72",
        "panelNumber": 72,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba0a223a890.18179639_1000309886.png"
      },
      {
        "id": "panel_trek1_73",
        "panelNumber": 73,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba0e9e01bb8.58250928_1000309885.png"
      },
      {
        "id": "panel_trek1_74",
        "panelNumber": 74,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba12bd6ddb4.21957845_1000309884.png"
      },
      {
        "id": "panel_trek1_75",
        "panelNumber": 75,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba14f96da65.09969945_1000309883.png"
      },
      {
        "id": "panel_trek1_76",
        "panelNumber": 76,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba1721d8794.08302398_1000309882.png"
      },
      {
        "id": "panel_trek1_77",
        "panelNumber": 77,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba1a8b10e15.81956647_1000309881.png"
      },
      {
        "id": "panel_trek1_78",
        "panelNumber": 78,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba1c6d0dc61.38431336_1000309880.png"
      },
      {
        "id": "panel_trek1_79",
        "panelNumber": 79,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2ba1dc5f0df7.68379001_1000309879.png"
      },
      {
        "id": "panel_trek1_80",
        "panelNumber": 80,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a2bd2ef261ae3.40628049_1000310677.jpg"
      }
    ]
  },
  {
    "id": "ch_chitrakatha_chintu_01",
    "seriesId": "series_chitrakatha_chintu",
    "chapterNumber": 1,
    "title": "Chapter 1: Crash Landed on Earth",
    "slug": "chapter-1-crash-landed-on-earth",
    "releaseDate": "2026-03-08",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_chintu1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5928873ab84.57764133_1000300372.jpg"
      },
      {
        "id": "panel_chintu1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f593638dfa19.64037111_1000300373.jpg"
      },
      {
        "id": "panel_chintu1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f59875df48c0.09925911_1000300374.jpg"
      },
      {
        "id": "panel_chintu1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f598a9008187.67243476_1000300375.jpg"
      },
      {
        "id": "panel_chintu1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f59907604953.02592780_1000300376.jpg"
      },
      {
        "id": "panel_chintu1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f599311fc1c7.17342215_1000300377.jpg"
      },
      {
        "id": "panel_chintu1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a60497afc6.85330527_1000300399.jpg"
      },
      {
        "id": "panel_chintu1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f599cf2544e9.62108242_1000300379.jpg"
      },
      {
        "id": "panel_chintu1_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f599e9eed187.83048210_1000300380.jpg"
      },
      {
        "id": "panel_chintu1_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f59a69d53083.10849819_1000300381.jpg"
      },
      {
        "id": "panel_chintu1_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a2c75ee734.51063094_1000300382.jpg"
      },
      {
        "id": "panel_chintu1_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a2f18947a6.67954933_1000300383.jpg"
      },
      {
        "id": "panel_chintu1_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a409bc64c3.60222271_1000300384.jpg"
      },
      {
        "id": "panel_chintu1_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a6cddbc0a1.79280410_1000300385.jpg"
      },
      {
        "id": "panel_chintu1_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a6fc1a92f8.09570127_1000300386.jpg"
      },
      {
        "id": "panel_chintu1_16",
        "panelNumber": 16,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a719171c03.32908409_1000300387.jpg"
      },
      {
        "id": "panel_chintu1_17",
        "panelNumber": 17,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a76753ffb6.56888178_1000300388.jpg"
      },
      {
        "id": "panel_chintu1_18",
        "panelNumber": 18,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a7e0d1fc84.95418473_1000300389.jpg"
      },
      {
        "id": "panel_chintu1_19",
        "panelNumber": 19,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a7ff93a212.24876703_1000300390.jpg"
      },
      {
        "id": "panel_chintu1_20",
        "panelNumber": 20,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a82722ad47.61415020_1000300391.jpg"
      },
      {
        "id": "panel_chintu1_21",
        "panelNumber": 21,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a86964dc38.64642945_1000300392.jpg"
      },
      {
        "id": "panel_chintu1_22",
        "panelNumber": 22,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a88e89a628.51369463_1000300393.jpg"
      },
      {
        "id": "panel_chintu1_23",
        "panelNumber": 23,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a8c0c450a2.33693043_1000300394.jpg"
      },
      {
        "id": "panel_chintu1_24",
        "panelNumber": 24,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a8f3cf2c80.57339304_1000300395.jpg"
      },
      {
        "id": "panel_chintu1_25",
        "panelNumber": 25,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/69f5a91bbb3988.58256054_1000300396.jpg"
      }
    ]
  },
  {
    "id": "ch_a_promise_never_broken_01",
    "seriesId": "series_a_promise_never_broken",
    "chapterNumber": 1,
    "title": "Chapter 1: Eternal Bond (One-Shot)",
    "slug": "chapter-1-eternal-bond-one-shot",
    "releaseDate": "2026-03-12",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_promise1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b7ebae80b6.31186119_1000305770.png"
      },
      {
        "id": "panel_promise1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b80ecb9860.44910376_1000305770.png"
      },
      {
        "id": "panel_promise1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b8eded91c7.06714408_1000305776.png"
      },
      {
        "id": "panel_promise1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12baf35a93b8.02227799_1000305777.png"
      },
      {
        "id": "panel_promise1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b9180d0e50.21679241_1000305778.png"
      },
      {
        "id": "panel_promise1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b9334db4a1.14548307_1000305779.png"
      },
      {
        "id": "panel_promise1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b948bbb604.38602512_1000305780.png"
      },
      {
        "id": "panel_promise1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b973ebb4e2.17785541_1000305781.png"
      },
      {
        "id": "panel_promise1_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b9a2d35284.17042143_1000305782.png"
      },
      {
        "id": "panel_promise1_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b9c5597f16.46773183_1000305783.png"
      },
      {
        "id": "panel_promise1_11",
        "panelNumber": 11,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12b9e7cfaf28.39140317_1000305771.png"
      },
      {
        "id": "panel_promise1_12",
        "panelNumber": 12,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12ba04aca446.48150726_1000305772.png"
      },
      {
        "id": "panel_promise1_13",
        "panelNumber": 13,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12ba281a5aa1.51958156_1000305773.png"
      },
      {
        "id": "panel_promise1_14",
        "panelNumber": 14,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12ba482c0363.23768868_1000305774.png"
      },
      {
        "id": "panel_promise1_15",
        "panelNumber": 15,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a12ba645e3327.82666310_1000305775.png"
      }
    ]
  },
  {
    "id": "ch_veynx_01",
    "seriesId": "series_veynx",
    "chapterNumber": 1,
    "title": "Chapter 1: Awoken Power (One-Shot)",
    "slug": "chapter-1-awoken-power-one-shot",
    "releaseDate": "2026-03-15",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_veynx1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bb240fdc25.34551571_1000325575.jpg"
      },
      {
        "id": "panel_veynx1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bb421f8b18.78628035_1000325577.jpg"
      },
      {
        "id": "panel_veynx1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bb5c14fa72.24372336_1000325576.jpg"
      },
      {
        "id": "panel_veynx1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bb7b4609e8.80758072_1000325578.jpg"
      },
      {
        "id": "panel_veynx1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bb9576f2b5.46312506_1000325579.jpg"
      },
      {
        "id": "panel_veynx1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a93bbac6f1993.07770282_1000325580.jpg"
      }
    ]
  },
  {
    "id": "ch_kivya_01",
    "seriesId": "series_kivya",
    "chapterNumber": 1,
    "title": "Chapter 1: The Bird and the Lens (One-Shot)",
    "slug": "chapter-1-the-bird-and-the-lens-one-shot",
    "releaseDate": "2026-03-18",
    "isExclusiveVIP": false,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_kivya1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744b1c8c8946.21816936_1000320533.jpg"
      },
      {
        "id": "panel_kivya1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744bb3e3bba7.96822606_1000320725.jpg"
      },
      {
        "id": "panel_kivya1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744be2519976.13662284_1000320726.jpg"
      },
      {
        "id": "panel_kivya1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744bf3b1b118.91076970_1000320727.jpg"
      },
      {
        "id": "panel_kivya1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744c0a98e9c1.41456170_1000320728.jpg"
      },
      {
        "id": "panel_kivya1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744c1f26e595.38982790_1000320729.jpg"
      },
      {
        "id": "panel_kivya1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744c300adb01.11462452_1000320730.jpg"
      },
      {
        "id": "panel_kivya1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744c540516b7.11870207_1000320731.jpg"
      },
      {
        "id": "panel_kivya1_9",
        "panelNumber": 9,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744c770a1dd1.52305773_1000320732.jpg"
      },
      {
        "id": "panel_kivya1_10",
        "panelNumber": 10,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a744c8a6c4976.45769937_1000320733.jpg"
      }
    ]
  },
  {
    "id": "ch_my_dad_wants_a_daughter_01",
    "seriesId": "series_my_dad_wants_a_daughter",
    "chapterNumber": 1,
    "title": "Chapter 1: Radical Shift (One-Shot)",
    "slug": "chapter-1-radical-shift-one-shot",
    "releaseDate": "2026-03-22",
    "isExclusiveVIP": true,
    "moderationStatus": "approved",
    "viewsCount": 0,
    "likesCount": 0,
    "panels": [
      {
        "id": "panel_dad1_1",
        "panelNumber": 1,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c0fabaebbb1.70842616_1000320847.jpg"
      },
      {
        "id": "panel_dad1_2",
        "panelNumber": 2,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c0fc216cb24.39219294_1000320848.jpg"
      },
      {
        "id": "panel_dad1_3",
        "panelNumber": 3,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c0fd6d446d0.14065397_1000320849.jpg"
      },
      {
        "id": "panel_dad1_4",
        "panelNumber": 4,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c0fe9a81745.96740420_1000320850.jpg"
      },
      {
        "id": "panel_dad1_5",
        "panelNumber": 5,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c1000322134.75071393_1000320851.jpg"
      },
      {
        "id": "panel_dad1_6",
        "panelNumber": 6,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c10126ab750.56281313_1000320852.jpg"
      },
      {
        "id": "panel_dad1_7",
        "panelNumber": 7,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c102d620d03.41031391_1000320853.jpg"
      },
      {
        "id": "panel_dad1_8",
        "panelNumber": 8,
        "imageUrl": "https://d1yei2z3i6k35z.cloudfront.net/17195590/6a7c104196eb06.91201340_1000320854.jpg"
      }
    ]
  }
];

// Clean User-Generated Reviews (starts at 0, only real user submissions)
const INITIAL_REVIEWS: SeriesReview[] = [];

// Clean User-Generated Comments (starts at 0, only real user submissions)
const INITIAL_COMMENTS: Comment[] = [];

// Seed Worldwide Manga News
export const WORLDWIDE_MANGA_NEWS: WorldwideMangaNews[] = [
  {
    "id": "news_01",
    "title": "MangaWild Welcomes Creators Flad Z, Jay, and Arieschitrakatha to Original Lineup",
    "timeAgo": "2h ago",
    "source": "MangaWild Editorial Desk",
    "category": "Platform News",
    "summary": "New chapters and one-shots have arrived on MangaWild, featuring traditional ink horror, absurdist sci-fi comedy, and heartfelt fantasy."
  },
  {
    "id": "news_02",
    "title": "SILENT HEADS Chapter 1 Garners Global Praise for 14th Century Mystery Lore",
    "timeAgo": "5h ago",
    "source": "Indie Manga Spotlight",
    "category": "Spotlight",
    "summary": "Deep Mangaka's dark period thriller has captured reader attention with its uncanny mystery and traditional drawing technique."
  },
  {
    "id": "news_03",
    "title": "THE TREK: 80-Page Wilderness Thriller One-Shot Now Streaming in Full",
    "timeAgo": "1d ago",
    "source": "Manga News Weekly",
    "category": "Release",
    "summary": "Creator Jay completes the psychological mountain trek saga, offering readers a gripping full-length survival story."
  },
  {
    "id": "news_04",
    "title": "MangaWild Creator Program Expands 70% Revenue Share & Direct UPI Royalties",
    "timeAgo": "2d ago",
    "source": "MangaWild Studio",
    "category": "Creator Program",
    "summary": "Empowering independent manga artists worldwide with guaranteed royalty splits, subscriber support, and digital distribution."
  }
];

// Helper to get from local storage or fallback to seed
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item);
  } catch {
    return defaultVal;
  }
}

// Clean-up any legacy mock reviews, comments, and stats so everything starts at 0
try {
  const revRaw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  if (revRaw && (revRaw.includes('rev_01') || revRaw.includes('Deep Mangaka captures') || revRaw.includes('mock_ai') || revRaw.includes('A masterpiece of psychological'))) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
  }
  const comRaw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  if (comRaw && (comRaw.includes('c1') || comRaw.includes('The atmosphere is chilling') || comRaw.includes('mock_ai'))) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
  }
  const serRaw = localStorage.getItem(STORAGE_KEYS.SERIES);
  if (serRaw && (serRaw.includes('142000') || serRaw.includes('118000') || serRaw.includes('92000') || serRaw.includes('85000'))) {
    localStorage.removeItem(STORAGE_KEYS.SERIES);
  }
  const chRaw = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
  if (chRaw && (chRaw.includes('45200') || chRaw.includes('24000') || chRaw.includes('38000') || chRaw.includes('34500'))) {
    localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
  }
  const crRaw = localStorage.getItem(STORAGE_KEYS.CREATORS);
  if (crRaw && (crRaw.includes('48500') || crRaw.includes('191200') || crRaw.includes('78900') || crRaw.includes('24800'))) {
    localStorage.removeItem(STORAGE_KEYS.CREATORS);
  }
} catch {
  // Ignore in SSR/restricted environments
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save to localStorage (${key}):`, e);
  }
}

/**
 * Storage Service API
 */
export const StorageService = {
  // Users & Session
  getUsers(): User[] {
    const rawList = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let hasAdmin = false;
    const seenIds = new Set<string>();
    const list: User[] = [];

    for (const u of rawList) {
      // Check if this is the system admin account (or any legacy admin entry)
      const isAdminAccount =
        u.id === OFFICIAL_ADMIN.id ||
        u.email?.toLowerCase() === OFFICIAL_ADMIN.email.toLowerCase() ||
        u.email?.toLowerCase() === OFFICIAL_ADMIN.altEmail.toLowerCase() ||
        u.email?.toLowerCase() === 'huntsmp51@gmail.com' ||
        u.username?.toLowerCase() === 'admin' ||
        u.username?.toLowerCase() === 'mangawild_admin';

      if (isAdminAccount) {
        if (!hasAdmin) {
          hasAdmin = true;
          seenIds.add(OFFICIAL_ADMIN.id);
          list.push({
            ...u,
            id: OFFICIAL_ADMIN.id,
            name: 'Admin',
            username: OFFICIAL_ADMIN.username,
            email: u.email || OFFICIAL_ADMIN.email,
            password: OFFICIAL_ADMIN.password,
            role: 'admin' as UserRole,
            isVIP: true,
            avatarUrl: u.avatarUrl || '/avatars/admin.svg',
          });
        }
        // Skip duplicate admin records
        continue;
      }

      // Non-admin user: ensure strictly unique ID
      let finalId = u.id;
      if (!finalId || seenIds.has(finalId)) {
        finalId = `user_${u.username || 'reader'}_${Math.random().toString(36).substring(2, 7)}`;
      }
      seenIds.add(finalId);

      const safeRole: UserRole = u.role === 'admin' ? 'free_user' : u.role;
      const cleanUser = u.username || (u.email ? u.email.split('@')[0] : 'user').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      list.push({
        ...u,
        id: finalId,
        name: u.name || cleanUser,
        username: cleanUser,
        role: safeRole,
        password: u.password || 'password123',
      });
    }

    if (!hasAdmin) {
      list.unshift({
        id: OFFICIAL_ADMIN.id,
        email: OFFICIAL_ADMIN.email,
        name: 'Admin',
        username: OFFICIAL_ADMIN.username,
        password: OFFICIAL_ADMIN.password,
        role: 'admin',
        avatarUrl: '/avatars/admin.svg',
        isVIP: true,
        createdAt: '2026-01-01T00:00:00Z',
      });
    }

    return list;
  },

  saveUsers(users: User[]): void {
    const seen = new Set<string>();
    const deduplicated = users.filter(u => {
      if (!u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
    setStored(STORAGE_KEYS.USERS, deduplicated);
  },

  getCurrentUser(): User {
    const user = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) {
      return {
        id: 'guest_reader',
        name: 'Guest Reader',
        username: 'guest',
        email: '',
        role: 'free_user',
        isVIP: false,
        createdAt: new Date().toISOString(),
      };
    }
    if (!user.username) {
      user.username = (user.email ? user.email.split('@')[0] : 'reader').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    }
    return user;
  },

  setCurrentUser(user: User | null): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
    if (user) {
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      this.saveUsers(users);
    }
  },

  getCreatorByUserId(userId: string): CreatorProfile | undefined {
    return this.getCreators().find(c => c.userId === userId);
  },

  getOrCreateCreatorProfile(user: User): CreatorProfile {
    const existing = this.getCreatorByUserId(user.id);
    if (existing) return existing;
    const creators = this.getCreators();
    const newProfile: CreatorProfile = {
      id: user.creatorProfileId || `creator_${user.id}`,
      userId: user.id,
      penName: user.name,
      handle: `@${user.username || user.name.toLowerCase().replace(/\s+/g, '_')}`,
      bio: 'Original Manga Artist on MangaWild',
      avatarUrl: user.avatarUrl || '/avatars/creator.svg',
      followersCount: 0,
      seriesCount: 0,
      totalReads: 0,
      monthlyEarningsInr: 0,
      revenueSharePercent: 70,
      upiId: '',
      bankAccountHolder: user.name,
      verified: false,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    creators.push(newProfile);
    this.saveCreators(creators);
    return newProfile;
  },

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...updates };
    this.saveUsers(users);
    const current = this.getCurrentUser();
    if (current.id === id) {
      this.setCurrentUser(users[idx]);
    }
    return users[idx];
  },

  // Manga Series
  getSeries(): MangaSeries[] {
    const list = getStored<MangaSeries[]>(STORAGE_KEYS.SERIES, INITIAL_SERIES);
    return list.map(s => {
      // ONLY Silent Heads and Chintu are Exclusive
      const isTargetExclusive =
        s.id === 'series_silent_heads' ||
        s.id === 'series_chitrakatha_chintu' ||
        s.slug === 'silent-heads' ||
        s.slug === 'chitrakatha-chintu' ||
        s.slug === 'chintu';
      return {
        ...s,
        isExclusive: isTargetExclusive,
        totalViews: s.totalViews ?? 0,
        totalReads: s.totalReads ?? 0,
        likesCount: s.likesCount ?? 0,
        bookmarkedCount: s.bookmarkedCount ?? 0,
      };
    });
  },

  saveSeries(seriesList: MangaSeries[]): void {
    setStored(STORAGE_KEYS.SERIES, seriesList);
  },

  getSeriesById(id: string): MangaSeries | undefined {
    return this.getSeries().find(s => s.id === id || s.slug === id);
  },

  createSeries(seriesData: Partial<MangaSeries> & { title: string; author: string; creatorId: string }): MangaSeries {
    const all = this.getSeries();
    const id = `series_${Date.now()}`;
    const slug = seriesData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSeries: MangaSeries = {
      id,
      title: seriesData.title,
      titleJapanese: seriesData.titleJapanese || '',
      slug,
      synopsis: seriesData.synopsis || 'An exciting new manga series on MangaWild.',
      coverUrl: seriesData.coverUrl || 'https://d1yei2z3i6k35z.cloudfront.net/17195590/6ab7d2da116131.63252921_1000331958.jpg',
      author: seriesData.author,
      artist: seriesData.artist || seriesData.author,
      creatorId: seriesData.creatorId,
      genres: seriesData.genres && seriesData.genres.length > 0 ? seriesData.genres : ['Action'],
      status: 'ongoing',
      moderationStatus: 'pending_review',
      totalViews: 0,
      totalReads: 0,
      rating: 5.0,
      releaseYear: new Date().getFullYear(),
      isExclusive: seriesData.isExclusive || false,
      tags: seriesData.tags || ['Original', 'Indie'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(newSeries);
    this.saveSeries(all);

    // Notify Admins
    this.addNotification({
      id: `notif_${Date.now()}`,
      userId: 'user_admin_01',
      title: 'New Series Submitted for Review',
      message: `"${newSeries.title}" by ${newSeries.author} has been submitted for moderation.`,
      type: 'moderation',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/admin',
    });

    return newSeries;
  },

  updateSeries(id: string, updates: Partial<MangaSeries>): MangaSeries | undefined {
    const all = this.getSeries();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveSeries(all);
    return all[idx];
  },

  deleteSeries(id: string): boolean {
    const all = this.getSeries().filter(s => s.id !== id);
    this.saveSeries(all);
    return true;
  },

  // Chapters & Panels
  getChapters(seriesId?: string): Chapter[] {
    const all = getStored<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS);
    const mapped = all.map(c => {
      const isExclusiveSeries =
        c.seriesId === 'series_silent_heads' ||
        c.seriesId === 'series_chitrakatha_chintu';
      return {
        ...c,
        isExclusiveVIP: isExclusiveSeries,
      };
    });
    if (seriesId) {
      return mapped.filter(c => c.seriesId === seriesId).sort((a, b) => a.chapterNumber - b.chapterNumber);
    }
    return mapped;
  },

  saveChapters(chapters: Chapter[]): void {
    setStored(STORAGE_KEYS.CHAPTERS, chapters);
  },

  getChapterById(chapterId: string): Chapter | undefined {
    return this.getChapters().find(c => c.id === chapterId);
  },

  createChapter(chapterData: {
    seriesId: string;
    chapterNumber: number;
    title: string;
    isExclusiveVIP: boolean;
    panels: ChapterPanel[];
  }): Chapter {
    const all = this.getChapters();
    const newChapter: Chapter = {
      id: `ch_${Date.now()}`,
      seriesId: chapterData.seriesId,
      chapterNumber: chapterData.chapterNumber,
      title: chapterData.title,
      slug: `chapter-${chapterData.chapterNumber}-${chapterData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      releaseDate: new Date().toISOString().split('T')[0],
      isExclusiveVIP: chapterData.isExclusiveVIP,
      moderationStatus: 'pending_review',
      viewsCount: 0,
      likesCount: 0,
      panels: chapterData.panels,
    };
    all.push(newChapter);
    this.saveChapters(all);

    this.addNotification({
      id: `notif_${Date.now()}`,
      userId: 'user_admin_01',
      title: 'New Chapter Pending Review',
      message: `Chapter ${newChapter.chapterNumber} ("${newChapter.title}") submitted for moderation review.`,
      type: 'moderation',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/admin',
    });

    return newChapter;
  },

  updateChapter(id: string, updates: Partial<Chapter>): Chapter | undefined {
    const all = this.getChapters();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates };
    this.saveChapters(all);
    return all[idx];
  },

  updateChapterPanels(chapterId: string, panels: ChapterPanel[]): Chapter | undefined {
    const all = this.getChapters();
    const idx = all.findIndex(c => c.id === chapterId);
    if (idx === -1) return undefined;
    all[idx].panels = panels;
    this.saveChapters(all);
    return all[idx];
  },

  // Creators
  getCreators(): CreatorProfile[] {
    return getStored<CreatorProfile[]>(STORAGE_KEYS.CREATORS, INITIAL_CREATORS);
  },

  saveCreators(creators: CreatorProfile[]): void {
    setStored(STORAGE_KEYS.CREATORS, creators);
  },

  getCreatorById(id: string): CreatorProfile | undefined {
    return this.getCreators().find(c => c.id === id || c.userId === id);
  },

  updateCreator(id: string, updates: Partial<CreatorProfile>): CreatorProfile | undefined {
    const all = this.getCreators();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...updates };
    this.saveCreators(all);
    return all[idx];
  },

  updateCreatorProfile(id: string, updates: Partial<CreatorProfile>): CreatorProfile | undefined {
    return this.updateCreator(id, updates);
  },

  // Reviews and Ratings
  getReviews(seriesId?: string): SeriesReview[] {
    const all = getStored<SeriesReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    if (seriesId) {
      return all.filter(r => r.seriesId === seriesId);
    }
    return all;
  },

  getReviewById(reviewId: string): SeriesReview | undefined {
    return this.getReviews().find(r => r.id === reviewId);
  },

  getUserReviews(userId: string): SeriesReview[] {
    return this.getReviews().filter(r => r.userId === userId);
  },

  saveReviews(reviews: SeriesReview[]): void {
    setStored(STORAGE_KEYS.REVIEWS, reviews);
  },

  getReviewSummary(seriesId: string): ReviewSummary {
    const reviews = this.getReviews(seriesId).filter(
      r => r.status === 'approved' || r.status === undefined
    );

    if (reviews.length === 0) {
      const emptyDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      return {
        averageRating: 4.8,
        totalReviews: 0,
        ratingDistribution: emptyDist,
        ratingBreakdown: emptyDist,
      };
    }

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach(r => {
      const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      breakdown[rating] = (breakdown[rating] || 0) + 1;
      totalScore += r.rating;
    });

    const averageRating = Number((totalScore / reviews.length).toFixed(1));

    const dist = breakdown as { 1: number; 2: number; 3: number; 4: number; 5: number };
    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution: dist,
      ratingBreakdown: dist,
    };
  },

  recalculateSeriesRating(seriesId: string): void {
    const summary = this.getReviewSummary(seriesId);
    if (summary.totalReviews > 0) {
      this.updateSeries(seriesId, { rating: summary.averageRating });
    }
  },

  createReview(reviewData: {
    seriesId: string;
    seriesTitle: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar?: string;
    userRole?: string;
    isVIP: boolean;
    rating: number;
    reviewTitle: string;
    reviewText: string;
  }): SeriesReview {
    const all = this.getReviews();
    const existingIdx = all.findIndex(
      r => r.seriesId === reviewData.seriesId && r.userId === reviewData.userId
    );

    if (existingIdx !== -1) {
      all[existingIdx] = {
        ...all[existingIdx],
        rating: reviewData.rating,
        reviewTitle: reviewData.reviewTitle,
        reviewText: reviewData.reviewText,
        isVIP: reviewData.isVIP,
        createdAt: new Date().toISOString(),
      };
      this.saveReviews(all);
      this.recalculateSeriesRating(reviewData.seriesId);
      return all[existingIdx];
    }

    const newReview: SeriesReview = {
      id: `rev_${Date.now()}`,
      seriesId: reviewData.seriesId,
      seriesTitle: reviewData.seriesTitle,
      userId: reviewData.userId,
      userName: reviewData.userName,
      userEmail: reviewData.userEmail,
      userAvatar: reviewData.userAvatar,
      userRole: reviewData.userRole || 'free_user',
      isVIP: reviewData.isVIP,
      rating: reviewData.rating,
      reviewTitle: reviewData.reviewTitle,
      reviewText: reviewData.reviewText,
      likesCount: 0,
      likedByUsers: [],
      status: 'approved',
      isFlagged: false,
      flagCount: 0,
      flags: [],
      createdAt: new Date().toISOString(),
    };

    all.unshift(newReview);
    this.saveReviews(all);
    this.recalculateSeriesRating(reviewData.seriesId);

    const series = this.getSeriesById(reviewData.seriesId);
    if (series) {
      this.addNotification({
        id: `notif_${Date.now()}`,
        userId: series.creatorId,
        title: 'New Review on Your Manga',
        message: `${reviewData.userName} rated "${series.title}" ${reviewData.rating}★: "${reviewData.reviewTitle}"`,
        type: 'series',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/series/${series.id}`,
      });
    }

    return newReview;
  },

  updateReview(reviewId: string, updates: Partial<SeriesReview>): SeriesReview | undefined {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return undefined;

    all[idx] = { ...all[idx], ...updates };
    this.saveReviews(all);
    this.recalculateSeriesRating(all[idx].seriesId);
    return all[idx];
  },

  deleteReview(reviewId: string): boolean {
    const all = this.getReviews();
    const review = all.find(r => r.id === reviewId);
    if (!review) return false;

    const filtered = all.filter(r => r.id !== reviewId);
    this.saveReviews(filtered);
    this.recalculateSeriesRating(review.seriesId);
    return true;
  },

  toggleReviewLike(reviewId: string, userId: string): boolean {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return false;

    const review = all[idx];
    const liked = review.likedByUsers?.includes(userId) ?? false;
    let newLikedBy = [...(review.likedByUsers || [])];

    if (liked) {
      newLikedBy = newLikedBy.filter(id => id !== userId);
    } else {
      newLikedBy.push(userId);
    }

    all[idx] = {
      ...review,
      likedByUsers: newLikedBy,
      likesCount: newLikedBy.length,
    };

    this.saveReviews(all);
    return !liked;
  },

  flagReview(
    reviewId: string,
    flaggerUserId: string,
    flaggerUserName?: string,
    reason?: 'spoiler' | 'inappropriate' | 'spam' | 'harassment' | 'other' | string,
    reasonText?: string
  ): boolean {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return false;

    const review = all[idx];
    const existingFlags = review.flags || [];
    const alreadyFlagged = existingFlags.some(f => f.userId === flaggerUserId);

    if (alreadyFlagged) return false;

    const validReason = (['spoiler', 'inappropriate', 'spam', 'harassment', 'other'].includes(reason as string)
      ? reason
      : 'other') as 'spoiler' | 'inappropriate' | 'spam' | 'harassment' | 'other';

    const newFlags = [
      ...existingFlags,
      {
        id: `flag_${Date.now()}`,
        userId: flaggerUserId,
        userName: flaggerUserName || 'Anonymous',
        reason: validReason,
        reasonText,
        createdAt: new Date().toISOString(),
      },
    ];

    all[idx] = {
      ...review,
      flags: newFlags,
      flagCount: newFlags.length,
      isFlagged: true,
      status: newFlags.length >= 3 ? 'hidden' : 'flagged',
    };

    this.saveReviews(all);
    this.recalculateSeriesRating(review.seriesId);
    return true;
  },

  addOrUpdateReview(reviewData: {
    seriesId: string;
    seriesTitle: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar?: string;
    userRole?: string;
    isVIP: boolean;
    rating: number;
    reviewTitle: string;
    reviewText: string;
  }): SeriesReview {
    return this.createReview(reviewData);
  },

  toggleLikeReview(reviewId: string, userId: string): boolean {
    return this.toggleReviewLike(reviewId, userId);
  },

  unflagReview(reviewId: string, adminId?: string): boolean {
    return this.dismissReviewFlags(reviewId, adminId);
  },

  moderateReview(reviewId: string, action: 'approve' | 'hide' | 'delete', reason?: string, adminId?: string): boolean {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return false;

    const review = all[idx];

    if (action === 'delete') {
      return this.deleteReview(reviewId);
    }

    all[idx] = {
      ...review,
      status: action === 'approve' ? 'approved' : 'hidden',
      isFlagged: action === 'hide',
      moderationReason: reason,
      moderatedBy: adminId || 'Admin',
      moderatedAt: new Date().toISOString(),
    };

    this.saveReviews(all);
    this.recalculateSeriesRating(review.seriesId);
    return true;
  },

  dismissReviewFlags(reviewId: string, adminId?: string): boolean {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return false;

    const review = all[idx];
    all[idx] = {
      ...review,
      status: 'approved',
      isFlagged: false,
      flagCount: 0,
      flags: [],
      moderationReason: undefined,
      moderatedBy: adminId || 'Admin',
      moderatedAt: new Date().toISOString(),
    };

    this.saveReviews(all);
    this.recalculateSeriesRating(review.seriesId);
    return true;
  },

  toggleReviewFlagStatus(
    reviewId: string,
    adminId?: string
  ): { isFlagged: boolean; status: 'approved' | 'flagged' | 'hidden' } {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return { isFlagged: false, status: 'approved' };

    const review = all[idx];
    const currentlyFlagged = review.isFlagged === true || review.status === 'flagged';
    const newFlagged = !currentlyFlagged;
    const newStatus: 'approved' | 'flagged' | 'hidden' = newFlagged ? 'flagged' : 'approved';

    all[idx] = {
      ...review,
      isFlagged: newFlagged,
      status: newStatus,
      moderatedBy: adminId || 'Admin',
      moderatedAt: new Date().toISOString(),
      moderationReason: newFlagged
        ? 'Flagged by Administrator toggle'
        : 'Flags cleared & approved by Administrator',
    };

    this.saveReviews(all);
    this.recalculateSeriesRating(review.seriesId);
    return { isFlagged: newFlagged, status: newStatus };
  },

  updateReviewStatus(
    reviewId: string,
    status: 'approved' | 'flagged' | 'hidden',
    reason?: string,
    adminId?: string
  ): void {
    const all = this.getReviews();
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx >= 0) {
      all[idx].status = status;
      all[idx].isFlagged = status === 'flagged';
      if (reason) all[idx].moderationReason = reason;
      if (adminId) all[idx].moderatedBy = adminId;
      all[idx].moderatedAt = new Date().toISOString();
      this.saveReviews(all);
      this.recalculateSeriesRating(all[idx].seriesId);
    }
  },

  // Comments
  getComments(chapterId: string): Comment[] {
    const all = getStored<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    return all.filter(c => c.chapterId === chapterId && c.status !== 'hidden');
  },

  getCommentsBySeries(seriesId: string): Comment[] {
    const all = getStored<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    return all.filter(c => c.seriesId === seriesId && c.status !== 'hidden');
  },

  addComment(commentData: {
    seriesId: string;
    chapterId?: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userRole?: string;
    content: string;
  }): Comment {
    const all = getStored<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const newComment: Comment = {
      id: `com_${Date.now()}`,
      seriesId: commentData.seriesId,
      chapterId: commentData.chapterId,
      userId: commentData.userId,
      userName: commentData.userName,
      userAvatar: commentData.userAvatar || '/avatars/avatar-1.svg',
      userRole: commentData.userRole || 'free_user',
      isVIP: false,
      content: commentData.content.trim(),
      likes: 0,
      likedByUsers: [],
      createdAt: new Date().toISOString(),
      status: 'approved',
    };
    all.unshift(newComment);
    setStored(STORAGE_KEYS.COMMENTS, all);
    return newComment;
  },

  toggleLikeComment(commentId: string, userId: string): { likes: number; isLiked: boolean } {
    const all = getStored<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const item = all.find(c => c.id === commentId);
    if (!item) return { likes: 0, isLiked: false };
    item.likedByUsers = item.likedByUsers || [];
    const idx = item.likedByUsers.indexOf(userId);
    let isLiked = false;
    if (idx >= 0) {
      item.likedByUsers.splice(idx, 1);
      item.likes = Math.max(0, item.likes - 1);
      isLiked = false;
    } else {
      item.likedByUsers.push(userId);
      item.likes = (item.likes || 0) + 1;
      isLiked = true;
    }
    setStored(STORAGE_KEYS.COMMENTS, all);
    return { likes: item.likes, isLiked };
  },

  deleteComment(commentId: string, userId: string, isAdmin: boolean = false): boolean {
    const all = getStored<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const targetIdx = all.findIndex(c => c.id === commentId);
    if (targetIdx === -1) return false;

    // Retrieve locally tracked user-created comment IDs as fallback
    let myLocalComments: string[] = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('mangawild_my_comments');
        if (stored) myLocalComments = JSON.parse(stored);
      }
    } catch {
      myLocalComments = [];
    }

    const comment = all[targetIdx];
    const isOwner =
      isAdmin ||
      comment.userId === userId ||
      myLocalComments.includes(commentId) ||
      (userId && comment.userId && comment.userId === userId);

    if (!isOwner && !isAdmin) return false;

    all.splice(targetIdx, 1);
    setStored(STORAGE_KEYS.COMMENTS, all);
    return true;
  },

  // Bookmarks / Library
  getBookmarks(userId: string): string[] {
    const bookmarks = getStored<Record<string, string[]>>(STORAGE_KEYS.BOOKMARKS, {
      user_vip_01: ['series_silent_heads', 'series_randamu_boken'],
      user_free_01: ['series_the_trek', 'series_a_promise_never_broken'],
    });
    return bookmarks[userId] || [];
  },

  toggleBookmark(userId: string, seriesId: string): boolean {
    const bookmarks = getStored<Record<string, string[]>>(STORAGE_KEYS.BOOKMARKS, {});
    const userList = bookmarks[userId] || [];
    const exists = userList.includes(seriesId);
    let updatedList: string[];
    if (exists) {
      updatedList = userList.filter(id => id !== seriesId);
    } else {
      updatedList = [...userList, seriesId];
    }
    bookmarks[userId] = updatedList;
    setStored(STORAGE_KEYS.BOOKMARKS, bookmarks);

    // Update bookmarkedCount on series
    const allSeries = this.getSeries();
    const s = allSeries.find(item => item.id === seriesId);
    if (s) {
      s.bookmarkedCount = Math.max(0, (s.bookmarkedCount || 0) + (exists ? -1 : 1));
      this.saveSeries(allSeries);
    }

    return !exists;
  },

  // Series Likes & Reactions
  getLikedSeries(userId: string): string[] {
    const map = getStored<Record<string, string[]>>(STORAGE_KEYS.LIKED_SERIES, {
      user_vip_01: ['series_silent_heads', 'series_randamu_boken'],
      user_free_01: ['series_chitrakatha_chintu'],
    });
    return map[userId] || [];
  },

  isSeriesLiked(userId: string, seriesId: string): boolean {
    return this.getLikedSeries(userId).includes(seriesId);
  },

  toggleLikeSeries(userId: string, seriesId: string): { liked: boolean; likesCount: number } {
    const map = getStored<Record<string, string[]>>(STORAGE_KEYS.LIKED_SERIES, {});
    const userList = map[userId] || [];
    const exists = userList.includes(seriesId);
    let updated: string[];
    if (exists) {
      updated = userList.filter(id => id !== seriesId);
    } else {
      updated = [...userList, seriesId];
    }
    map[userId] = updated;
    setStored(STORAGE_KEYS.LIKED_SERIES, map);

    // Update series total likes
    const allSeries = this.getSeries();
    const s = allSeries.find(item => item.id === seriesId);
    let currentLikes = s?.likesCount || 0;
    if (exists) {
      currentLikes = Math.max(0, currentLikes - 1);
    } else {
      currentLikes += 1;
    }
    if (s) {
      s.likesCount = currentLikes;
      this.saveSeries(allSeries);
    }
    return { liked: !exists, likesCount: currentLikes };
  },

  // Increment Views Count
  incrementSeriesViews(seriesId: string): number {
    const allSeries = this.getSeries();
    const s = allSeries.find(item => item.id === seriesId);
    if (!s) return 0;
    s.totalViews = (s.totalViews || 0) + 1;
    this.saveSeries(allSeries);
    return s.totalViews;
  },

  // Real-time Dynamic View Tracking
  incrementChapterViews(chapterId: string, seriesId: string): void {
    try {
      // 1. Increment chapter views
      const chapters = this.getChapters();
      const ch = chapters.find(c => c.id === chapterId);
      if (ch) {
        ch.viewsCount = (ch.viewsCount || 0) + 1;
        this.saveChapters(chapters);
      }

      // 2. Increment series views and total reads
      const seriesList = this.getSeries();
      const s = seriesList.find(item => item.id === seriesId);
      if (s) {
        s.totalViews = (s.totalViews || 0) + 1;
        s.totalReads = (s.totalReads || 0) + 1;
        this.saveSeries(seriesList);

        // 3. Increment creator reads
        if (s.creatorId) {
          const creators = this.getCreators();
          const creator = creators.find(c => c.id === s.creatorId || c.userId === s.creatorId);
          if (creator) {
            creator.totalReads = (creator.totalReads || 0) + 1;
            this.saveCreators(creators);
          }
        }
      }

      // 4. Record daily view log for creator analytics
      const today = new Date().toISOString().split('T')[0];
      const dailyViewsMap = getStored<Record<string, number>>('mw_daily_views_log', {});
      dailyViewsMap[today] = (dailyViewsMap[today] || 0) + 1;
      setStored('mw_daily_views_log', dailyViewsMap);
    } catch (e) {
      console.error('Failed to increment chapter views:', e);
    }
  },

  getDailyViewsHistory(days: number = 30): { date: string; day: string; views: number }[] {
    const dailyViewsMap = getStored<Record<string, number>>('mw_daily_views_log', {});
    const result: { date: string; day: string; views: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({
        date: iso,
        day: label,
        views: dailyViewsMap[iso] || 0,
      });
    }
    return result;
  },

  // Helper to find creator by author name or handle
  getCreatorByAuthorName(authorName: string): CreatorProfile | undefined {
    if (!authorName) return undefined;
    const clean = authorName.trim().toLowerCase();
    const creators = this.getCreators();
    const found = creators.find(c => {
      const pen = c.penName.toLowerCase();
      const h = c.handle.toLowerCase().replace('@', '');
      return (
        pen === clean ||
        pen.includes(clean) ||
        clean.includes(pen) ||
        h === clean ||
        c.userId.toLowerCase() === clean
      );
    });
    if (found) return found;

    // Check if there is an existing series by this author
    const allSeries = this.getSeries();
    const series = allSeries.find(s => s.author.toLowerCase() === clean || s.author.toLowerCase().includes(clean));
    if (series) {
      const byId = creators.find(c => c.id === series.creatorId || c.userId === series.creatorId);
      if (byId) return byId;

      const newProfile: CreatorProfile = {
        id: series.creatorId || `creator_${clean.replace(/[^a-z0-9]/g, '_')}`,
        userId: series.creatorId || `user_${clean.replace(/[^a-z0-9]/g, '_')}`,
        penName: series.author,
        handle: `@${clean.replace(/\s+/g, '_')}`,
        bio: `Original Mangaka of "${series.title}" on MangaWild. Serializing original chapters with weekly updates.`,
        avatarUrl: series.coverUrl,
        socialLinks: {
          instagram: `https://instagram.com/${clean.replace(/\s+/g, '_')}`,
          twitter: `https://x.com/${clean.replace(/\s+/g, '_')}`,
          website: 'https://mangawild.com',
        },
        followersCount: 0,
        seriesCount: 1,
        totalReads: series.totalReads ?? 0,
        monthlyEarningsInr: 0,
        revenueSharePercent: 70,
        verified: true,
        joinedAt: '2026-01-15',
      };
      creators.push(newProfile);
      this.saveCreators(creators);
      return newProfile;
    }

    return undefined;
  },

  // Reading History & Progress
  getReadingHistory(userId: string): ReadingHistoryItem[] {
    const history = getStored<Record<string, ReadingHistoryItem[]>>(STORAGE_KEYS.READING_HISTORY, {
      user_vip_01: [
        {
          seriesId: 'series_silent_heads',
          chapterId: 'ch_silent_heads_01',
          chapterNumber: 1,
          panelIndex: 5,
          totalPanels: 19,
          updatedAt: '2026-09-28T12:00:00Z',
        },
      ],
    });
    return history[userId] || [];
  },

  saveReadingProgress(userId: string, item: ReadingHistoryItem): void {
    const history = getStored<Record<string, ReadingHistoryItem[]>>(STORAGE_KEYS.READING_HISTORY, {});
    const userList = history[userId] || [];
    const idx = userList.findIndex(h => h.seriesId === item.seriesId);
    if (idx >= 0) {
      userList[idx] = item;
    } else {
      userList.unshift(item);
    }
    history[userId] = userList;
    setStored(STORAGE_KEYS.READING_HISTORY, history);
  },

  // Followed Creators
  getFollowedCreators(userId: string): string[] {
    const map = getStored<Record<string, string[]>>(STORAGE_KEYS.FOLLOWED_CREATORS, {
      user_vip_01: ['creator_deep_mangaka', 'creator_flad_z'],
    });
    return map[userId] || [];
  },

  toggleFollowCreator(userId: string, creatorId: string): boolean {
    const map = getStored<Record<string, string[]>>(STORAGE_KEYS.FOLLOWED_CREATORS, {});
    const list = map[userId] || [];
    const isFollowing = list.includes(creatorId);
    if (isFollowing) {
      map[userId] = list.filter(id => id !== creatorId);
    } else {
      map[userId] = [...list, creatorId];
    }
    setStored(STORAGE_KEYS.FOLLOWED_CREATORS, map);

    // Dynamically update followersCount on CreatorProfile
    const creators = this.getCreators();
    const target = creators.find(c => c.id === creatorId || c.userId === creatorId);
    if (target) {
      if (isFollowing) {
        target.followersCount = Math.max(0, (target.followersCount || 1) - 1);
      } else {
        target.followersCount = (target.followersCount || 0) + 1;
      }
      this.saveCreators(creators);
    }

    return !isFollowing;
  },

  // Payments & Razorpay Record Log
  getPayments(): PaymentRecord[] {
    return getStored<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, [
      {
        id: 'pay_rec_001',
        razorpayOrderId: 'order_MW_VIP_99812',
        razorpayPaymentId: 'pay_MW_VIP_SAMPLE_998',
        userId: 'user_vip_01',
        userEmail: 'vip.reader@mangawild.online',
        planId: 'monthly',
        amountInr: 199,
        currency: 'INR',
        status: 'captured',
        paymentMethod: 'UPI',
        createdAt: '2026-09-01T08:14:00Z',
        invoiceNumber: 'INV-MW-2026-09-001',
      },
    ]);
  },

  recordPayment(record: Omit<PaymentRecord, 'id' | 'createdAt' | 'invoiceNumber'>): PaymentRecord {
    const all = this.getPayments();
    const newRecord: PaymentRecord = {
      ...record,
      id: `pay_rec_${Date.now()}`,
      createdAt: new Date().toISOString(),
      invoiceNumber: `INV-MW-${Date.now().toString().slice(-6)}`,
    };
    all.unshift(newRecord);
    setStored(STORAGE_KEYS.PAYMENTS, all);
    return newRecord;
  },

  // Notifications
  getNotifications(userId: string): PlatformNotification[] {
    const all = getStored<PlatformNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: 'notif_welcome',
        userId: 'all',
        title: 'Welcome to MangaWild!',
        message: 'Explore original and exclusive indie manga with seamless panel reading & creator monetization.',
        type: 'system',
        read: false,
        createdAt: '2026-09-20T00:00:00Z',
        link: '/browse',
      },
    ]);
    return all.filter(n => n.userId === 'all' || n.userId === userId);
  },

  addNotification(notif: PlatformNotification): void {
    const all = getStored<PlatformNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.unshift(notif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  markNotificationsRead(userId: string): void {
    const all = getStored<PlatformNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.forEach(n => {
      if (n.userId === 'all' || n.userId === userId) {
        n.read = true;
      }
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  // User Issue Reports
  getReports(): UserReport[] {
    return getStored<UserReport[]>(STORAGE_KEYS.REPORTS, []);
  },

  addReport(reportData: Omit<UserReport, 'id' | 'createdAt' | 'status'>): UserReport {
    const all = this.getReports();
    const newReport: UserReport = {
      ...reportData,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    all.unshift(newReport);
    setStored(STORAGE_KEYS.REPORTS, all);

    // Also add system notification to admin
    this.addNotification({
      id: `notif_rep_${Date.now()}`,
      userId: 'user_admin_01',
      title: `New Issue Reported: ${newReport.categoryLabel}`,
      message: `"${newReport.subject}" - ${newReport.description.slice(0, 80)}...`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/admin',
    });

    return newReport;
  },

  deleteReport(id: string): void {
    const all = this.getReports().filter(r => r.id !== id);
    setStored(STORAGE_KEYS.REPORTS, all);
  },

  updateReportStatus(id: string, status: 'pending' | 'reviewed' | 'resolved'): void {
    const all = this.getReports();
    const item = all.find(r => r.id === id);
    if (item) {
      item.status = status;
      setStored(STORAGE_KEYS.REPORTS, all);
    }
  },

  // Password Reset with OTP
  savePasswordResetOTP(email: string, otp: string): void {
    const allResets = getStored<Record<string, { otp: string; expiresAt: number }>>(
      STORAGE_KEYS.PASSWORD_RESETS,
      {}
    );
    allResets[email.trim().toLowerCase()] = {
      otp: otp.trim(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins validity
    };
    setStored(STORAGE_KEYS.PASSWORD_RESETS, allResets);
  },

  verifyPasswordResetOTP(email: string, enteredOtp: string): boolean {
    const allResets = getStored<Record<string, { otp: string; expiresAt: number }>>(
      STORAGE_KEYS.PASSWORD_RESETS,
      {}
    );
    const record = allResets[email.trim().toLowerCase()];
    if (!record) return false;
    if (Date.now() > record.expiresAt) return false;
    return record.otp === enteredOtp.trim();
  },

  resetPassword(email: string, newPassword: string): boolean {
    const allUsers = this.getUsers();
    const target = allUsers.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!target) return false;

    target.password = newPassword;
    this.saveUsers(allUsers);

    // If current user is logged in as this user, update them
    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === email.trim().toLowerCase()) {
      current.password = newPassword;
      this.setCurrentUser(current);
    }

    // Clean up reset OTP record
    const allResets = getStored<Record<string, { otp: string; expiresAt: number }>>(
      STORAGE_KEYS.PASSWORD_RESETS,
      {}
    );
    delete allResets[email.trim().toLowerCase()];
    setStored(STORAGE_KEYS.PASSWORD_RESETS, allResets);

    return true;
  },

  // Reset to Factory Seed
  resetToFactorySeed(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SERIES);
    localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
    localStorage.removeItem(STORAGE_KEYS.CREATORS);
    localStorage.removeItem(STORAGE_KEYS.COMMENTS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.READING_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.FOLLOWED_CREATORS);
    window.location.reload();
  },
};

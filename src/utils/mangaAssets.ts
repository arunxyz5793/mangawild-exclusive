/**
 * MangaWild Exclusive - Manga Cover Art & Panel Vector Engine
 * Generates beautiful, crisp SVG manga covers and authentic manga panels that never fail to load.
 */

export function generateMangaCoverSvg(title: string, subtitle: string, genre: string, rank?: number, theme: 'blue' | 'gold' | 'ink' | 'crimson' | 'emerald' | 'purple' = 'crimson'): string {
  const themes = {
    blue: {
      bg1: '#050c1e',
      bg2: '#0b1d3a',
      accent: '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.4)',
      titleColor: '#f0f9ff',
      tagBg: '#0284c7',
      kanji: '幻界',
    },
    gold: {
      bg1: '#1c1305',
      bg2: '#382508',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.4)',
      titleColor: '#fffbeb',
      tagBg: '#d97706',
      kanji: '魂線',
    },
    ink: {
      bg1: '#090a0f',
      bg2: '#181924',
      accent: '#e2e8f0',
      accentGlow: 'rgba(226, 232, 240, 0.3)',
      titleColor: '#ffffff',
      tagBg: '#334155',
      kanji: '撃星',
    },
    crimson: {
      bg1: '#121215',
      bg2: '#242429',
      accent: '#ffffff',
      accentGlow: 'rgba(255, 255, 255, 0.2)',
      titleColor: '#fafafa',
      tagBg: '#3f3f46',
      kanji: '野性',
    },
    emerald: {
      bg1: '#04160d',
      bg2: '#0a2e1d',
      accent: '#10b981',
      accentGlow: 'rgba(16, 185, 129, 0.4)',
      titleColor: '#ecfdf5',
      tagBg: '#059669',
      kanji: '魔導',
    },
    purple: {
      bg1: '#11061f',
      bg2: '#280c44',
      accent: '#a855f7',
      accentGlow: 'rgba(168, 85, 247, 0.4)',
      titleColor: '#faf5ff',
      tagBg: '#7e22ce',
      kanji: '時空',
    },
  };

  const t = themes[theme] || themes.crimson;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.bg1}" />
        <stop offset="50%" stop-color="${t.bg2}" />
        <stop offset="100%" stop-color="${t.bg1}" />
      </linearGradient>
      <linearGradient id="scrim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.2)" />
        <stop offset="60%" stop-color="rgba(0,0,0,0.4)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.92)" />
      </linearGradient>
      <radialGradient id="aura_${theme}" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${t.bg1}" stop-opacity="0" />
      </radialGradient>
      <pattern id="manga_screentone" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="rgba(255,255,255,0.06)" />
        <circle cx="6" cy="6" r="0.9" fill="rgba(255,255,255,0.06)" />
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="600" height="800" fill="url(#g_${theme})" />
    <circle cx="300" cy="320" r="240" fill="url(#aura_${theme})" />
    <rect width="600" height="800" fill="url(#manga_screentone)" />

    <!-- Speedlines & dynamic manga geometrical art -->
    <g opacity="0.3" stroke="${t.accent}" stroke-width="1.2">
      <line x1="300" y1="320" x2="30" y2="40" stroke-dasharray="10 20" />
      <line x1="300" y1="320" x2="570" y2="40" stroke-dasharray="8 16" />
      <line x1="300" y1="320" x2="60" y2="760" stroke-dasharray="12 24" />
      <line x1="300" y1="320" x2="540" y2="760" stroke-dasharray="6 18" />
      <circle cx="300" cy="320" r="160" fill="none" stroke-width="1" stroke-dasharray="4 8" />
      <circle cx="300" cy="320" r="90" fill="none" stroke-width="1.5" />
    </g>

    <!-- Character Silhouette / Central Art Element -->
    <g transform="translate(190, 180)">
      <!-- Halo/mandala -->
      <circle cx="110" cy="110" r="95" fill="none" stroke="${t.accent}" stroke-width="2" opacity="0.6"/>
      <polygon points="110,20 185,150 35,150" fill="none" stroke="${t.accent}" stroke-width="1.5" opacity="0.4"/>
      <polygon points="110,200 185,70 35,70" fill="none" stroke="${t.accent}" stroke-width="1.5" opacity="0.4"/>

      <!-- Dramatic heroic figure silhouette -->
      <path d="M110,70 Q130,70 135,90 Q145,115 130,135 Q155,145 170,185 L180,320 L40,320 L50,185 Q65,145 90,135 Q75,115 85,90 Q90,70 110,70 Z" fill="#080a10" stroke="${t.accent}" stroke-width="2"/>
      <!-- Glowing Eyes -->
      <ellipse cx="102" cy="100" rx="3.5" ry="2" fill="${t.accent}" filter="drop-shadow(0 0 4px ${t.accent})"/>
      <ellipse cx="118" cy="100" rx="3.5" ry="2" fill="${t.accent}" filter="drop-shadow(0 0 4px ${t.accent})"/>
      <!-- Manga Katana/Aura Blade -->
      <line x1="165" y1="120" x2="230" y2="40" stroke="#ffffff" stroke-width="3"/>
      <line x1="165" y1="120" x2="230" y2="40" stroke="${t.accent}" stroke-width="7" opacity="0.6"/>
    </g>

    <!-- Japanese/Manga Kanji Watermark Stamp -->
    <g transform="translate(480, 50)" opacity="0.85">
      <rect width="64" height="120" rx="6" fill="#000000" fill-opacity="0.6" stroke="${t.accent}" stroke-width="1.2"/>
      <text x="32" y="45" font-family="'Cinzel', serif" font-size="28" font-weight="900" fill="${t.accent}" text-anchor="middle">${t.kanji[0]}</text>
      <text x="32" y="95" font-family="'Cinzel', serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">${t.kanji[1] || ''}</text>
    </g>

    <!-- Dark Scrim Gradient for typography -->
    <rect width="600" height="800" fill="url(#scrim)" />

    <!-- Volume & Status Tag on Top Left -->
    <g transform="translate(36, 46)">
      <rect width="84" height="26" rx="4" fill="${t.tagBg}" />
      <text x="42" y="17" font-family="'Bebas Neue', sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">VOL. 01</text>
      ${rank ? `
      <rect x="94" y="0" width="46" height="26" rx="4" fill="#111827" stroke="${t.accent}" stroke-width="1"/>
      <text x="117" y="17" font-family="'Bebas Neue', sans-serif" font-size="14" font-weight="bold" fill="${t.accent}" text-anchor="middle">#${rank}</text>
      ` : ''}
    </g>

    <!-- Genre Badge -->
    <g transform="translate(36, 620)">
      <text x="0" y="0" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="${t.accent}" letter-spacing="2">${genre.toUpperCase()} EXCLUSIVE</text>
    </g>

    <!-- Title & Subtitle -->
    <g transform="translate(36, 665)">
      <text x="0" y="0" font-family="'Cinzel', 'Rozha One', serif" font-size="34" font-weight="800" fill="${t.titleColor}" letter-spacing="0.5">${title}</text>
      <text x="0" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">${subtitle}</text>
      <line x1="0" y1="48" x2="220" y2="48" stroke="${t.accent}" stroke-width="2"/>
    </g>

    <!-- Bottom branding -->
    <g transform="translate(36, 765)">
      <text x="0" y="0" font-family="'Bebas Neue', sans-serif" font-size="16" fill="#94a3b8" letter-spacing="2">MANGAWILD EXCLUSIVE · CHAPTER VERIFIED</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates high-contrast, action-packed manga panels for chapters
 */
export function generateChapterPanelSvg(panelNumber: number, seriesTitle: string, scene: {
  action: string;
  dialogue?: string;
  speaker?: string;
  sfx?: string;
  type: 'action' | 'dialogue' | 'reveal' | 'climax' | 'establishing';
}): string {
  const isClimax = scene.type === 'climax';
  const isAction = scene.type === 'action';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1300" width="100%" height="100%">
    <defs>
      <linearGradient id="pbg_${panelNumber}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0a0b10" />
        <stop offset="50%" stop-color="#12141e" />
        <stop offset="100%" stop-color="#07080d" />
      </linearGradient>
      <pattern id="halftone_${panelNumber}" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" fill="rgba(255,255,255,0.08)" />
      </pattern>
    </defs>

    <!-- Canvas Frame -->
    <rect width="900" height="1300" fill="#000000" />
    <rect x="24" y="24" width="852" height="1252" fill="url(#pbg_${panelNumber})" stroke="#ffffff" stroke-width="3" />
    <rect x="24" y="24" width="852" height="1252" fill="url(#halftone_${panelNumber})" />

    <!-- Manga Speedlines / Background perspective -->
    <g opacity="${isAction || isClimax ? '0.7' : '0.25'}" stroke="#ffffff">
      ${Array.from({ length: 28 }).map((_, i) => {
        const angle = (i * 360) / 28;
        const rad = (angle * Math.PI) / 180;
        const x2 = 450 + Math.cos(rad) * 650;
        const y2 = 650 + Math.sin(rad) * 650;
        return `<line x1="450" y1="650" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${i % 2 === 0 ? '2' : '0.8'}" opacity="${0.15 + (i % 3) * 0.2}" />`;
      }).join('\n')}
    </g>

    <!-- Japanese/Manga sound effects SFX onomatopoeia -->
    ${scene.sfx ? `
    <g transform="translate(680, 240) rotate(-12)">
      <rect x="-40" y="-35" width="220" height="90" rx="8" fill="#000000" stroke="#ffffff" stroke-width="2" opacity="0.95"/>
      <text x="70" y="28" font-family="'Cinzel', 'Bebas Neue', serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">${scene.sfx}</text>
    </g>
    ` : ''}

    <!-- Panel Art Illustration: Dramatic Silhouette & Kinetic Energy -->
    <g transform="translate(200, 360)">
      <!-- Energy Aura -->
      <path d="M250,50 L280,180 L350,150 L310,280 L420,320 L270,420 L320,580 L180,480 L110,610 L150,420 L30,350 L160,260 L90,160 L210,180 Z" fill="${isClimax ? '#ffffff' : '#475569'}" opacity="0.3"/>
      
      <!-- Character Stance -->
      <path d="M250,120 Q290,120 295,170 Q310,220 270,260 Q340,300 370,420 L400,640 L110,640 L140,420 Q170,300 230,260 Q190,220 205,170 Q210,120 250,120 Z" fill="#030407" stroke="#ffffff" stroke-width="3"/>
      
      <!-- Blade / Weapon / Energy Beam -->
      <line x1="160" y1="460" x2="420" y2="140" stroke="#ffffff" stroke-width="6"/>
      <line x1="160" y1="460" x2="420" y2="140" stroke="${isClimax ? '#ffffff' : '#94a3b8'}" stroke-width="16" opacity="0.6"/>
      
      <!-- Eye Flash -->
      <circle cx="238" cy="180" r="5" fill="#ffffff"/>
      <circle cx="262" cy="180" r="5" fill="#ffffff"/>
      <circle cx="238" cy="180" r="8" fill="${isClimax ? '#ffffff' : '#94a3b8'}" opacity="0.8"/>
      <circle cx="262" cy="180" r="8" fill="${isClimax ? '#ffffff' : '#94a3b8'}" opacity="0.8"/>
    </g>

    <!-- Speech / Thought Bubble -->
    ${scene.dialogue ? `
    <g transform="translate(100, 160)">
      <path d="M40,0 L320,0 Q360,0 360,40 L360,110 Q360,150 320,150 L120,150 L60,195 L80,150 L40,150 Q0,150 0,110 L0,40 Q0,0 40,0 Z" fill="#ffffff" stroke="#111827" stroke-width="3"/>
      ${scene.speaker ? `<text x="30" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#0f172a" letter-spacing="1">${scene.speaker.toUpperCase()}:</text>` : ''}
      <text x="30" y="66" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="700" fill="#0f172a">"${scene.dialogue}"</text>
    </g>
    ` : ''}

    <!-- Action Description / Panel Narration Box at Bottom -->
    <g transform="translate(60, 1100)">
      <rect width="780" height="96" rx="6" fill="#0b0f19" fill-opacity="0.9" stroke="#334155" stroke-width="1.5"/>
      <text x="30" y="38" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700" fill="#94a3b8" letter-spacing="1">PANEL ${panelNumber} · ${seriesTitle.toUpperCase()}</text>
      <text x="30" y="70" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="500" fill="#f8fafc">${scene.action}</text>
    </g>

    <!-- Page Number Watermark -->
    <text x="830" y="1250" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#64748b" text-anchor="end">PAGE ${panelNumber}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

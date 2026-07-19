'use client';

import { cn } from '@armz-clash/ui';

export type ArmzPalette = {
  skinTone: string;
  primaryCloth: string;
  accent: string;
  glove: string;
};

const PRESET_DETAILS: Record<
  string,
  { wrapStyle: 'leather' | 'work' | 'athletic' | 'metal' | 'cloth' | 'tournament'; emblem: string }
> = {
  rookie_brawler: { wrapStyle: 'leather', emblem: 'R' },
  dockhand: { wrapStyle: 'work', emblem: 'D' },
  street_challenger: { wrapStyle: 'athletic', emblem: 'S' },
  iron_apprentice: { wrapStyle: 'metal', emblem: 'I' },
  desert_grappler: { wrapStyle: 'cloth', emblem: 'G' },
  arena_recruit: { wrapStyle: 'tournament', emblem: 'A' },
};

function hashHex(hex: string): string {
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/**
 * Original hybrid SVG collectible portrait for Common demo ARMZ presets.
 * Distinct silhouettes, wraps, and materials — stylized premium web-game art.
 */
export function ArmzPortrait({
  presetKey,
  displayName,
  palette,
  className,
  size = 'md',
}: {
  presetKey: string;
  displayName?: string;
  palette: ArmzPalette | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}) {
  const detail = PRESET_DETAILS[presetKey] ?? PRESET_DETAILS.rookie_brawler!;
  const skin = hashHex(palette?.skinTone ?? 'c48a6a');
  const cloth = hashHex(palette?.primaryCloth ?? '3d2b22');
  const accent = hashHex(palette?.accent ?? 'd4af6a');
  const glove = hashHex(palette?.glove ?? '2a221c');
  const uid = `armz-${presetKey.replace(/_/g, '-')}`;

  const height =
    size === 'hero'
      ? 'h-72 sm:h-80'
      : size === 'lg'
        ? 'h-56 sm:h-64'
        : size === 'sm'
          ? 'h-36'
          : 'h-48 sm:h-52';

  return (
    <div
      className={cn('armz-portrait armz-portrait--common', height, 'w-full', className)}
      role="img"
      aria-label={displayName ? `${displayName} portrait` : 'ARMZ portrait'}
      data-testid="armz-portrait"
      data-preset={presetKey}
    >
      <svg viewBox="0 0 280 320" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-arena`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c2740" />
            <stop offset="55%" stopColor="#0d121c" />
            <stop offset="100%" stopColor="#070a10" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="38%" r="45%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="70%" stopColor={accent} stopOpacity="0.08" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={skin} />
            <stop offset="100%" stopColor={skin} stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id={`${uid}-glove`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={glove} stopOpacity="0.95" />
            <stop offset="100%" stopColor={glove} />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <rect width="280" height="320" fill={`url(#${uid}-arena)`} />
        <ellipse cx="140" cy="120" rx="110" ry="90" fill={`url(#${uid}-glow)`} />

        {/* Soft stage platform */}
        <ellipse cx="140" cy="278" rx="92" ry="14" fill="#000" opacity="0.45" />
        <ellipse cx="140" cy="274" rx="78" ry="8" fill={accent} opacity="0.12" />

        {/* Shoulder mass */}
        <path
          d="M78 210 C70 170 78 140 100 118 C120 100 150 92 168 104 C190 118 202 148 198 188 C196 210 188 230 170 242 L112 248 C92 242 82 228 78 210Z"
          fill={`url(#${uid}-skin)`}
        />

        {/* Cloth / sleeve base — varies by wrap */}
        {detail.wrapStyle === 'work' && (
          <>
            <path
              d="M88 150 C100 130 140 122 175 138 L172 210 C150 220 110 224 92 210Z"
              fill={cloth}
            />
            <path d="M95 168 H175" stroke={accent} strokeWidth="3" opacity="0.7" />
            <path d="M98 182 H170" stroke={accent} strokeWidth="2" opacity="0.4" />
          </>
        )}
        {detail.wrapStyle === 'leather' && (
          <>
            <path
              d="M90 155 C108 128 150 120 178 142 L170 218 C140 230 108 228 94 208Z"
              fill={cloth}
            />
            <path
              d="M100 165 C120 155 150 155 168 168"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M102 182 C124 172 150 174 166 188"
              fill="none"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.7"
            />
          </>
        )}
        {detail.wrapStyle === 'athletic' && (
          <>
            <path
              d="M92 148 C112 124 155 118 180 140 L174 212 C145 226 110 224 94 204Z"
              fill={cloth}
            />
            <path d="M108 155 L118 205" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            <path
              d="M128 148 L138 210"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M148 150 L156 208"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
          </>
        )}
        {detail.wrapStyle === 'metal' && (
          <>
            <path
              d="M90 152 C110 126 152 120 178 144 L172 216 C142 230 108 226 94 206Z"
              fill={cloth}
            />
            <rect x="104" y="168" width="64" height="28" rx="4" fill={glove} opacity="0.85" />
            <rect x="108" y="172" width="56" height="6" rx="2" fill={accent} opacity="0.7" />
            <rect x="108" y="184" width="56" height="4" rx="1" fill={accent} opacity="0.35" />
          </>
        )}
        {detail.wrapStyle === 'cloth' && (
          <>
            <path
              d="M88 150 C110 124 158 118 182 142 L176 214 C144 228 106 226 92 204Z"
              fill={cloth}
            />
            <path
              d="M100 160 C130 148 160 152 172 168 C150 175 124 174 106 180Z"
              fill={accent}
              opacity="0.55"
            />
            <path
              d="M102 190 C132 178 160 182 170 196"
              fill="none"
              stroke={accent}
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </>
        )}
        {detail.wrapStyle === 'tournament' && (
          <>
            <path
              d="M90 148 C112 122 156 116 182 140 L176 212 C146 226 108 224 94 202Z"
              fill={cloth}
            />
            <path d="M110 160 H170 V200 H110Z" fill={glove} opacity="0.25" />
            <path
              d="M118 170 H162"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="140" cy="186" r="8" fill={accent} opacity="0.85" />
          </>
        )}

        {/* Bicep highlight */}
        <ellipse cx="128" cy="150" rx="22" ry="30" fill="#fff" opacity="0.06" />

        {/* Forearm to fist */}
        <path
          d="M150 200 C168 210 188 218 198 236 C204 248 200 262 186 268 C172 274 156 266 148 252 C140 238 140 218 150 200Z"
          fill={`url(#${uid}-skin)`}
        />

        {/* Wrist strap / cuff */}
        <path
          d="M158 236 C170 240 182 246 188 254 C184 258 174 256 164 250 C156 246 154 240 158 236Z"
          fill={accent}
        />

        {/* Glove / fist mass */}
        <ellipse cx="188" cy="252" rx="34" ry="28" fill={`url(#${uid}-glove)`} />
        <ellipse cx="198" cy="246" rx="14" ry="12" fill={skin} opacity="0.35" />
        {/* Knuckle ridges */}
        <circle cx="176" cy="244" r="5" fill={skin} opacity="0.35" />
        <circle cx="188" cy="240" r="5.5" fill={skin} opacity="0.4" />
        <circle cx="200" cy="242" r="5" fill={skin} opacity="0.35" />
        <circle cx="210" cy="248" r="4.5" fill={skin} opacity="0.3" />

        {/* Accent rings / personality cue */}
        {detail.wrapStyle === 'athletic' && (
          <path
            d="M168 228 C178 230 190 236 196 244"
            fill="none"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
        {detail.wrapStyle === 'metal' && (
          <path d="M162 232 H198" stroke={accent} strokeWidth="2" opacity="0.8" />
        )}

        {/* Emblem plate */}
        <g transform="translate(28 36)">
          <rect
            width="40"
            height="40"
            rx="10"
            fill="#0b1018"
            stroke={accent}
            strokeWidth="1.5"
            opacity="0.9"
          />
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fill={accent}
            fontFamily="system-ui,sans-serif"
            fontSize="16"
            fontWeight="700"
          >
            {detail.emblem}
          </text>
        </g>

        {/* Common rarity ribbon */}
        <g transform="translate(168 28)">
          <rect
            width="84"
            height="22"
            rx="11"
            fill="#0b1018"
            stroke="#9aa4b2"
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x="42"
            y="15"
            textAnchor="middle"
            fill="#c5ced9"
            fontFamily="system-ui,sans-serif"
            fontSize="9"
            fontWeight="700"
            letterSpacing="1.2"
          >
            COMMON
          </text>
        </g>

        {/* Soft vignette */}
        <rect width="280" height="320" fill="url(#gradVignette)" opacity="0" />
      </svg>
    </div>
  );
}

export function AutomatonPortrait({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}) {
  const height =
    size === 'hero'
      ? 'h-72 sm:h-80'
      : size === 'lg'
        ? 'h-56 sm:h-64'
        : size === 'sm'
          ? 'h-36'
          : 'h-48 sm:h-52';

  return (
    <div
      className={cn('armz-portrait armz-portrait--enemy', height, 'w-full', className)}
      role="img"
      aria-label="Practice Automaton portrait"
      data-testid="automaton-portrait"
    >
      <svg viewBox="0 0 280 320" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="auto-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#221c30" />
            <stop offset="100%" stopColor="#080a10" />
          </linearGradient>
          <linearGradient id="auto-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8a93a0" />
            <stop offset="50%" stopColor="#5a6470" />
            <stop offset="100%" stopColor="#3a4250" />
          </linearGradient>
          <linearGradient id="auto-glow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b8def" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4ecdc4" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="auto-rim" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#e07a4a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e07a4a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="280" height="320" fill="url(#auto-bg)" />
        <ellipse cx="140" cy="130" rx="100" ry="80" fill="url(#auto-rim)" />
        <ellipse cx="140" cy="278" rx="90" ry="12" fill="#000" opacity="0.5" />

        {/* Mechanical torso block */}
        <path
          d="M86 200 C80 150 96 118 128 108 C160 98 198 112 208 156 C214 188 204 230 176 248 L104 248 C90 234 88 216 86 200Z"
          fill="url(#auto-metal)"
        />
        {/* Panel seams */}
        <path d="M110 130 L170 130 L168 210 L112 210Z" fill="#2a3140" opacity="0.55" />
        <path d="M118 148 H162" stroke="#5b8def" strokeWidth="2" opacity="0.7" />
        <path d="M118 168 H162" stroke="#4ecdc4" strokeWidth="2" opacity="0.45" />
        <circle cx="140" cy="188" r="10" fill="#0b1018" stroke="#5b8def" strokeWidth="2" />
        <circle cx="140" cy="188" r="4" fill="#5b8def" />

        {/* Articulated arm */}
        <path
          d="M176 170 C200 176 220 188 228 210 C234 226 228 244 210 250 C192 256 176 246 170 230 C164 214 166 188 176 170Z"
          fill="url(#auto-metal)"
        />
        <rect
          x="188"
          y="198"
          width="40"
          height="14"
          rx="3"
          fill="#1a2030"
          stroke="#5b8def"
          strokeWidth="1.5"
        />
        <ellipse
          cx="222"
          cy="236"
          rx="28"
          ry="24"
          fill="#2c3344"
          stroke="#8a93a0"
          strokeWidth="2"
        />
        {/* Mechanical knuckles */}
        <circle cx="210" cy="228" r="5" fill="#5b8def" opacity="0.85" />
        <circle cx="222" cy="224" r="5.5" fill="#4ecdc4" opacity="0.75" />
        <circle cx="234" cy="230" r="5" fill="#5b8def" opacity="0.7" />

        {/* Visor stripe */}
        <rect x="112" y="120" width="56" height="10" rx="3" fill="url(#auto-glow)" />

        {/* Easy badge */}
        <g transform="translate(24 30)">
          <rect width="72" height="24" rx="12" fill="#0b1018" stroke="#e07a4a" strokeWidth="1.2" />
          <text
            x="36"
            y="16"
            textAnchor="middle"
            fill="#f0a878"
            fontFamily="system-ui,sans-serif"
            fontSize="10"
            fontWeight="700"
            letterSpacing="1"
          >
            EASY
          </text>
        </g>

        <g transform="translate(168 30)">
          <rect width="88" height="24" rx="12" fill="#0b1018" stroke="#5b8def" strokeWidth="1.2" />
          <text
            x="44"
            y="16"
            textAnchor="middle"
            fill="#8ec0ff"
            fontFamily="system-ui,sans-serif"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.8"
          >
            AUTOMATON
          </text>
        </g>
      </svg>
    </div>
  );
}

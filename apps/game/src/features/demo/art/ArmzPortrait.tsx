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
 * Phase 3.3 collectible portrait — anatomically connected arm-wrestling fighter.
 * Shoulder → upper arm → elbow → forearm → wrist → fist, all visually linked.
 * Each preset has distinct wraps, materials, and silhouette personality.
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
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2438" />
            <stop offset="60%" stopColor="#0d121c" />
            <stop offset="100%" stopColor="#070a10" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
            <stop offset="60%" stopColor={accent} stopOpacity="0.06" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={skin} />
            <stop offset="100%" stopColor={skin} stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cloth} />
            <stop offset="100%" stopColor={cloth} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="280" height="320" fill={`url(#${uid}-bg)`} />
        <ellipse cx="140" cy="110" rx="100" ry="85" fill={`url(#${uid}-glow)`} />

        {/* Arena floor shadow */}
        <ellipse cx="140" cy="285" rx="80" ry="12" fill="#000" opacity="0.5" />
        <ellipse cx="140" cy="282" rx="65" ry="7" fill={accent} opacity="0.1" />

        {/* === CONNECTED ARM ANATOMY === */}
        {/* Shoulder mass — large, grounded */}
        <path
          d="M95 195 C88 165 92 135 108 115 C122 98 145 90 162 100 C180 112 190 140 188 175 C186 200 178 220 162 232 L118 238 C102 232 96 215 95 195Z"
          fill={`url(#${uid}-skin)`}
        />
        {/* Shoulder cap / deltoid highlight */}
        <path
          d="M105 155 C108 135 120 118 140 112 C155 108 168 115 175 130 C178 140 176 155 170 165"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          opacity="0.08"
          strokeLinecap="round"
        />

        {/* Upper arm — thick, connected shoulder to elbow */}
        <path
          d="M155 175 C162 195 168 215 172 235 C174 248 172 258 165 262 L148 260 C142 252 140 238 142 220 C144 200 148 185 155 175Z"
          fill={`url(#${uid}-skin)`}
        />
        {/* Bicep highlight */}
        <path
          d="M158 185 C162 200 165 218 166 235"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          opacity="0.07"
          strokeLinecap="round"
        />

        {/* Elbow joint — visible, planted */}
        <ellipse cx="158" cy="258" rx="14" ry="11" fill={skin} />
        <ellipse cx="158" cy="258" rx="9" ry="7" fill={cloth} opacity="0.6" />

        {/* Forearm — rising from elbow toward fist */}
        <path
          d="M150 252 C142 235 136 215 134 195 C133 182 135 172 140 168 L155 170 C158 178 158 192 156 210 C154 230 152 245 150 252Z"
          fill={`url(#${uid}-skin)`}
        />

        {/* Wrist wraps / bracer — varies by preset */}
        {detail.wrapStyle === 'leather' && (
          <>
            <rect x="132" y="172" width="26" height="18" rx="5" fill={`url(#${uid}-cloth)`} />
            <path d="M135 178 H155" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <path d="M136 184 H153" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </>
        )}
        {detail.wrapStyle === 'work' && (
          <>
            <rect x="131" y="170" width="28" height="20" rx="4" fill={`url(#${uid}-cloth)`} />
            <path d="M134 176 H156" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <path d="M135 183 H154" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            <rect x="138" y="173" width="14" height="4" rx="2" fill={accent} opacity="0.3" />
          </>
        )}
        {detail.wrapStyle === 'athletic' && (
          <>
            <rect x="132" y="171" width="26" height="18" rx="6" fill={`url(#${uid}-cloth)`} />
            <path d="M136 175 L152 185" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M138 172 L154 182" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </>
        )}
        {detail.wrapStyle === 'metal' && (
          <>
            <rect x="131" y="170" width="28" height="20" rx="3" fill={`url(#${uid}-cloth)`} />
            <rect x="134" y="174" width="22" height="5" rx="2" fill={accent} opacity="0.8" />
            <rect x="136" y="182" width="18" height="3" rx="1.5" fill={accent} opacity="0.5" />
            <circle cx="145" cy="180" r="3" fill={accent} opacity="0.6" />
          </>
        )}
        {detail.wrapStyle === 'cloth' && (
          <>
            <rect x="132" y="171" width="26" height="18" rx="7" fill={`url(#${uid}-cloth)`} />
            <path d="M135 177 C140 175 150 175 155 178" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path d="M136 183 C142 181 148 181 153 184" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          </>
        )}
        {detail.wrapStyle === 'tournament' && (
          <>
            <rect x="131" y="170" width="28" height="20" rx="4" fill={`url(#${uid}-cloth)`} />
            <path d="M134 175 H156" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M134 181 H156" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M134 186 H156" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <circle cx="145" cy="175" r="2.5" fill={accent} opacity="0.8" />
          </>
        )}

        {/* Fist — clenched, connected to wrist */}
        <ellipse cx="145" cy="160" rx="16" ry="14" fill={glove} />
        <ellipse cx="145" cy="157" rx="11" ry="9" fill={skin} opacity="0.35" />
        {/* Knuckles */}
        <circle cx="138" cy="152" r="3.5" fill={skin} opacity="0.4" />
        <circle cx="145" cy="150" r="3.5" fill={skin} opacity="0.4" />
        <circle cx="152" cy="152" r="3.5" fill={skin} opacity="0.4" />
        {/* Thumb */}
        <ellipse cx="134" cy="162" rx="5" ry="7" fill={glove} />

        {/* Cloth / sleeve over shoulder */}
        <path
          d="M98 180 C105 155 125 140 150 138 C168 137 180 145 185 160 L182 195 C170 205 140 210 115 205 C102 200 97 192 98 180Z"
          fill={`url(#${uid}-cloth)`}
          opacity="0.85"
        />
        {/* Sleeve accent stripe */}
        <path
          d="M105 168 C120 155 145 150 170 158"
          fill="none"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Emblem badge */}
        <circle cx="140" cy="290" r="12" fill="#0d121c" stroke={accent} strokeWidth="1.5" opacity="0.9" />
        <text
          x="140"
          y="295"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={accent}
          fontFamily="system-ui, sans-serif"
        >
          {detail.emblem}
        </text>
      </svg>
    </div>
  );
}

/**
 * Practice Automaton — mechanical arm-wrestling training opponent.
 * Connected mechanical anatomy: shoulder mount → hydraulic upper arm →
 * reinforced elbow → piston forearm → mechanical grip.
 */
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
            <stop offset="0%" stopColor="#1c1a28" />
            <stop offset="60%" stopColor="#0d0c14" />
            <stop offset="100%" stopColor="#07060a" />
          </linearGradient>
          <radialGradient id="auto-glow" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#e07a4a" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#e07a4a" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#e07a4a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="auto-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="50%" stopColor="#2d3748" />
            <stop offset="100%" stopColor="#1a202c" />
          </linearGradient>
          <linearGradient id="auto-piston" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#718096" />
            <stop offset="100%" stopColor="#4a5568" />
          </linearGradient>
        </defs>

        <rect width="280" height="320" fill="url(#auto-bg)" />
        <ellipse cx="140" cy="110" rx="100" ry="85" fill="url(#auto-glow)" />

        {/* Floor shadow */}
        <ellipse cx="140" cy="285" rx="75" ry="12" fill="#000" opacity="0.5" />
        <ellipse cx="140" cy="282" rx="60" ry="7" fill="#e07a4a" opacity="0.08" />

        {/* === MECHANICAL ARM ANATOMY === */}
        {/* Shoulder mount — heavy industrial bracket */}
        <rect x="95" y="120" width="55" height="40" rx="8" fill="url(#auto-metal)" />
        <rect x="100" y="125" width="45" height="30" rx="5" fill="#2d3748" />
        {/* Bolts */}
        <circle cx="105" cy="130" r="3" fill="#718096" />
        <circle cx="140" cy="130" r="3" fill="#718096" />
        <circle cx="105" cy="150" r="3" fill="#718096" />
        <circle cx="140" cy="150" r="3" fill="#718096" />
        {/* Status light */}
        <circle cx="122" cy="140" r="5" fill="#e07a4a" opacity="0.8" />
        <circle cx="122" cy="140" r="3" fill="#f0a070" />

        {/* Hydraulic upper arm */}
        <rect x="130" y="155" width="22" height="55" rx="8" fill="url(#auto-metal)" />
        {/* Piston rods */}
        <rect x="134" y="160" width="5" height="45" rx="2.5" fill="url(#auto-piston)" />
        <rect x="143" y="160" width="5" height="45" rx="2.5" fill="url(#auto-piston)" />
        {/* Hydraulic fluid line */}
        <rect x="139" y="162" width="3" height="42" rx="1.5" fill="#e07a4a" opacity="0.4" />

        {/* Reinforced elbow joint */}
        <circle cx="141" cy="215" r="16" fill="url(#auto-metal)" />
        <circle cx="141" cy="215" r="10" fill="#2d3748" />
        <circle cx="141" cy="215" r="5" fill="#e07a4a" opacity="0.6" />
        {/* Joint ring */}
        <circle cx="141" cy="215" r="13" fill="none" stroke="#718096" strokeWidth="2" opacity="0.6" />

        {/* Piston forearm */}
        <rect x="132" y="175" width="18" height="42" rx="6" fill="url(#auto-metal)" transform="rotate(-8 141 196)" />
        {/* Forearm pistons */}
        <rect x="135" y="178" width="4" height="36" rx="2" fill="url(#auto-piston)" transform="rotate(-8 141 196)" />
        <rect x="143" y="178" width="4" height="36" rx="2" fill="url(#auto-piston)" transform="rotate(-8 141 196)" />

        {/* Mechanical wrist */}
        <rect x="130" y="168" width="22" height="12" rx="4" fill="#4a5568" />
        <rect x="133" y="171" width="16" height="6" rx="3" fill="#e07a4a" opacity="0.3" />

        {/* Mechanical grip hand */}
        <path
          d="M132 155 C130 148 132 140 138 136 C144 132 152 134 155 140 C158 146 157 155 153 160 L138 162 C134 160 132 158 132 155Z"
          fill="url(#auto-metal)"
        />
        {/* Finger segments */}
        <rect x="134" y="138" width="6" height="14" rx="3" fill="#4a5568" />
        <rect x="141" y="136" width="6" height="15" rx="3" fill="#4a5568" />
        <rect x="148" y="138" width="6" height="13" rx="3" fill="#4a5568" />
        {/* Grip pads */}
        <circle cx="137" cy="140" r="2.5" fill="#e07a4a" opacity="0.5" />
        <circle cx="144" cy="138" r="2.5" fill="#e07a4a" opacity="0.5" />
        <circle cx="151" cy="140" r="2.5" fill="#e07a4a" opacity="0.5" />

        {/* Training label */}
        <rect x="100" y="270" width="80" height="22" rx="6" fill="#1a202c" stroke="#e07a4a" strokeWidth="1" opacity="0.8" />
        <text
          x="140"
          y="285"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#e07a4a"
          fontFamily="system-ui, sans-serif"
          letterSpacing="1"
        >
          TRAINING
        </text>
      </svg>
    </div>
  );
}
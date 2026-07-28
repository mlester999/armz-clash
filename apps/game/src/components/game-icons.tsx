import type { SVGProps } from 'react';
import { cn } from '@armz-clash/ui';

export type GameIconName =
  | 'arena'
  | 'collection'
  | 'battle'
  | 'history'
  | 'lock'
  | 'sound'
  | 'music'
  | 'motion'
  | 'skip'
  | 'home'
  | 'replay'
  | 'settings';

const paths: Record<GameIconName, React.ReactNode> = {
  arena: <path d="M4 17V8l8-5 8 5v9M2.5 20h19M8 20v-6h8v6M7 9h10" />,
  collection: (
    <>
      <rect x="4" y="3" width="13" height="17" rx="2" />
      <path d="M8 7h5M8 11h5M8 15h5M17 7h3v12a2 2 0 0 1-2 2H8" />
    </>
  ),
  battle: <path d="M5 19 19 5M14 4l6 6M4 14l6 6M9 15l-4-4M15 9l-4-4" />,
  history: (
    <>
      <path d="M4.5 8A8 8 0 1 1 4 15M4 4v4h4" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  sound: <path d="M4 10h4l5-4v12l-5-4H4zM17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />,
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  motion: <path d="M3 8h11M6 12h13M3 16h11M17 5l4 7-4 7" />,
  skip: <path d="m5 6 9 6-9 6zM17 6v12" />,
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  replay: <path d="M4 8V3m0 0h5M4 3l4 4a8 8 0 1 1-2 10" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7z" />
    </>
  ),
};

export function GameIcon({
  name,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { name: GameIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('h-5 w-5 shrink-0', className)}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

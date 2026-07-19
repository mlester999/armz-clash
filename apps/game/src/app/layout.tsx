import type { Metadata } from 'next';
import { PRODUCT_NAME } from '@armz-clash/config';
import { GameHeader } from '../components/game-shell';
import { getGamePublicConfig } from '../lib/public';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} Game`,
    template: `%s | ${PRODUCT_NAME} Game`,
  },
  description: 'Armz Clash game client foundation. Gameplay arrives in later phases.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getGamePublicConfig();
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="flex min-h-dvh flex-col">
          <GameHeader config={config} />
          {children}
        </div>
      </body>
    </html>
  );
}

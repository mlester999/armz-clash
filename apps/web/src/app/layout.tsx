import type { Metadata } from 'next';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@armz-clash/config';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { getWebPublicConfig } from '../lib/public';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} | Premium Solana Arm-Wrestling`,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: `${PRODUCT_TAGLINE}. Collect legendary ARMZ, clash in the arena, and earn probabilistic gameplay rewards from a limited treasury. Testnet-first.`,
  applicationName: PRODUCT_NAME,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getWebPublicConfig();

  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="flex min-h-dvh flex-col">
          <SiteHeader config={config} />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

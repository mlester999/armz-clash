import type { Metadata } from 'next';
import { PRODUCT_NAME } from '@armz-clash/config';
import { AdminHeader } from '../components/admin-shell';
import { getAdminPublicConfig } from '../lib/public';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} Admin`,
    template: `%s | ${PRODUCT_NAME} Admin`,
  },
  description: 'Armz Clash admin portal foundation. Sensitive modules unavailable in Phase 1.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getAdminPublicConfig();
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="flex min-h-dvh flex-col">
          <AdminHeader config={config} />
          {children}
        </div>
      </body>
    </html>
  );
}

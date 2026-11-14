import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { pickLocale } from '@/lib/i18n';
import './globals.css';

export const metadata = {
  title: 'Bandeja · heysteff',
  description: 'WhatsApp, Instagram, Messenger, SMS y correo en una sola bandeja.',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = pickLocale((await headers()).get('accept-language'), process.env.INBOX_LOCALE);
  return (
    <html lang={locale}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

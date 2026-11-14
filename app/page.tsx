import { headers } from 'next/headers';
import { Inbox } from '@/components/inbox';
import { dictionary, pickLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const locale = pickLocale((await headers()).get('accept-language'), process.env.INBOX_LOCALE);
  return <Inbox locale={locale} t={dictionary(locale)} />;
}

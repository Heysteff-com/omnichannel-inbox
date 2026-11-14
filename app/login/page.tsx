import { headers } from 'next/headers';
import { dictionary, pickLocale } from '@/lib/i18n';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const locale = pickLocale((await headers()).get('accept-language'), process.env.INBOX_LOCALE);
  const t = dictionary(locale);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">{t.loginTitle}</h1>
        <LoginForm t={{ password: t.loginPassword, submit: t.loginSubmit, wrong: t.loginWrong, missingEnv: t.loginMissingEnv }} />
      </div>
    </main>
  );
}

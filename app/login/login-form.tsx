'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

export function LoginForm({ t }: { t: { password: string; submit: string; wrong: string; missingEnv: string } }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">{t.password}</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {state.error === 'wrong' ? t.wrong : t.missingEnv}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-white disabled:opacity-60"
      >
        {t.submit}
      </button>
    </form>
  );
}

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, passwordMatches, sessionSecrets } from '@/lib/session';

export type LoginState = { error: 'wrong' | 'missing_env' | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const secrets = sessionSecrets();
  if (!secrets) return { error: 'missing_env' };
  const input = String(form.get('password') ?? '');
  if (!(await passwordMatches(input, secrets.password))) return { error: 'wrong' };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(secrets), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect('/');
}

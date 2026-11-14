import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionSecrets, verifySessionToken } from './lib/session';

/** Todo pide sesión salvo /login. Las rutas de /api responden 401; las páginas llevan a /login. */
export async function middleware(req: NextRequest) {
  const secrets = sessionSecrets();
  const ok = secrets ? await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, secrets) : false;
  if (ok) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: { code: 'unauthorized', message: 'Inicia sesión en la bandeja.' } }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|icon.svg).*)'],
};

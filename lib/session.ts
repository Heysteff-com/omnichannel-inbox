/**
 * Sesión de la bandeja: una cookie `vencimiento.firma`, firmada con HMAC-SHA256.
 * La clave sale de INBOX_PASSWORD y de la key de heysteff, así que cambiar
 * cualquiera de las dos cierra todas las sesiones abiertas. Solo usa Web Crypto:
 * corre igual en el middleware (edge) y en las rutas (Node).
 */
export const SESSION_COOKIE = 'inbox_session';
/** 7 días. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const encoder = new TextEncoder();

async function hmacKey(password: string, apiKey: string) {
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(`heysteff-inbox:${apiKey}:${password}`));
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compara sin cortar en el primer carácter distinto. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export interface SessionSecrets {
  password: string;
  apiKey: string;
}

export function sessionSecrets(env: Record<string, string | undefined> = process.env): SessionSecrets | null {
  const password = env.INBOX_PASSWORD;
  const apiKey = env.HEYSTEFF_API_KEY;
  return password && apiKey ? { password, apiKey } : null;
}

export async function createSessionToken(secrets: SessionSecrets, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const key = await hmacKey(secrets.password, secrets.apiKey);
  const sig = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(String(expires))));
  return `${expires}.${sig}`;
}

export async function verifySessionToken(token: string | undefined, secrets: SessionSecrets, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [expiresRaw, sig] = token.split('.');
  if (!expiresRaw || !sig || !/^\d+$/.test(expiresRaw)) return false;
  if (Number(expiresRaw) * 1000 < now) return false;
  const key = await hmacKey(secrets.password, secrets.apiKey);
  const expected = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(expiresRaw)));
  return safeEqual(sig, expected);
}

/** La contraseña que escribió la persona contra INBOX_PASSWORD, en tiempo constante. */
export async function passwordMatches(input: string, password: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(input)),
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
  ]);
  return safeEqual(toHex(a), toHex(b));
}

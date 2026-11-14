import 'server-only';
import { Heysteff, HeysteffError } from '@heysteff/sdk';

let client: Heysteff | undefined;

/**
 * El cliente del SDK vive solo en el servidor: la key nunca llega al
 * navegador. El navegador habla con las rutas de /api de esta app.
 */
export function heysteff(): Heysteff {
  client ??= new Heysteff({
    apiKey: process.env.HEYSTEFF_API_KEY,
    ...(process.env.HEYSTEFF_BASE_URL ? { baseUrl: process.env.HEYSTEFF_BASE_URL } : {}),
  });
  return client;
}

/** Un error de heysteff (o cualquiera) como respuesta `{ error: { code, message } }` para el navegador. */
export function errorResponse(err: unknown): Response {
  if (err instanceof HeysteffError) {
    // 0 = no hubo respuesta de heysteff (red o tiempo agotado).
    const status = err.status >= 400 && err.status < 600 ? err.status : 424;
    return Response.json({ error: { code: err.code, message: err.message, ...(err.fix ? { fix: err.fix } : {}) } }, { status });
  }
  console.error(err);
  return Response.json({ error: { code: 'internal_error', message: 'Algo falló en la bandeja. Revisa los logs del servidor.' } }, { status: 500 });
}

/**
 * Modo "por cliente": con HEYSTEFF_CUSTOMER_ID, la bandeja muestra solo las
 * conversaciones de los canales que conectó ese cliente (`/v1/customers`). Así
 * le das a cada cliente de tu SaaS su propia bandeja con la misma key.
 */
export function customerId(): string | null {
  return process.env.HEYSTEFF_CUSTOMER_ID?.trim() || null;
}

let channelCache: { customer: string; ids: Set<string>; at: number } | undefined;
const CHANNEL_CACHE_MS = 60_000;

/** Los canales del cliente, con un minuto de caché. */
async function customerChannelIds(customer: string): Promise<Set<string>> {
  if (channelCache && channelCache.customer === customer && Date.now() - channelCache.at < CHANNEL_CACHE_MS) {
    return channelCache.ids;
  }
  const channels = await heysteff().customers.listChannels(customer);
  const ids = new Set(channels.map((c) => c.id));
  channelCache = { customer, ids, at: Date.now() };
  return ids;
}

/** Si la bandeja es de un cliente, si este canal es suyo. Sin cliente, todo entra. */
export async function channelInScope(channelConnectionId: string | null): Promise<boolean> {
  const customer = customerId();
  if (!customer) return true;
  if (!channelConnectionId) return false;
  return (await customerChannelIds(customer)).has(channelConnectionId);
}

/** 404 igual que si no existiera: una bandeja de cliente no confirma conversaciones ajenas. */
export function outOfScope(): Response {
  return Response.json({ error: { code: 'not_found', message: 'Conversación no encontrada.' } }, { status: 404 });
}

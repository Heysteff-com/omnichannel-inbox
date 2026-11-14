import { heysteff } from '@/lib/heysteff';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Vercel corta las funciones al llegar a este tope; el navegador se reconecta solo.
export const maxDuration = 300;

/**
 * Tiempo real. Reenvía al navegador el stream de eventos de heysteff
 * (`GET /v1/events/stream`, Server-Sent Events) sin exponer la key. Si tu
 * cuenta todavía no tiene ese endpoint (o falla), responde 204: el navegador
 * deja de reconectar y la bandeja pasa a consultar cada pocos segundos.
 */
export async function GET(req: Request): Promise<Response> {
  const api = heysteff();
  const lastEventId = req.headers.get('last-event-id');
  let upstream: Response;
  try {
    upstream = await fetch(`${api.baseUrl}/v1/events/stream`, {
      headers: {
        Authorization: `Bearer ${process.env.HEYSTEFF_API_KEY}`,
        Accept: 'text/event-stream',
        ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
      },
      signal: req.signal,
      cache: 'no-store',
    });
  } catch {
    return new Response(null, { status: 204 });
  }
  const type = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !upstream.body || !type.includes('text/event-stream')) {
    await upstream.body?.cancel().catch(() => undefined);
    return new Response(null, { status: 204 });
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

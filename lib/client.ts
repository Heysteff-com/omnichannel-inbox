/** Error de las rutas de la bandeja, con el `code` y el `message` de heysteff. */
export class RequestError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

/** `fetch` que lanza ante un 4xx/5xx en vez de devolver el error como si fueran datos. */
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new RequestError(401, 'unauthorized', 'Sesión vencida.');
  }
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  if (!res.ok) {
    throw new RequestError(res.status, body?.error?.code ?? `http_${res.status}`, body?.error?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

/**
 * Escucha /api/events (Server-Sent Events). Cada evento, sea cual sea su
 * nombre, dispara `onEvent`. Si el stream no existe (204) o falla tres veces
 * seguidas, llama a `onFallback` y deja de intentar: la bandeja pasa a sondeo.
 */
export function listenToEvents(onEvent: () => void, onFallback: () => void): () => void {
  let stopped = false;
  let failures = 0;
  let controller: AbortController | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const connect = async () => {
    controller = new AbortController();
    try {
      const res = await fetch('/api/events', { signal: controller.signal, cache: 'no-store', headers: { Accept: 'text/event-stream' } });
      const type = res.headers.get('content-type') ?? '';
      if (res.status === 204 || !res.ok || !res.body || !type.includes('text/event-stream')) {
        stopped = true;
        onFallback();
        return;
      }
      failures = 0;
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let sep: number;
        while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, '');
          // Los comentarios (": ping") mantienen viva la conexión; no son eventos.
          if (/^data:/m.test(block)) onEvent();
        }
      }
    } catch {
      if (stopped) return;
      failures += 1;
    }
    if (stopped) return;
    if (failures >= 3) {
      stopped = true;
      onFallback();
      return;
    }
    // El servidor cerró (p. ej. el tope de duración en Vercel): reconecta.
    retryTimer = setTimeout(connect, 1_000 * (failures + 1));
  };

  void connect();
  return () => {
    stopped = true;
    controller?.abort();
    if (retryTimer) clearTimeout(retryTimer);
  };
}

export function newClientId(): string {
  return crypto.randomUUID();
}

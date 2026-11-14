/**
 * Qué se puede mandar por cada canal y cuándo. Es lo que decide qué muestra el
 * compositor; la API igual valida todo y responde 409 si algo no corresponde.
 */
export type ChannelId = 'whatsapp_cloud' | 'whatsapp_baileys' | 'instagram' | 'facebook' | 'sms' | 'gmail' | 'shopify';

export interface ChannelCapabilities {
  /** Imágenes, audio, video y documentos. */
  files: boolean;
  /** Botones de respuesta rápida. */
  buttons: boolean;
  /** Plantillas aprobadas de WhatsApp. */
  templates: boolean;
  /**
   * Plazo desde el último mensaje del cliente para escribirle libremente.
   * `null` = sin plazo.
   */
  windowHours: number | null;
  /** Qué pasa cuando el plazo venció: solo plantillas, o no se puede escribir. */
  whenClosed: 'template_only' | 'blocked' | null;
  /** Si se puede escribir por este canal. */
  canSend: boolean;
}

const CAPABILITIES: Record<ChannelId, ChannelCapabilities> = {
  // WhatsApp Cloud: 24 h de conversación libre; después, solo plantillas aprobadas.
  whatsapp_cloud: { files: true, buttons: true, templates: true, windowHours: 24, whenClosed: 'template_only', canSend: true },
  // WhatsApp por QR: es la app del celular, sin ventana ni plantillas.
  whatsapp_baileys: { files: true, buttons: true, templates: false, windowHours: null, whenClosed: null, canSend: true },
  // Instagram y Messenger: 24 h; por la API, después hay que esperar a que el cliente escriba.
  instagram: { files: true, buttons: true, templates: false, windowHours: 24, whenClosed: 'blocked', canSend: true },
  facebook: { files: true, buttons: true, templates: false, windowHours: 24, whenClosed: 'blocked', canSend: true },
  // SMS: solo texto.
  sms: { files: false, buttons: false, templates: false, windowHours: null, whenClosed: null, canSend: true },
  // Correo: se responde en el mismo hilo; los botones no existen en un correo.
  gmail: { files: true, buttons: false, templates: false, windowHours: null, whenClosed: null, canSend: true },
  // Shopify no es un canal de mensajería.
  shopify: { files: false, buttons: false, templates: false, windowHours: null, whenClosed: null, canSend: false },
};

const UNKNOWN: ChannelCapabilities = { files: false, buttons: false, templates: false, windowHours: null, whenClosed: null, canSend: true };

export function channelCapabilities(channel: string): ChannelCapabilities {
  return CAPABILITIES[channel as ChannelId] ?? UNKNOWN;
}

export type ComposerMode =
  /** Texto, archivos y botones según el canal. */
  | { mode: 'free'; closesAt: string | null }
  /** Pasó el plazo: solo una plantilla aprobada (WhatsApp Cloud). */
  | { mode: 'template_only' }
  /** Pasó el plazo y por este canal no hay plantillas: hay que esperar al cliente. */
  | { mode: 'blocked'; reason: 'window_closed' | 'not_messaging' };

/**
 * El estado del compositor según el canal y el último mensaje del cliente.
 * Sin mensaje del cliente, la ventana está cerrada: nunca escribió.
 */
export function composerMode(channel: string, lastInboundAt: string | null, now: Date = new Date()): ComposerMode {
  const caps = channelCapabilities(channel);
  if (!caps.canSend) return { mode: 'blocked', reason: 'not_messaging' };
  if (caps.windowHours === null) return { mode: 'free', closesAt: null };
  const last = lastInboundAt ? Date.parse(lastInboundAt) : NaN;
  const closesAt = Number.isFinite(last) ? last + caps.windowHours * 3_600_000 : NaN;
  if (Number.isFinite(closesAt) && closesAt > now.getTime()) {
    return { mode: 'free', closesAt: new Date(closesAt).toISOString() };
  }
  return caps.whenClosed === 'template_only' ? { mode: 'template_only' } : { mode: 'blocked', reason: 'window_closed' };
}

/** Hasta 3 botones de hasta 20 caracteres, como los acepta WhatsApp. */
export const MAX_BUTTONS = 3;
export const MAX_BUTTON_TITLE = 20;

/** Arma los botones de respuesta a partir de lo que escribió la persona. */
export function toButtons(titles: string[]): { id: string; title: string }[] {
  return titles
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_BUTTONS)
    .map((title, i) => ({ id: `btn_${i + 1}`, title: title.slice(0, MAX_BUTTON_TITLE) }));
}

/** Tipo de contenido de la API según el MIME del archivo. */
export function contentTypeForMime(mime: string): 'image' | 'audio' | 'video' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'file';
}

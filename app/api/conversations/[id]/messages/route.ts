import type { SendMessageParams } from '@heysteff/sdk';
import { channelCapabilities, composerMode, contentTypeForMime, toButtons } from '@/lib/channels';
import { channelInScope, errorResponse, heysteff, outOfScope } from '@/lib/heysteff';

/** 15 MB: lo que heysteff acepta por archivo. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function invalid(code: string, message: string, status = 400): Response {
  return Response.json({ error: { code, message } }, { status });
}

/**
 * Responde en la conversación por su mismo canal y número. Recibe un
 * FormData: `kind` (text | buttons | template), `text`, `buttons` (JSON),
 * `template_name`, `template_language`, `template_params` (JSON), `file` y
 * `client_id` (la clave de idempotencia: un doble clic no manda dos veces).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const form = await req.formData().catch(() => null);
  if (!form) return invalid('validation_error', 'El cuerpo tiene que ser un formulario.');

  const kind = String(form.get('kind') ?? 'text');
  const text = String(form.get('text') ?? '').trim();
  const clientId = String(form.get('client_id') ?? '') || undefined;
  const file = form.get('file');

  try {
    const api = heysteff();
    const conversation = await api.conversations.get(id);
    if (!(await channelInScope(conversation.channel_connection_id))) return outOfScope();
    const caps = channelCapabilities(conversation.channel);
    const mode = composerMode(conversation.channel, conversation.last_inbound_at);

    if (mode.mode === 'blocked') {
      return invalid(mode.reason === 'window_closed' ? 'window_closed' : 'channel_not_messaging', 'Por este canal no se le puede escribir ahora.', 409);
    }
    if (mode.mode === 'template_only' && kind !== 'template') {
      return invalid('wa_window_closed', 'Pasaron más de 24 h: WhatsApp solo acepta una plantilla aprobada.', 409);
    }

    const base: Pick<SendMessageParams, 'channel' | 'to' | 'channel_connection_id'> = {
      channel: conversation.channel as SendMessageParams['channel'],
      to: conversation.external_user_id,
      ...(conversation.channel_connection_id ? { channel_connection_id: conversation.channel_connection_id } : {}),
    };
    let message: SendMessageParams;

    if (kind === 'template') {
      if (!caps.templates) return invalid('templates_unsupported', 'Este canal no tiene plantillas.');
      const name = String(form.get('template_name') ?? '');
      const language = String(form.get('template_language') ?? '');
      if (!name || !language) return invalid('validation_error', 'Falta la plantilla.');
      const bodyParams = parseStringArray(form.get('template_params'));
      message = { ...base, content_type: 'template', template: { name, language, ...(bodyParams.length ? { body_params: bodyParams } : {}) } };
    } else if (file instanceof File && file.size > 0) {
      if (!caps.files) return invalid('files_unsupported', 'Este canal no acepta archivos.');
      if (file.size > MAX_FILE_BYTES) return invalid('file_too_large', 'El archivo pesa más de 15 MB.', 413);
      const uploaded = await api.media.upload({ file, filename: file.name || 'archivo' });
      message = {
        ...base,
        content_type: contentTypeForMime(uploaded.mime_type || file.type),
        media: { url: uploaded.url, filename: uploaded.filename },
        ...(text ? { content: text } : {}),
      };
    } else if (kind === 'buttons') {
      if (!caps.buttons) return invalid('buttons_unsupported', 'Este canal no tiene botones.');
      const buttons = toButtons(parseStringArray(form.get('buttons')));
      if (!text || buttons.length === 0) return invalid('validation_error', 'Escribe el mensaje y al menos un botón.');
      message = { ...base, content_type: 'interactive', interactive: { type: 'buttons', body: text, buttons } };
    } else {
      if (!text) return invalid('validation_error', 'El mensaje está vacío.');
      message = { ...base, content_type: 'text', content: text };
    }

    const sent = await api.messages.send(message, clientId ? { idempotencyKey: `inbox-${clientId}` } : undefined);
    return Response.json({ data: sent });
  } catch (err) {
    return errorResponse(err);
  }
}

function parseStringArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

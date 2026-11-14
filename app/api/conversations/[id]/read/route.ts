import { channelInScope, errorResponse, heysteff, outOfScope } from '@/lib/heysteff';

/** Marca como leído el último mensaje del cliente (tildes azules en WhatsApp, "visto" en Instagram y Messenger). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  try {
    const api = heysteff();
    if (!(await channelInScope((await api.conversations.get(id)).channel_connection_id))) return outOfScope();
    const page = await api.conversations.listMessages(id, { limit: 50 });
    const last = [...page.data].reverse().find((m) => m.role === 'user');
    if (!last) return Response.json({ message_id: null, supported: false, receipt_sent: false });
    return Response.json(await api.messages.markRead(last.id));
  } catch (err) {
    return errorResponse(err);
  }
}

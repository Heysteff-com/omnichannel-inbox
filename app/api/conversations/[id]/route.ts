import { channelInScope, errorResponse, heysteff, outOfScope } from '@/lib/heysteff';

export const dynamic = 'force-dynamic';

/** La conversación (canal, ventana, estado del bot) y una página de mensajes. `?cursor=` trae los anteriores. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const cursor = new URL(req.url).searchParams.get('cursor');
  try {
    const api = heysteff();
    const conversation = await api.conversations.get(id);
    if (!(await channelInScope(conversation.channel_connection_id))) return outOfScope();
    const messages = await api.conversations.listMessages(id, { limit: 50, ...(cursor ? { cursor } : {}) });
    return Response.json({ conversation, messages });
  } catch (err) {
    return errorResponse(err);
  }
}

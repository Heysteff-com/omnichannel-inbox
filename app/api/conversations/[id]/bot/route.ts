import { channelInScope, errorResponse, heysteff, outOfScope } from '@/lib/heysteff';

/** `{ paused: true }` = tomas la conversación (el bot deja de contestar); `false` = se la devuelves al bot. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { paused?: unknown } | null;
  if (typeof body?.paused !== 'boolean') {
    return Response.json({ error: { code: 'validation_error', message: '"paused" tiene que ser true o false.' } }, { status: 400 });
  }
  try {
    const api = heysteff();
    if (!(await channelInScope((await api.conversations.get(id)).channel_connection_id))) return outOfScope();
    const result = body.paused ? await api.conversations.pauseBot(id) : await api.conversations.resumeBot(id);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

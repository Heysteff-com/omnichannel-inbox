import { channelInScope, customerId, errorResponse, heysteff, outOfScope } from '@/lib/heysteff';

export const dynamic = 'force-dynamic';

/** Plantillas aprobadas de WhatsApp de un número (`?channel_connection_id=`). */
export async function GET(req: Request): Promise<Response> {
  const connection = new URL(req.url).searchParams.get('channel_connection_id');
  try {
    // En una bandeja de cliente, solo las plantillas de sus números.
    if (customerId() && !(await channelInScope(connection))) return outOfScope();
    const data = await heysteff().templates.list({
      status: 'APPROVED',
      ...(connection ? { channel_connection_id: connection } : {}),
    });
    return Response.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

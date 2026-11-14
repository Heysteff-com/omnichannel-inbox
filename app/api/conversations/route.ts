import type { Conversation, Page } from '@heysteff/sdk';
import { customerId, errorResponse, heysteff } from '@/lib/heysteff';

export const dynamic = 'force-dynamic';

const STATUSES = new Set(['open', 'closed', 'snoozed']);

/** Conversaciones de todos los canales, de la más reciente a la más vieja. */
export async function GET(req: Request): Promise<Response> {
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status');
  const channel = sp.get('channel');
  const cursor = sp.get('cursor');
  try {
    const customer = customerId();
    // `call` acepta cualquier filtro de la API; `customer_id` deja solo las
    // conversaciones de los canales que conectó ese cliente.
    const page = await heysteff().call<Page<Conversation>>('listConversations', {
      query: {
        limit: 50,
        ...(status && STATUSES.has(status) ? { status } : {}),
        ...(channel ? { channel } : {}),
        ...(cursor ? { cursor } : {}),
        ...(customer ? { customer_id: customer } : {}),
      },
    });
    return Response.json(page);
  } catch (err) {
    return errorResponse(err);
  }
}

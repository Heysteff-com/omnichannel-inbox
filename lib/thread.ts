import type { ConversationMessage } from '@heysteff/sdk';

/**
 * Junta lo ya cargado con una página nueva sin perder nada: cada refresco trae
 * solo los 50 más recientes, y los que salen de esa ventana siguen en pantalla.
 * Una versión nueva del mismo mensaje (otro estado) reemplaza a la anterior.
 */
export function mergeMessages(current: ConversationMessage[], incoming: ConversationMessage[]): ConversationMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

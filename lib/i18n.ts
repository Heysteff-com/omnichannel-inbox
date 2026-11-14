export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

const es = {
  title: 'Bandeja',
  loginTitle: 'Entra a tu bandeja',
  loginPassword: 'Contraseña',
  loginSubmit: 'Entrar',
  loginWrong: 'La contraseña no es correcta.',
  loginMissingEnv: 'Falta configurar HEYSTEFF_API_KEY o INBOX_PASSWORD en el servidor.',
  logout: 'Salir',
  filterOpen: 'Abiertas',
  filterClosed: 'Cerradas',
  allChannels: 'Todos los canales',
  noConversations: 'No hay conversaciones.',
  loadMore: 'Cargar más',
  loadOlder: 'Ver mensajes anteriores',
  selectConversation: 'Elige una conversación para ver los mensajes.',
  back: 'Volver',
  markRead: 'Marcar como leído',
  markedRead: 'Marcado como leído',
  noReadReceipt: 'Este canal no tiene confirmación de lectura.',
  take: 'Tomar conversación',
  release: 'Devolver al bot',
  botActive: 'El bot está atendiendo esta conversación.',
  botPaused: 'Tú tienes esta conversación: el bot no contesta.',
  escalated: 'Pidió hablar con una persona',
  placeholder: 'Escribe un mensaje…',
  send: 'Enviar',
  sending: 'Enviando…',
  attach: 'Adjuntar archivo',
  removeFile: 'Quitar archivo',
  addButtons: 'Botones',
  buttonsHint: 'Hasta 3 botones de respuesta, de hasta 20 caracteres.',
  buttonLabel: 'Botón',
  windowClosesAt: 'Puedes escribir libremente hasta',
  templateOnly: 'Pasaron más de 24 horas desde el último mensaje del cliente: WhatsApp solo acepta una plantilla aprobada.',
  blockedWindow: 'Pasaron más de 24 horas desde el último mensaje del cliente: por este canal no se le puede escribir hasta que vuelva a escribir.',
  blockedNotMessaging: 'Este canal no recibe mensajes.',
  chooseTemplate: 'Elige una plantilla',
  noTemplates: 'No hay plantillas aprobadas para este número.',
  templateParam: 'Variable',
  sendTemplate: 'Enviar plantilla',
  you: 'Tú',
  realtime: 'En vivo',
  polling: 'Actualizando cada pocos segundos',
  errorGeneric: 'No se pudo completar. Intenta de nuevo.',
  attachment: 'Adjunto',
} as const;

export type Dictionary = { [K in keyof typeof es]: string };

const en: Dictionary = {
  title: 'Inbox',
  loginTitle: 'Sign in to your inbox',
  loginPassword: 'Password',
  loginSubmit: 'Sign in',
  loginWrong: 'Wrong password.',
  loginMissingEnv: 'HEYSTEFF_API_KEY or INBOX_PASSWORD is not set on the server.',
  logout: 'Sign out',
  filterOpen: 'Open',
  filterClosed: 'Closed',
  allChannels: 'All channels',
  noConversations: 'No conversations.',
  loadMore: 'Load more',
  loadOlder: 'Show earlier messages',
  selectConversation: 'Pick a conversation to see its messages.',
  back: 'Back',
  markRead: 'Mark as read',
  markedRead: 'Marked as read',
  noReadReceipt: 'This channel has no read receipts.',
  take: 'Take over',
  release: 'Hand back to the bot',
  botActive: 'The bot is handling this conversation.',
  botPaused: 'You have this conversation: the bot won’t reply.',
  escalated: 'Asked to talk to a person',
  placeholder: 'Write a message…',
  send: 'Send',
  sending: 'Sending…',
  attach: 'Attach file',
  removeFile: 'Remove file',
  addButtons: 'Buttons',
  buttonsHint: 'Up to 3 reply buttons, up to 20 characters each.',
  buttonLabel: 'Button',
  windowClosesAt: 'You can write freely until',
  templateOnly: 'More than 24 hours since the customer’s last message: WhatsApp only accepts an approved template.',
  blockedWindow: 'More than 24 hours since the customer’s last message: on this channel you can’t write until they write again.',
  blockedNotMessaging: 'This channel doesn’t take messages.',
  chooseTemplate: 'Pick a template',
  noTemplates: 'No approved templates for this number.',
  templateParam: 'Variable',
  sendTemplate: 'Send template',
  you: 'You',
  realtime: 'Live',
  polling: 'Refreshing every few seconds',
  errorGeneric: 'Something went wrong. Try again.',
  attachment: 'Attachment',
};

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** INBOX_LOCALE manda; si no, el primer idioma del navegador que conocemos; si no, español. */
export function pickLocale(acceptLanguage: string | null | undefined, forced?: string): Locale {
  if (forced && (LOCALES as readonly string[]).includes(forced)) return forced as Locale;
  for (const part of (acceptLanguage ?? '').split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase().slice(0, 2);
    if (tag && (LOCALES as readonly string[]).includes(tag)) return tag as Locale;
  }
  return 'es';
}

import type { Locale } from '@/lib/i18n';

const LABELS: Record<string, { es: string; en: string }> = {
  whatsapp_cloud: { es: 'WhatsApp', en: 'WhatsApp' },
  whatsapp_baileys: { es: 'WhatsApp (QR)', en: 'WhatsApp (QR)' },
  instagram: { es: 'Instagram', en: 'Instagram' },
  facebook: { es: 'Messenger', en: 'Messenger' },
  sms: { es: 'SMS', en: 'SMS' },
  gmail: { es: 'Correo', en: 'Email' },
  shopify: { es: 'Shopify', en: 'Shopify' },
};

export const CHANNEL_FILTERS = ['whatsapp_cloud', 'whatsapp_baileys', 'instagram', 'facebook', 'sms', 'gmail'] as const;

export function channelLabel(channel: string, locale: Locale): string {
  return LABELS[channel]?.[locale] ?? channel;
}

const COLORS: Record<string, string> = {
  whatsapp_cloud: '#25d366',
  whatsapp_baileys: '#25d366',
  instagram: '#e1306c',
  facebook: '#0084ff',
  sms: '#64748b',
  gmail: '#ea4335',
  shopify: '#5e8e3e',
};

/** Ícono propio y simple de cada canal (sin logos de marca). */
export function ChannelIcon({ channel, locale, size = 18 }: { channel: string; locale: Locale; size?: number }) {
  const color = COLORS[channel] ?? '#94a3b8';
  return (
    <span
      title={channelLabel(channel, locale)}
      aria-label={channelLabel(channel, locale)}
      role="img"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size + 6, height: size + 6, background: color }}
    >
      <svg width={size - 4} height={size - 4} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {glyph(channel)}
      </svg>
    </span>
  );
}

function glyph(channel: string) {
  switch (channel) {
    case 'whatsapp_cloud':
    case 'whatsapp_baileys':
      // Globo con teléfono.
      return (
        <>
          <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
          <path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.1 1.6.8" />
        </>
      );
    case 'instagram':
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="3.5" />
        </>
      );
    case 'facebook':
      // Globo con rayo.
      return (
        <>
          <path d="M12 3a9 8.5 0 0 0-5 15.6V21l2.6-1.4A9 8.5 0 1 0 12 3z" />
          <path d="M7.5 13.5l3-3 2 2 3-3" />
        </>
      );
    case 'gmail':
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6l8.5 7 8.5-7" />
        </>
      );
    case 'sms':
      return (
        <>
          <path d="M4 5h16v11H9l-5 4z" />
          <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
        </>
      );
    case 'shopify':
      return (
        <>
          <path d="M5 8h14l-1 12H6z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="4" />;
  }
}

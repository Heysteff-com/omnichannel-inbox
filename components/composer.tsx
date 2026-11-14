'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConversationDetail, Template } from '@heysteff/sdk';
import { MAX_BUTTONS, MAX_BUTTON_TITLE, channelCapabilities, composerMode } from '@/lib/channels';
import { newClientId, request } from '@/lib/client';
import type { Dictionary, Locale } from '@/lib/i18n';

interface Props {
  conversation: ConversationDetail;
  locale: Locale;
  t: Dictionary;
  onSent: () => void;
  onError: (message: string) => void;
}

/**
 * Responde por el canal de la conversación. Muestra solo lo que ese canal
 * admite y, en WhatsApp con la ventana de 24 h cerrada, solo las plantillas.
 */
export function Composer({ conversation, locale, t, onSent, onError }: Props) {
  const caps = channelCapabilities(conversation.channel);
  // Se recalcula cada minuto: la ventana puede cerrarse con la conversación abierta.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const mode = useMemo(() => composerMode(conversation.channel, conversation.last_inbound_at, now), [conversation, now]);

  if (mode.mode === 'blocked') {
    return (
      <div className="border-t border-[var(--border)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning-text)]">
        {mode.reason === 'window_closed' ? t.blockedWindow : t.blockedNotMessaging}
      </div>
    );
  }
  if (mode.mode === 'template_only') {
    return <TemplatePicker conversation={conversation} t={t} onSent={onSent} onError={onError} />;
  }
  return (
    <FreeComposer
      conversation={conversation}
      closesAt={mode.closesAt}
      files={caps.files}
      buttons={caps.buttons}
      locale={locale}
      t={t}
      onSent={onSent}
      onError={onError}
    />
  );
}

function FreeComposer({
  conversation,
  closesAt,
  files,
  buttons,
  locale,
  t,
  onSent,
  onError,
}: Omit<Props, 'conversation'> & { conversation: ConversationDetail; closesAt: string | null; files: boolean; buttons: boolean }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [buttonTitles, setButtonTitles] = useState<string[]>(['', '', '']);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Una clave por mensaje: si el envío se corta y se reintenta, no sale dos veces.
  const clientId = useRef(newClientId());

  const usingButtons = showButtons && buttonTitles.some((b) => b.trim());
  const canSend = !sending && (file !== null || text.trim().length > 0);

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    const form = new FormData();
    form.set('client_id', clientId.current);
    form.set('text', text);
    if (file) {
      form.set('kind', 'file');
      form.set('file', file);
    } else if (usingButtons) {
      form.set('kind', 'buttons');
      form.set('buttons', JSON.stringify(buttonTitles));
    } else {
      form.set('kind', 'text');
    }
    try {
      await request(`/api/conversations/${conversation.id}/messages`, { method: 'POST', body: form });
      setText('');
      setFile(null);
      setButtonTitles(['', '', '']);
      setShowButtons(false);
      clientId.current = newClientId();
      onSent();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)] p-2">
      {closesAt && (
        <p className="px-1 pb-1 text-xs text-[var(--muted)]">
          {t.windowClosesAt} {new Date(closesAt).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-2 py-1 text-xs">
          <span className="min-w-0 flex-1 truncate">📎 {file.name}</span>
          <button onClick={() => setFile(null)} className="text-[var(--muted)]">{t.removeFile}</button>
        </div>
      )}
      {showButtons && !file && (
        <div className="mb-2 space-y-1">
          <p className="text-xs text-[var(--muted)]">{t.buttonsHint}</p>
          <div className="flex flex-wrap gap-2">
            {buttonTitles.slice(0, MAX_BUTTONS).map((title, i) => (
              <input
                key={i}
                value={title}
                maxLength={MAX_BUTTON_TITLE}
                onChange={(e) => setButtonTitles((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                placeholder={`${t.buttonLabel} ${i + 1}`}
                className="w-36 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm"
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        {files && (
          <>
            <input ref={fileInput} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileInput.current?.click()} title={t.attach} aria-label={t.attach} className="rounded-lg px-2 py-2 text-[var(--muted)] hover:bg-[var(--surface-2)]">
              📎
            </button>
          </>
        )}
        {buttons && (
          <button
            onClick={() => setShowButtons((v) => !v)}
            className={`rounded-lg px-2 py-2 text-xs ${showButtons ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}
          >
            {t.addButtons}
          </button>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder={t.placeholder}
          className="max-h-40 min-h-[40px] flex-1 resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button onClick={submit} disabled={!canSend} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          {sending ? t.sending : t.send}
        </button>
      </div>
    </div>
  );
}

function TemplatePicker({ conversation, t, onSent, onError }: Omit<Props, 'locale'>) {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [params, setParams] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const clientId = useRef(newClientId());

  useEffect(() => {
    const qs = conversation.channel_connection_id ? `?channel_connection_id=${conversation.channel_connection_id}` : '';
    request<{ data: Template[] }>(`/api/templates${qs}`)
      .then((r) => setTemplates(r.data))
      .catch((err: Error) => {
        setTemplates([]);
        onError(err.message);
      });
  }, [conversation.channel_connection_id, onError]);

  const template = templates?.find((tpl) => `${tpl.name}|${tpl.language}` === selected) ?? null;

  const send = async () => {
    if (!template) return;
    setSending(true);
    const form = new FormData();
    form.set('kind', 'template');
    form.set('client_id', clientId.current);
    form.set('template_name', template.name);
    form.set('template_language', template.language);
    form.set('template_params', JSON.stringify(params.slice(0, template.body_param_count)));
    try {
      await request(`/api/conversations/${conversation.id}/messages`, { method: 'POST', body: form });
      clientId.current = newClientId();
      setSelected('');
      setParams([]);
      onSent();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="rounded-lg bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning-text)]">{t.templateOnly}</p>
      {templates && templates.length === 0 && <p className="text-sm text-[var(--muted)]">{t.noTemplates}</p>}
      {templates && templates.length > 0 && (
        <>
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setParams([]);
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm"
          >
            <option value="">{t.chooseTemplate}</option>
            {templates.map((tpl) => (
              <option key={`${tpl.name}|${tpl.language}`} value={`${tpl.name}|${tpl.language}`}>
                {tpl.name} · {tpl.language}
              </option>
            ))}
          </select>
          {template && (
            <>
              {template.body && <p className="whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">{template.body}</p>}
              {Array.from({ length: template.body_param_count }, (_, i) => (
                <input
                  key={i}
                  value={params[i] ?? ''}
                  onChange={(e) => setParams((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })}
                  placeholder={`${t.templateParam} {{${i + 1}}}`}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              ))}
              <button
                onClick={send}
                disabled={sending || params.slice(0, template.body_param_count).filter((p) => p?.trim()).length < template.body_param_count}
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {sending ? t.sending : t.sendTemplate}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

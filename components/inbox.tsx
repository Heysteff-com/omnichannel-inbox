'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation, ConversationDetail, ConversationMessage, Page } from '@heysteff/sdk';
import { listenToEvents, request } from '@/lib/client';
import { mergeMessages } from '@/lib/thread';
import type { Dictionary, Locale } from '@/lib/i18n';
import { CHANNEL_FILTERS, ChannelIcon, channelLabel } from './channel-icon';
import { Composer } from './composer';

/** Cada cuánto se consulta cuando no hay tiempo real. */
const POLL_MS = 5_000;

type StatusFilter = 'open' | 'closed';

interface ThreadData {
  conversation: ConversationDetail;
  messages: Page<ConversationMessage>;
}

export function Inbox({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [status, setStatus] = useState<StatusFilter>('open');
  const [channel, setChannel] = useState<string>('');
  const [list, setList] = useState<Conversation[]>([]);
  const [listCursor, setListCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);
  // Todos los mensajes cargados del hilo abierto: los refrescos y "ver anteriores" se suman aquí.
  const [loaded, setLoaded] = useState<ConversationMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [live, setLive] = useState<'connecting' | 'live' | 'polling'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  const loadList = useCallback(async () => {
    const qs = new URLSearchParams({ status, ...(channel ? { channel } : {}) });
    try {
      const page = await request<Page<Conversation>>(`/api/conversations?${qs}`);
      setList(page.data);
      setListCursor(page.cursor.has_more ? page.cursor.next : null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [status, channel]);

  const loadMoreList = async () => {
    if (!listCursor) return;
    const qs = new URLSearchParams({ status, cursor: listCursor, ...(channel ? { channel } : {}) });
    try {
      const page = await request<Page<Conversation>>(`/api/conversations?${qs}`);
      setList((prev) => [...prev, ...page.data.filter((c) => !prev.some((p) => p.id === c.id))]);
      setListCursor(page.cursor.has_more ? page.cursor.next : null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadThread = useCallback(async (id: string) => {
    try {
      const data = await request<ThreadData>(`/api/conversations/${id}`);
      // Llegó tarde: la persona ya abrió otra conversación.
      if (selectedRef.current !== id) return;
      setThread(data);
      setLoaded((prev) => mergeMessages(prev, data.messages.data));
      setOlderCursor((cur) => cur ?? (data.messages.cursor.has_more ? data.messages.cursor.next : null));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const refresh = useCallback(() => {
    void loadList();
    if (selectedRef.current) void loadThread(selectedRef.current);
  }, [loadList, loadThread]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setThread(null);
    setLoaded([]);
    setOlderCursor(null);
    setNotice(null);
    if (selected) void loadThread(selected);
  }, [selected, loadThread]);

  // Tiempo real con /api/events; sin él, sondeo.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Varios eventos seguidos generan una sola recarga.
    const onEvent = () => {
      setLive('live');
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        refreshRef.current();
      }, 400);
    };
    const stop = listenToEvents(onEvent, () => setLive('polling'));
    return () => {
      stop();
      if (timer) clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (live !== 'polling') return;
    const interval = setInterval(() => refreshRef.current(), POLL_MS);
    return () => clearInterval(interval);
  }, [live]);

  const loadOlder = async () => {
    if (!selected || !olderCursor) return;
    try {
      const data = await request<ThreadData>(`/api/conversations/${selected}?cursor=${encodeURIComponent(olderCursor)}`);
      setLoaded((prev) => mergeMessages(prev, data.messages.data));
      setOlderCursor(data.messages.cursor.has_more ? data.messages.cursor.next : null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const setBot = async (paused: boolean) => {
    if (!selected) return;
    try {
      await request(`/api/conversations/${selected}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused }),
      });
      await loadThread(selected);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const markRead = async () => {
    if (!selected) return;
    try {
      const res = await request<{ supported: boolean; receipt_sent: boolean }>(`/api/conversations/${selected}/read`, { method: 'POST' });
      setNotice(res.supported ? t.markedRead : t.noReadReceipt);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/login';
  };

  const messages = thread ? loaded : [];

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        <h1 className="text-base font-semibold">{t.title}</h1>
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <span className={`h-2 w-2 rounded-full ${live === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {live === 'polling' ? t.polling : t.realtime}
        </span>
        <button onClick={logout} className="ml-auto text-sm text-[var(--muted)] hover:text-[var(--text)]">
          {t.logout}
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-[var(--warning-bg)] px-4 py-2 text-sm text-[var(--warning-text)]">
          <span className="min-w-0 flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="×" className="px-2">×</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Lista: en el celular se oculta al abrir una conversación. */}
        <aside className={`${selected ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-[var(--border)] bg-[var(--surface)] md:w-80`}>
          <div className="flex gap-2 border-b border-[var(--border)] p-2">
            <div className="flex rounded-lg bg-[var(--surface-2)] p-0.5 text-sm">
              {(['open', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-md px-2.5 py-1 ${status === s ? 'bg-[var(--surface)] shadow-sm' : 'text-[var(--muted)]'}`}
                >
                  {s === 'open' ? t.filterOpen : t.filterClosed}
                </button>
              ))}
            </div>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
              aria-label={t.allChannels}
            >
              <option value="">{t.allChannels}</option>
              {CHANNEL_FILTERS.map((c) => (
                <option key={c} value={c}>{channelLabel(c, locale)}</option>
              ))}
            </select>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {list.length === 0 && <li className="p-4 text-sm text-[var(--muted)]">{t.noConversations}</li>}
            {list.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-[var(--border)] px-3 py-2.5 text-left hover:bg-[var(--surface-2)] ${selected === c.id ? 'bg-[var(--accent-soft)]' : ''}`}
                >
                  <ChannelIcon channel={c.channel} locale={locale} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.contact_name || c.external_user_id}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">{channelLabel(c.channel, locale)}</span>
                  </span>
                  {c.last_message_at && <time className="shrink-0 text-xs text-[var(--muted)]">{formatWhen(c.last_message_at, locale)}</time>}
                </button>
              </li>
            ))}
            {listCursor && (
              <li className="p-2">
                <button onClick={loadMoreList} className="w-full rounded-lg py-2 text-sm text-[var(--accent)] hover:bg-[var(--surface-2)]">{t.loadMore}</button>
              </li>
            )}
          </ul>
        </aside>

        <section className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
          {!selected && <p className="m-auto p-6 text-sm text-[var(--muted)]">{t.selectConversation}</p>}
          {selected && !thread && <p className="m-auto p-6 text-sm text-[var(--muted)]">…</p>}
          {selected && thread && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <button onClick={() => setSelected(null)} className="text-sm text-[var(--muted)] md:hidden">← {t.back}</button>
                <ChannelIcon channel={thread.conversation.channel} locale={locale} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{thread.conversation.contact_name || thread.conversation.external_user_id}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{thread.conversation.external_user_id}</p>
                </div>
                <button onClick={markRead} className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-[var(--surface-2)]">{t.markRead}</button>
                <button
                  onClick={() => setBot(!thread.conversation.bot_paused)}
                  className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white"
                >
                  {thread.conversation.bot_paused ? t.release : t.take}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--muted)]">
                <span>{thread.conversation.bot_paused ? t.botPaused : t.botActive}</span>
                {thread.conversation.escalation && !thread.conversation.escalation.taken && (
                  <span className="rounded-full bg-[var(--warning-bg)] px-2 py-0.5 text-[var(--warning-text)]">
                    {t.escalated}: {thread.conversation.escalation.reason}
                  </span>
                )}
                {notice && <span className="ml-auto">{notice}</span>}
              </div>

              <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {olderCursor && (
                  <li className="text-center">
                    <button onClick={loadOlder} className="text-xs text-[var(--accent)]">{t.loadOlder}</button>
                  </li>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} locale={locale} t={t} />
                ))}
              </ol>

              <Composer key={thread.conversation.id} conversation={thread.conversation} locale={locale} t={t} onSent={() => loadThread(thread.conversation.id)} onError={setError} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function MessageBubble({ message, locale, t }: { message: ConversationMessage; locale: Locale; t: Dictionary }) {
  const inbound = message.role === 'user';
  const isText = !message.content_type || message.content_type === 'text';
  return (
    <li className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${inbound ? 'rounded-bl-sm bg-[var(--surface)]' : 'rounded-br-sm bg-[var(--outbound)]'} border border-[var(--border)]`}
      >
        {!isText && (
          <p className="mb-1 text-xs font-medium text-[var(--muted)]">
            {t.attachment} · {message.content_type}
          </p>
        )}
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        <p className="mt-1 text-right text-[10px] text-[var(--muted)]">
          {formatWhen(message.created_at, locale)}
          {!inbound && ` · ${message.status}`}
        </p>
      </div>
    </li>
  );
}

function formatWhen(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

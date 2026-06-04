// Per-event Twitch chat editors + the broadcast (category/title) form. These
// were moved out of Events.tsx so the consolidated /control/twitch page can use
// them against the active event. Each takes the EventModel and writes via
// obsApi + notifyEventChanged().
import { useState } from 'react';
import { obsApi } from '@/lib/obsApi';
import type {
  ChatAnnouncement,
  EventModel,
  RecurringChatMessage,
} from '@/lib/obsApi';
import { api } from '@/lib/api';
import { notifyEventChanged } from '@/lib/eventBus';

// ── Broadcast: Twitch category / title on game change ─────────────────

export function TwitchBroadcastForm({ event }: { event: EventModel }) {
  const [updateCategory, setUpdateCategory] = useState(event.update_twitch_category);
  const [titleTemplate, setTitleTemplate] = useState(event.twitch_title_template);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty =
    updateCategory !== event.update_twitch_category ||
    titleTemplate !== event.twitch_title_template;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/events/${event.id}/`, {
        method: 'PATCH',
        body: {
          update_twitch_category: updateCategory,
          twitch_title_template: titleTemplate.trim(),
        },
      });
      notifyEventChanged();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mt-3 p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <header className="d-flex align-items-center gap-2 mb-2">
        <strong>Broadcast</strong>
        {saved && <span className="text-success small">saved ✓</span>}
        {err && <span className="text-danger small">{err}</span>}
      </header>
      <div className="form-check">
        <input
          id="event-cat"
          type="checkbox"
          className="form-check-input"
          checked={updateCategory}
          onChange={(e) => setUpdateCategory(e.target.checked)}
        />
        <label htmlFor="event-cat" className="form-check-label small">
          Update Twitch category on game change
          <span className="text-white-50">
            {' '}
            — sets the primary channel’s game (needs channel:manage:broadcast)
          </span>
        </label>
      </div>
      <label className="d-block small text-white-50 mt-2">
        Stream title on game change (optional)
      </label>
      <input
        value={titleTemplate}
        onChange={(e) => setTitleTemplate(e.target.value)}
        className="form-control form-control-sm"
        placeholder="{channel} — {game} [{position}] · benefitting {charity}"
        disabled={!updateCategory}
      />
      <div className="small text-white-50 mt-1">
        Placeholders: <code>{'{game}'}</code> <code>{'{event}'}</code>{' '}
        <code>{'{channel}'}</code> (Twitch display name) <code>{'{charity}'}</code>{' '}
        <code>{'{position}'}</code> (e.g. “3 of 12”) <code>{'{game_number}'}</code>{' '}
        <code>{'{game_total}'}</code>
      </div>
      <div className="mt-2">
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          onClick={save}
          disabled={busy || !dirty}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ── Twitch chat announcements ─────────────────────────────────────────
//
// Per-trigger enable + editable template. Only the triggers wired to actually
// post are shown. When connected, the event's primary channel posts the
// rendered message to its own chat.

const WIRED_CHAT_TRIGGERS = [
  'donation',
  'milestone',
  'game_change',
  'sub',
  'follow',
  'raid',
  'cheer',
  'redemption',
];

export function ChatAnnouncementsEditor({ event }: { event: EventModel }) {
  const rows = event.chat_announcements
    .filter((a) => WIRED_CHAT_TRIGGERS.includes(a.trigger))
    .sort(
      (a, b) =>
        WIRED_CHAT_TRIGGERS.indexOf(a.trigger) -
        WIRED_CHAT_TRIGGERS.indexOf(b.trigger),
    );

  return (
    <div
      className="mt-3 p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <header className="mb-2">
        <strong>Twitch chat announcements</strong>
      </header>
      <p className="text-white-50 small">
        When the event’s primary channel is connected, it posts these to its own
        chat. Use {'{placeholder}'} fields to insert values.
      </p>
      {rows.length === 0 ? (
        <p className="text-white-50 small m-0">
          Save the event first to configure chat announcements.
        </p>
      ) : (
        <ul className="list-unstyled m-0">
          {rows.map((a) => (
            <ChatAnnouncementRow key={a.id} row={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

const ANNOUNCE_COLORS = ['primary', 'blue', 'green', 'orange', 'purple'];

function ChatAnnouncementRow({ row }: { row: ChatAnnouncement }) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [template, setTemplate] = useState(row.template);
  const [asAnnouncement, setAsAnnouncement] = useState(row.as_announcement);
  const [color, setColor] = useState(row.announcement_color);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty =
    template !== row.template ||
    asAnnouncement !== row.as_announcement ||
    color !== row.announcement_color;

  const persist = async (
    patch: Partial<{
      enabled: boolean;
      template: string;
      as_announcement: boolean;
      announcement_color: string;
    }>,
  ) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateChatAnnouncement(row.id, patch);
      notifyEventChanged();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setErr((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (next: boolean) => {
    setEnabled(next);
    try {
      await persist({ enabled: next, template });
    } catch {
      setEnabled(!next); // revert on failure
    }
  };

  return (
    <li className="py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="d-flex align-items-center gap-2 mb-1">
        <div className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            id={`chat-${row.id}`}
            checked={enabled}
            disabled={busy}
            onChange={(e) => toggle(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor={`chat-${row.id}`}>
            <strong>{row.trigger_display}</strong>
          </label>
        </div>
        {saved && <span className="text-success small">saved ✓</span>}
        {err && <span className="text-danger small">{err}</span>}
      </div>
      <textarea
        className="form-control form-control-sm"
        rows={2}
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        placeholder="Message posted to chat…"
      />
      <div className="d-flex align-items-center gap-3 mt-1 flex-wrap">
        <div className="form-check m-0">
          <input
            className="form-check-input"
            type="checkbox"
            id={`chat-ann-${row.id}`}
            checked={asAnnouncement}
            onChange={(e) => setAsAnnouncement(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor={`chat-ann-${row.id}`}>
            Highlight (/announce)
          </label>
        </div>
        {asAnnouncement && (
          <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            {ANNOUNCE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c === 'primary' ? 'Channel accent' : c}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="d-flex justify-content-between align-items-center mt-1 gap-2 flex-wrap">
        <span className="small text-white-50">
          Placeholders: {row.placeholders.map((p) => `{${p}}`).join(' ') || '—'}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          onClick={() =>
            persist({
              template,
              as_announcement: asAnnouncement,
              announcement_color: color,
            }).catch(() => {})
          }
          disabled={busy || !dirty}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </li>
  );
}

// ── Recurring chat messages (e.g. periodic donation CTA) ──────────────

export function RecurringMessagesEditor({ event }: { event: EventModel }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rows = [...event.recurring_chat_messages].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Delete this recurring message?')) return;
    try {
      await obsApi.deleteRecurringChatMessage(id);
      notifyEventChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const toggle = async (row: RecurringChatMessage, next: boolean) => {
    try {
      await obsApi.updateRecurringChatMessage(row.id, { enabled: next });
      notifyEventChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div
      className="mt-3 p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <header className="d-flex justify-content-between align-items-center mb-2">
        <strong>Recurring chat messages</strong>
        {!adding && editingId === null && (
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={() => setAdding(true)}
          >
            + Add
          </button>
        )}
      </header>
      <p className="small text-white-50">
        Posted to the primary channel’s chat on a timer (needs the{' '}
        <code>post_chat_reminders</code> job). Placeholders:{' '}
        {'{donate_url} {total} {charity} {channel}'}.
      </p>

      {err && <div className="text-danger small mb-2">{err}</div>}

      {adding && (
        <RecurringMessageForm
          eventId={event.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}

      {rows.length === 0 && !adding && (
        <p className="text-white-50 small m-0">None yet.</p>
      )}

      <ul className="list-unstyled m-0">
        {rows.map((r) =>
          editingId === r.id ? (
            <li key={r.id} className="mb-2">
              <RecurringMessageForm
                eventId={event.id}
                row={r}
                onCancel={() => setEditingId(null)}
                onSaved={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={r.id}
              className="py-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`rcm-${r.id}`}
                    checked={r.enabled}
                    onChange={(e) => toggle(r, e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor={`rcm-${r.id}`}>
                    <strong>{r.label || '(unnamed)'}</strong>
                  </label>
                </div>
                <span className="badge bg-secondary">every {r.interval_minutes}m</span>
                {r.only_when_live && (
                  <span className="badge bg-info text-dark">when live</span>
                )}
                <div className="ms-auto control-btn-row">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(r.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(r.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="small text-white-50 text-truncate mt-1">{r.template}</div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function RecurringMessageForm({
  eventId,
  row,
  onCancel,
  onSaved,
}: {
  eventId: number;
  row?: RecurringChatMessage;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = row !== undefined;
  const [label, setLabel] = useState(row?.label ?? '');
  const [template, setTemplate] = useState(
    row?.template ?? '💜 Donate here: {donate_url}',
  );
  const [interval, setInterval] = useState(row?.interval_minutes ?? 15);
  const [onlyLive, setOnlyLive] = useState(row?.only_when_live ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template.trim()) return;
    setBusy(true);
    setErr(null);
    const body = {
      label: label.trim(),
      template: template.trim(),
      interval_minutes: Math.max(1, interval),
      only_when_live: onlyLive,
    };
    try {
      if (isEdit) {
        await obsApi.updateRecurringChatMessage(row.id, body);
      } else {
        await obsApi.createRecurringChatMessage({ event: eventId, ...body, enabled: false });
      }
      notifyEventChanged();
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-2 p-2"
      style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}
    >
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 160 }}>
          <label className="d-block small text-white-50">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="form-control form-control-sm"
            placeholder="Donation CTA"
          />
        </div>
        <div style={{ width: 130 }}>
          <label className="d-block small text-white-50">Every (min)</label>
          <input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="form-control form-control-sm"
          />
        </div>
        <div className="form-check mb-1">
          <input
            id={`rcm-live-${row?.id ?? 'new'}`}
            type="checkbox"
            className="form-check-input"
            checked={onlyLive}
            onChange={(e) => setOnlyLive(e.target.checked)}
          />
          <label
            htmlFor={`rcm-live-${row?.id ?? 'new'}`}
            className="form-check-label small"
          >
            Only when live
          </label>
        </div>
      </div>
      <label className="d-block small text-white-50 mt-2">Message</label>
      <textarea
        className="form-control form-control-sm"
        rows={2}
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        placeholder="💜 Donate here: {donate_url}"
      />
      <div className="d-flex gap-2 mt-2">
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {err && <div className="text-danger small mt-2">{err}</div>}
    </form>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  ChatAnnouncement,
  Charity,
  DonationPage,
  DonationPlatformKey,
  EventCharityLink,
  EventModel,
  EventTwitchChannel,
  RecurringChatMessage,
} from '@/lib/obsApi';
import { api } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/env';
import { notifyEventChanged } from '@/lib/eventBus';
import { ImageDropzone } from '@/components/ImageDropzone';

type SortKey = 'name' | 'start_time' | 'currency_symbol' | 'is_active' | 'donation_pages';
type SortDir = 'asc' | 'desc';

const sortValue = (e: EventModel, key: SortKey): string | number => {
  switch (key) {
    case 'start_time':
      return new Date(e.start_time).getTime();
    case 'is_active':
      return e.is_active ? 1 : 0;
    case 'donation_pages':
      return e.donation_pages.length;
    case 'name':
    case 'currency_symbol':
      return e[key].toLowerCase();
  }
};

interface DonationPageDraft {
  platform: DonationPlatformKey;
  label: string;
  url: string;
  external_id: string;
  is_primary: boolean;
}

// Twitch Charity is intentionally NOT here — Twitch channels (with their own
// OAuth connect) are managed in the per-event "Twitch channels" section below,
// which also drives the public donate link. Other platforms stay here and the
// list is ready for future JustGiving / Tiltify automation.
const DONATION_PLATFORMS: { value: DonationPlatformKey; label: string }[] = [
  { value: 'justgiving', label: 'JustGiving' },
  { value: 'tiltify', label: 'Tiltify' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'direct', label: 'Direct / cash' },
  { value: 'other', label: 'Other' },
];

const CURRENCY_OPTIONS = ['£', '$', '€', '¥'];

export function EventsControl() {
  const { data: events } = usePolledQuery(obsApi.events, 5000);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('start_time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const visibleEvents = useMemo(() => {
    if (!events) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? events.filter((e) => e.name.toLowerCase().includes(q))
      : events;
    const sorted = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [events, filter, sortKey, sortDir]);

  const remove = async (id: number) => {
    if (!confirm('Delete this event? All schedule entries and donations attached to it will be deleted too.')) {
      return;
    }
    try {
      await api(`/api/events/${id}/`, { method: 'DELETE' });
      notifyEventChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const activate = async (id: number) => {
    try {
      await api(`/api/events/${id}/activate/`, { method: 'POST' });
      notifyEventChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const deactivate = async (id: number) => {
    // Turn the live event off so the OBS sources fall back to pre-stream
    // (no active event). Plain PATCH — there's no demote action, and the
    // serializer accepts is_active writes (same path EventForm uses).
    try {
      await api(`/api/events/${id}/`, { method: 'PATCH', body: { is_active: false } });
      notifyEventChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h2 className="m-0">Events</h2>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name…"
            className="form-control form-control-sm"
            style={{ width: 240 }}
          />
          {!adding && (
            <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
              + Add event
            </button>
          )}
        </div>
      </header>

      {adding && (
        <EventForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
      )}

      {err && <p className="text-danger">{err}</p>}

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th style={{ width: 60 }}></th>
            <SortableTh label="Name" sortKey="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Start time" sortKey="start_time" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Currency" sortKey="currency_symbol" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Status" sortKey="is_active" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleEvents.map((e) =>
            editingId === e.id ? (
              <tr key={e.id}>
                <td colSpan={6}>
                  <EventForm
                    event={e}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                  <EventTwitchChannelsEditor event={e} />
                  <DonationPagesEditor event={e} />
                  <EventCharitiesEditor event={e} />
                  <ChatAnnouncementsEditor event={e} />
                  <RecurringMessagesEditor event={e} />
                </td>
              </tr>
            ) : (
              <tr key={e.id}>
                <td>
                  {e.logo_url ? (
                    <img
                      src={resolveMediaUrl(e.logo_url)}
                      alt={`${e.name} logo`}
                      width={48}
                      height={48}
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      aria-hidden
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {e.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td>
                  <strong>{e.name}</strong>
                  <div className="small text-white-50 d-flex gap-2 flex-wrap">
                    {e.banner_url && (
                      <a
                        className="text-white-50"
                        href={e.banner_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        banner ↗
                      </a>
                    )}
                    <span>
                      {e.donation_pages.length} donation{' '}
                      page{e.donation_pages.length === 1 ? '' : 's'}
                    </span>
                    <span>
                      {e.event_charities.length} charit
                      {e.event_charities.length === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                </td>
                <td>{fmtDateTime(e.start_time)}</td>
                <td>{e.currency_symbol}</td>
                <td>
                  {e.is_active ? (
                    <span className="badge bg-warning text-dark">● ACTIVE</span>
                  ) : (
                    <span className="text-white-50 small">inactive</span>
                  )}
                </td>
                <td>
                  <div className="control-btn-row">
                    {!e.is_active ? (
                      <button
                        className="btn btn-sm btn-bloodmoon"
                        onClick={() => activate(e.id)}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => deactivate(e.id)}
                        title="Turn this event off — OBS sources return to pre-stream"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setEditingId(e.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => remove(e.id)}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
          {events && events.length === 0 && (
            <tr>
              <td colSpan={6} className="text-white-50 text-center py-4">
                No events yet — add one above.
              </td>
            </tr>
          )}
          {events && events.length > 0 && visibleEvents.length === 0 && (
            <tr>
              <td colSpan={6} className="text-white-50 text-center py-4">
                No events match “{filter}”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  const indicator = active ? (dir === 'asc' ? '▲' : '▼') : '';
  return (
    <th
      onClick={() => onClick(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 1 : 0.35 }}>
        {indicator || '↕'}
      </span>
    </th>
  );
}

function EventForm({
  event,
  onCancel,
  onSaved,
}: {
  event?: EventModel;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = event !== undefined;
  const [name, setName] = useState(event?.name ?? '');
  const [startTime, setStartTime] = useState(
    event ? toLocalInput(event.start_time) : '',
  );
  const [currency, setCurrency] = useState(event?.currency_symbol ?? '£');
  const [isActive, setIsActive] = useState(event?.is_active ?? false);
  const [logoUrl, setLogoUrl] = useState(event?.logo_url ?? '');
  const [bannerUrl, setBannerUrl] = useState(event?.banner_url ?? '');
  const [gameblastLogoUrl, setGameblastLogoUrl] = useState(
    event?.gameblast_logo_url ?? '',
  );
  const [updateCategory, setUpdateCategory] = useState(
    event?.update_twitch_category ?? false,
  );
  const [titleTemplate, setTitleTemplate] = useState(
    event?.twitch_title_template ?? '',
  );
  const [pendingPages, setPendingPages] = useState<DonationPageDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        start_time: new Date(startTime).toISOString(),
        currency_symbol: currency,
        is_active: isActive,
        logo_url: logoUrl.trim(),
        banner_url: bannerUrl.trim(),
        gameblast_logo_url: gameblastLogoUrl.trim(),
        update_twitch_category: updateCategory,
        twitch_title_template: titleTemplate.trim(),
      };
      if (isEdit) {
        await api(`/api/events/${event.id}/`, { method: 'PATCH', body });
      } else {
        const created = await api<EventModel>('/api/events/', { method: 'POST', body });
        for (const draft of pendingPages) {
          await api('/api/donation-pages/', {
            method: 'POST',
            body: { ...draft, event: created.id },
          });
        }
      }
      // Push the change to every other open tab so OBS browser sources
      // (omnibar charity logo, ad-panel carousel, schedule chrome…)
      // re-fetch and re-skin in the next render frame rather than
      // waiting for their next 10s poll tick.
      notifyEventChanged();
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 d-flex gap-2 flex-wrap align-items-end">
      <div style={{ minWidth: 240, flex: 2 }}>
        <label className="d-block small text-white-50">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div style={{ minWidth: 220 }}>
        <label className="d-block small text-white-50">Start time</label>
        <input
          type="datetime-local"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Currency</label>
        <select
          className="form-select form-select-sm"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{ width: 80 }}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-check mb-1">
        <input
          id={`event-active-${event?.id ?? 'new'}`}
          type="checkbox"
          className="form-check-input"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label
          htmlFor={`event-active-${event?.id ?? 'new'}`}
          className="form-check-label small"
        >
          Active
        </label>
      </div>
      <div className="w-100 d-flex gap-3 flex-wrap">
        <div style={{ minWidth: 280, flex: 1 }}>
          <label className="d-block small text-white-50">Logo (square)</label>
          <ImageDropzone
            value={logoUrl}
            onChange={setLogoUrl}
            previewStyle={{ width: 96, height: 96, borderRadius: 6 }}
            folder="events"
          />
        </div>
        <div style={{ minWidth: 280, flex: 1 }}>
          <label
            className="d-block small text-white-50"
            title="Updated each campaign year — surfaces in the OBS omnibar + ad-panel carousel"
          >
            GameBlast logo (this year's campaign)
          </label>
          <ImageDropzone
            value={gameblastLogoUrl}
            onChange={setGameblastLogoUrl}
            previewStyle={{ width: 96, height: 96, borderRadius: 6 }}
            folder="events"
          />
        </div>
        <div style={{ minWidth: 280, flex: 2 }}>
          <label className="d-block small text-white-50">Banner (wide poster)</label>
          <ImageDropzone
            value={bannerUrl}
            onChange={setBannerUrl}
            previewStyle={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4 }}
            folder="events"
          />
        </div>
      </div>
      {!isEdit && (
        <div className="w-100">
          <DraftDonationPagesEditor
            pages={pendingPages}
            onChange={setPendingPages}
          />
        </div>
      )}
      <div
        className="w-100 p-2"
        style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}
      >
        <div className="form-check">
          <input
            id={`event-cat-${event?.id ?? 'new'}`}
            type="checkbox"
            className="form-check-input"
            checked={updateCategory}
            onChange={(e) => setUpdateCategory(e.target.checked)}
          />
          <label
            htmlFor={`event-cat-${event?.id ?? 'new'}`}
            className="form-check-label small"
          >
            Update Twitch category on game change
            <span className="text-white-50">
              {' '}
              — sets the primary channel’s game (needs channel:manage:broadcast)
            </span>
          </label>
        </div>
        <label className="d-block small text-white-50 mt-2">
          Stream title on game change (optional) — {'{game} {event}'}
        </label>
        <input
          value={titleTemplate}
          onChange={(e) => setTitleTemplate(e.target.value)}
          className="form-control form-control-sm"
          placeholder="Zeldathon — Now playing: {game}"
          disabled={!updateCategory}
        />
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {busy ? 'Saving…' : isEdit ? 'Update' : 'Save'}
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
      {err && <div className="text-danger w-100 mt-2">{err}</div>}
    </form>
  );
}

function DraftDonationPagesEditor({
  pages,
  onChange,
}: {
  pages: DonationPageDraft[];
  onChange: (next: DonationPageDraft[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const addOrUpdate = (draft: DonationPageDraft, idx: number | null) => {
    if (idx === null) {
      onChange([...pages, draft]);
    } else {
      const next = [...pages];
      next[idx] = draft;
      onChange(next);
    }
  };

  const remove = (idx: number) => {
    onChange(pages.filter((_, i) => i !== idx));
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
        <strong>Donation pages</strong>
        {!adding && editingIdx === null && (
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={() => setAdding(true)}
          >
            + Add page
          </button>
        )}
      </header>

      {adding && (
        <DraftPageForm
          onSave={(d) => {
            addOrUpdate(d, null);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {pages.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          Optional — link JustGiving / Tiltify / etc. pages now, or add them later
          after saving.
        </p>
      )}

      {pages.length > 0 && (
        <ul className="list-unstyled m-0">
          {pages.map((p, idx) =>
            editingIdx === idx ? (
              <li key={idx} className="mb-2">
                <DraftPageForm
                  initial={p}
                  onSave={(d) => {
                    addOrUpdate(d, idx);
                    setEditingIdx(null);
                  }}
                  onCancel={() => setEditingIdx(null)}
                />
              </li>
            ) : (
              <li
                key={idx}
                className="d-flex align-items-center gap-2 flex-wrap py-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="badge bg-secondary">
                  {DONATION_PLATFORMS.find((x) => x.value === p.platform)?.label ?? p.platform}
                </span>
                {p.is_primary && (
                  <span className="badge bg-warning text-dark">primary</span>
                )}
                <strong>{p.label || p.platform}</strong>
                <a
                  className="text-warning small text-truncate"
                  style={{ maxWidth: 380 }}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.url}
                </a>
                {p.external_id && (
                  <code className="small text-white-50">{p.external_id}</code>
                )}
                <div className="ms-auto control-btn-row">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingIdx(idx)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(idx)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function DraftPageForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: DonationPageDraft;
  onSave: (draft: DonationPageDraft) => void;
  onCancel: () => void;
}) {
  const [platform, setPlatform] = useState<DonationPlatformKey>(
    initial?.platform ?? 'justgiving',
  );
  const [label, setLabel] = useState(initial?.label ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [externalId, setExternalId] = useState(initial?.external_id ?? '');
  const [isPrimary, setIsPrimary] = useState(initial?.is_primary ?? false);

  const handleSave = () => {
    if (!url.trim()) return;
    onSave({
      platform,
      label: label.trim(),
      url: url.trim(),
      external_id: externalId.trim(),
      is_primary: isPrimary,
    });
  };

  return (
    <div
      className="d-flex gap-2 flex-wrap align-items-end mt-2"
      style={{
        padding: 10,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
      }}
    >
      <div style={{ minWidth: 140 }}>
        <label className="d-block small text-white-50">Platform</label>
        <select
          className="form-select form-select-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as DonationPlatformKey)}
        >
          {DONATION_PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: 200, flex: 1 }}>
        <label className="d-block small text-white-50">Label (optional)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="form-control form-control-sm"
          placeholder="e.g. Main page"
        />
      </div>
      <div style={{ minWidth: 280, flex: 2 }}>
        <label className="d-block small text-white-50">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="form-control form-control-sm"
          placeholder="https://…"
        />
      </div>
      <div style={{ minWidth: 160 }}>
        <label className="d-block small text-white-50">External id (optional)</label>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          className="form-control form-control-sm"
          placeholder="campaign id / slug"
        />
      </div>
      <div className="form-check mb-1">
        <input
          id={`draft-primary-${initial ? 'edit' : 'new'}`}
          type="checkbox"
          className="form-check-input"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        <label
          htmlFor={`draft-primary-${initial ? 'edit' : 'new'}`}
          className="form-check-label small"
        >
          Primary
        </label>
      </div>
      <button
        type="button"
        className="btn btn-bloodmoon btn-sm"
        onClick={handleSave}
        disabled={!url.trim()}
      >
        {initial ? 'Update' : 'Add'}
      </button>
      <button
        type="button"
        className="btn btn-outline-light btn-sm"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

function DonationPagesEditor({ event }: { event: EventModel }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const pages = event.donation_pages;

  const remove = async (id: number) => {
    if (!confirm('Remove this donation page?')) return;
    try {
      await api(`/api/donation-pages/${id}/`, { method: 'DELETE' });
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
        <strong>Donation pages</strong>
        {!adding && (
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={() => setAdding(true)}
          >
            + Add page
          </button>
        )}
      </header>

      {err && <div className="text-danger small mb-2">{err}</div>}

      {adding && (
        <DonationPageForm
          eventId={event.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}

      {pages.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          No donation pages yet — link your JustGiving / Tiltify / etc. campaigns here.
        </p>
      )}

      {pages.length > 0 && (
        <ul className="list-unstyled m-0">
          {pages.map((p) =>
            editingId === p.id ? (
              <li key={p.id} className="mb-2">
                <DonationPageForm
                  eventId={event.id}
                  page={p}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={p.id}
                className="d-flex align-items-center gap-2 flex-wrap py-2 px-2"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: p.is_primary ? 'rgba(231, 19, 71, 0.12)' : undefined,
                  borderLeft: p.is_primary
                    ? '3px solid rgba(231, 19, 71, 0.7)'
                    : '3px solid transparent',
                  borderRadius: 4,
                }}
              >
                <strong>{p.label || p.display_label}</strong>
                <a
                  className="text-warning small text-truncate"
                  style={{ maxWidth: 380 }}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.url}
                </a>
                {p.external_id && (
                  <code className="small text-white-50">{p.external_id}</code>
                )}
                <div className="ms-auto control-btn-row">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(p.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(p.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function DonationPageForm({
  eventId,
  page,
  onCancel,
  onSaved,
}: {
  eventId: number;
  page?: DonationPage;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = page !== undefined;
  const [platform, setPlatform] = useState<DonationPlatformKey>(
    page?.platform ?? 'justgiving',
  );
  const [label, setLabel] = useState(page?.label ?? '');
  const [url, setUrl] = useState(page?.url ?? '');
  const [externalId, setExternalId] = useState(page?.external_id ?? '');
  const [isPrimary, setIsPrimary] = useState(page?.is_primary ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        event: eventId,
        platform,
        label: label.trim(),
        url: url.trim(),
        external_id: externalId.trim(),
        is_primary: isPrimary,
      };
      if (isEdit) {
        await api(`/api/donation-pages/${page.id}/`, { method: 'PATCH', body });
      } else {
        await api('/api/donation-pages/', { method: 'POST', body });
      }
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
      className="d-flex gap-2 flex-wrap align-items-end mt-2"
      style={{
        padding: 10,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
      }}
    >
      <div style={{ minWidth: 140 }}>
        <label className="d-block small text-white-50">Platform</label>
        <select
          className="form-select form-select-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as DonationPlatformKey)}
        >
          {DONATION_PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: 200, flex: 1 }}>
        <label className="d-block small text-white-50">Label (optional)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="form-control form-control-sm"
          placeholder="e.g. Main page"
        />
      </div>
      <div style={{ minWidth: 280, flex: 2 }}>
        <label className="d-block small text-white-50">URL</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="form-control form-control-sm"
          placeholder="https://…"
        />
      </div>
      <div style={{ minWidth: 160 }}>
        <label className="d-block small text-white-50">External id (optional)</label>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          className="form-control form-control-sm"
          placeholder="campaign id / slug"
        />
      </div>
      <div className="form-check mb-1">
        <input
          id={`dp-primary-${page?.id ?? 'new'}`}
          type="checkbox"
          className="form-check-input"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        <label
          htmlFor={`dp-primary-${page?.id ?? 'new'}`}
          className="form-check-label small"
        >
          Primary
        </label>
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {busy ? 'Saving…' : isEdit ? 'Update' : 'Save'}
      </button>
      <button
        type="button"
        className="btn btn-outline-light btn-sm"
        onClick={onCancel}
      >
        Cancel
      </button>
      {err && <div className="text-danger w-100 small mt-2">{err}</div>}
    </form>
  );
}

// ── Event ↔ Charity links ────────────────────────────────────────────
//
// Mirrors the shape of DonationPagesEditor: lists the EventCharity
// rows attached to the event, with a per-link form to set is_primary
// and order, and an add-form that picks an existing Charity from the
// catalogue. Writes go through the dedicated endpoints so the picker
// stays snappy without re-fetching the whole event tree.

function EventCharitiesEditor({ event }: { event: EventModel }) {
  // Poll the catalogue so newly-added charities show up in the picker
  // without a page reload — operators frequently flow Charities →
  // Events when seeding a new event.
  const { data: catalogue } = usePolledQuery(
    () => obsApi.charities({ activeOnly: true }),
    10_000,
  );
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const links = [...event.event_charities].sort((a, b) => a.order - b.order);
  const attachedIds = new Set(links.map((l) => l.charity));
  const candidates = (catalogue ?? []).filter((c) => !attachedIds.has(c.id));

  const remove = async (id: number) => {
    if (!confirm('Detach this charity from the event?')) return;
    try {
      await obsApi.deleteEventCharity(id);
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
      <header className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
        <strong>Benefitting charities</strong>
        {!adding && (
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={() => setAdding(true)}
            disabled={candidates.length === 0}
            title={
              candidates.length === 0
                ? 'Every active charity is already attached to this event.'
                : undefined
            }
          >
            + Attach charity
          </button>
        )}
      </header>

      {err && <div className="text-danger small mb-2">{err}</div>}

      {adding && (
        <EventCharityAddForm
          eventId={event.id}
          candidates={candidates}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}

      {links.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          No charities attached yet — link the beneficiary org(s) so the
          event landing CTAs, donations side panel, and omnibar charity
          cluster can pull copy + branding from the catalogue.
        </p>
      )}

      {links.length > 0 && (
        <ul className="list-unstyled m-0">
          {links.map((l) =>
            editingId === l.id ? (
              <li key={l.id} className="mb-2">
                <EventCharityEditForm
                  link={l}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={l.id}
                className="d-flex align-items-center gap-2 flex-wrap py-2 px-2"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: l.is_primary
                    ? 'rgba(231, 19, 71, 0.12)'
                    : undefined,
                  borderLeft: l.is_primary
                    ? '3px solid rgba(231, 19, 71, 0.7)'
                    : '3px solid transparent',
                  borderRadius: 4,
                }}
              >
                {l.charity_detail.logo_thumbnail_url || l.charity_detail.logo_url ? (
                  <img
                    src={resolveMediaUrl(
                      l.charity_detail.logo_thumbnail_url ||
                        l.charity_detail.logo_url,
                    )}
                    alt=""
                    width={40}
                    height={40}
                    style={{
                      borderRadius: 4,
                      // Cover-fit only when the operator gave us a
                      // dedicated square thumbnail. The full logo
                      // falls through to contain-fit so a wordmark
                      // isn't clipped to an illegible centre slice.
                      objectFit: l.charity_detail.logo_thumbnail_url
                        ? 'cover'
                        : 'contain',
                      background: l.charity_detail.logo_thumbnail_url
                        ? undefined
                        : 'rgba(255,255,255,0.04)',
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                )}
                <strong>{l.charity_detail.name}</strong>
                {l.is_primary && (
                  <span className="badge bg-warning text-dark">primary</span>
                )}
                <code className="small text-white-50">
                  {l.charity_detail.slug}
                </code>
                <span className="small text-white-50">order {l.order}</span>
                <div className="ms-auto control-btn-row">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(l.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(l.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function EventCharityAddForm({
  eventId,
  candidates,
  onCancel,
  onSaved,
}: {
  eventId: number;
  candidates: Charity[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [charityId, setCharityId] = useState<number | ''>(
    candidates[0]?.id ?? '',
  );
  const [isPrimary, setIsPrimary] = useState(false);
  const [order, setOrder] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (charityId === '') return;
    setErr(null);
    setBusy(true);
    try {
      await obsApi.createEventCharity({
        event: eventId,
        charity: Number(charityId),
        is_primary: isPrimary,
        order,
      });
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
      className="d-flex gap-2 flex-wrap align-items-end mt-2"
      style={{
        padding: 10,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
      }}
    >
      <div style={{ minWidth: 240, flex: 2 }}>
        <label className="d-block small text-white-50">Charity</label>
        <select
          required
          className="form-select form-select-sm"
          value={charityId}
          onChange={(e) =>
            setCharityId(e.target.value === '' ? '' : Number(e.target.value))
          }
        >
          {candidates.length === 0 && (
            <option value="">— No more charities to attach —</option>
          )}
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.slug})
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: 90 }}>
        <label className="d-block small text-white-50">Order</label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="form-control form-control-sm"
          style={{ width: 90 }}
        />
      </div>
      <div className="form-check mb-1">
        <input
          id={`ec-primary-new-${eventId}`}
          type="checkbox"
          className="form-check-input"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        <label
          htmlFor={`ec-primary-new-${eventId}`}
          className="form-check-label small"
        >
          Primary
        </label>
      </div>
      <button
        type="submit"
        className="btn btn-bloodmoon btn-sm"
        disabled={busy || charityId === ''}
      >
        {busy ? 'Saving…' : 'Attach'}
      </button>
      <button
        type="button"
        className="btn btn-outline-light btn-sm"
        onClick={onCancel}
      >
        Cancel
      </button>
      {err && <div className="text-danger w-100 small mt-2">{err}</div>}
    </form>
  );
}

function EventCharityEditForm({
  link,
  onCancel,
  onSaved,
}: {
  link: EventCharityLink;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPrimary, setIsPrimary] = useState(link.is_primary);
  const [order, setOrder] = useState(link.order);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await obsApi.updateEventCharity(link.id, {
        is_primary: isPrimary,
        order,
      });
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
      className="d-flex gap-2 flex-wrap align-items-end mt-2"
      style={{
        padding: 10,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
      }}
    >
      <div style={{ flex: 2, minWidth: 240 }}>
        <span className="small text-white-50 d-block">Charity</span>
        <strong>{link.charity_detail.name}</strong>
        <code className="small text-white-50 ms-2">
          {link.charity_detail.slug}
        </code>
      </div>
      <div style={{ minWidth: 90 }}>
        <label className="d-block small text-white-50">Order</label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="form-control form-control-sm"
          style={{ width: 90 }}
        />
      </div>
      <div className="form-check mb-1">
        <input
          id={`ec-primary-${link.id}`}
          type="checkbox"
          className="form-check-input"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        <label
          htmlFor={`ec-primary-${link.id}`}
          className="form-check-label small"
        >
          Primary
        </label>
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {busy ? 'Saving…' : 'Update'}
      </button>
      <button
        type="button"
        className="btn btn-outline-light btn-sm"
        onClick={onCancel}
      >
        Cancel
      </button>
      {err && <div className="text-danger w-100 small mt-2">{err}</div>}
    </form>
  );
}

// ── Per-event Twitch channels ────────────────────────────────────────
//
// Mirrors DonationPagesEditor/EventCharitiesEditor: a list of the event's
// Twitch channels with an add/edit form, plus a per-channel device-code
// "Connect" flow that mints an OAuth token (TwitchChannelConnection) so the
// channel can be a charity source. Each channel drives live status; charity
// channels also need connecting.

function EventTwitchChannelsEditor({ event }: { event: EventModel }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState<EventTwitchChannel | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const channels = [...event.twitch_channels].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Remove this Twitch channel from the event?')) return;
    try {
      await obsApi.deleteEventTwitchChannel(id);
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
        <strong>Twitch channels</strong>
        {!adding && (
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={() => setAdding(true)}
          >
            + Add channel
          </button>
        )}
      </header>

      {err && <div className="text-danger small mb-2">{err}</div>}

      {adding && (
        <EventTwitchChannelForm
          eventId={event.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}

      {channels.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          No channels yet — add the stream channel(s). Each drives live status;
          tick “Charity source” and Connect to pull its donations into this
          event.
        </p>
      )}

      {channels.length > 0 && (
        <ul className="list-unstyled m-0">
          {channels.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="mb-2">
                <EventTwitchChannelForm
                  eventId={event.id}
                  channel={c}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={c.id}
                className="d-flex align-items-center gap-2 flex-wrap py-2 px-2"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: c.is_primary ? 'rgba(231, 19, 71, 0.12)' : undefined,
                  borderLeft: c.is_primary
                    ? '3px solid rgba(231, 19, 71, 0.7)'
                    : '3px solid transparent',
                  borderRadius: 4,
                }}
              >
                <code className="text-warning">twitch.tv/{c.login}</code>
                {c.is_primary && (
                  <span className="badge bg-warning text-dark">primary</span>
                )}
                {c.track_charity && (
                  <span className="badge bg-info text-dark">charity</span>
                )}
                {c.track_charity &&
                  (c.is_connected ? (
                    <span
                      className="badge bg-success"
                      title={c.connection_scopes.join(' ')}
                    >
                      connected
                    </span>
                  ) : (
                    <span className="badge bg-secondary">not connected</span>
                  ))}
                <div className="ms-auto control-btn-row">
                  {c.track_charity && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => setConnecting(c)}
                    >
                      {c.is_connected ? 'Reconnect' : 'Connect'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(c.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(c.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {connecting && (
        <ConnectChannelModal
          channel={connecting}
          onClose={() => setConnecting(null)}
        />
      )}
    </div>
  );
}

function EventTwitchChannelForm({
  eventId,
  channel,
  onCancel,
  onSaved,
}: {
  eventId: number;
  channel?: EventTwitchChannel;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = channel !== undefined;
  const [login, setLogin] = useState(channel?.login ?? '');
  const [isPrimary, setIsPrimary] = useState(channel?.is_primary ?? false);
  const [trackCharity, setTrackCharity] = useState(channel?.track_charity ?? false);
  const [charitySlug, setCharitySlug] = useState(channel?.charity_slug ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) return;
    setErr(null);
    setBusy(true);
    const body = {
      login: login.trim().toLowerCase(),
      is_primary: isPrimary,
      track_charity: trackCharity,
      charity_slug: charitySlug.trim(),
    };
    try {
      if (isEdit) {
        await obsApi.updateEventTwitchChannel(channel.id, body);
      } else {
        await obsApi.createEventTwitchChannel({ event: eventId, ...body });
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
      className="d-flex gap-2 flex-wrap align-items-end mt-2"
      style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}
    >
      <div style={{ minWidth: 200 }}>
        <label className="d-block small text-white-50">Channel</label>
        <div className="input-group input-group-sm">
          <span className="input-group-text">twitch.tv/</span>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="form-control form-control-sm"
            placeholder="msec"
            spellCheck={false}
            maxLength={50}
            required
          />
        </div>
      </div>
      <div style={{ minWidth: 180 }}>
        <label className="d-block small text-white-50">
          Charity slug (optional)
        </label>
        <input
          value={charitySlug}
          onChange={(e) => setCharitySlug(e.target.value)}
          className="form-control form-control-sm"
          placeholder="msec-gameblast26"
        />
      </div>
      <div className="form-check mb-1">
        <input
          id={`etc-primary-${channel?.id ?? 'new'}`}
          type="checkbox"
          className="form-check-input"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        <label
          htmlFor={`etc-primary-${channel?.id ?? 'new'}`}
          className="form-check-label small"
        >
          Primary
        </label>
      </div>
      <div className="form-check mb-1">
        <input
          id={`etc-charity-${channel?.id ?? 'new'}`}
          type="checkbox"
          className="form-check-input"
          checked={trackCharity}
          onChange={(e) => setTrackCharity(e.target.checked)}
        />
        <label
          htmlFor={`etc-charity-${channel?.id ?? 'new'}`}
          className="form-check-label small"
        >
          Charity source
        </label>
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
      {err && <div className="text-danger w-100 small mt-2">{err}</div>}
    </form>
  );
}

function ConnectChannelModal({
  channel,
  onClose,
}: {
  channel: EventTwitchChannel;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<'starting' | 'waiting' | 'done' | 'error'>(
    'starting',
  );
  const [info, setInfo] = useState<{ user_code: string; verification_uri: string } | null>(
    null,
  );
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    (async () => {
      try {
        const role = channel.is_primary ? 'primary' : 'charity';
        const started = await obsApi.twitchConnectStart(channel.login, role);
        if (cancelled) return;
        setInfo({
          user_code: started.user_code,
          verification_uri: started.verification_uri,
        });
        setPhase('waiting');
        const intervalMs = Math.max(2, started.interval) * 1000;
        const deadline = Date.now() + started.expires_in * 1000;
        const poll = async () => {
          if (cancelled) return;
          if (Date.now() > deadline) {
            setPhase('error');
            setMsg('Authorisation timed out — try again.');
            return;
          }
          try {
            const res = await obsApi.twitchConnectPoll(started.device_code, channel.login);
            if (cancelled) return;
            if (res.status === 'authorized') {
              setPhase('done');
              notifyEventChanged();
              return;
            }
            if (res.status === 'expired' || res.status === 'error') {
              setPhase('error');
              setMsg(res.message || 'Authorisation failed.');
              return;
            }
            timer = window.setTimeout(
              poll,
              res.status === 'slow_down' ? intervalMs + 2000 : intervalMs,
            );
          } catch (e) {
            if (!cancelled) {
              setPhase('error');
              setMsg((e as Error).message);
            }
          }
        };
        timer = window.setTimeout(poll, intervalMs);
      } catch (e) {
        if (!cancelled) {
          setPhase('error');
          setMsg((e as Error).message);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [channel.login, channel.is_primary]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Connect ${channel.login}`}
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.65)', zIndex: 1090, padding: '1rem' }}
      onClick={onClose}
    >
      <div
        className="control-card"
        style={{ maxWidth: 460, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="m-0">Connect twitch.tv/{channel.login}</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onClose}
          />
        </header>
        {phase === 'starting' && <p className="text-white-50">Starting…</p>}
        {phase === 'waiting' && info && (
          <div>
            <p className="small text-white-50 mb-2">
              The broadcaster of <strong>{channel.login}</strong> authorises on
              their own device:
            </p>
            <ol className="small">
              <li>
                Open{' '}
                <a href={info.verification_uri} target="_blank" rel="noreferrer">
                  {info.verification_uri}
                </a>
              </li>
              <li>
                Enter code{' '}
                <code style={{ fontSize: '1.25em' }}>{info.user_code}</code>
              </li>
            </ol>
            <p className="small text-white-50 m-0">
              Waiting for authorisation… this updates automatically.
            </p>
          </div>
        )}
        {phase === 'done' && (
          <p className="text-success m-0">✓ Connected — you can close this.</p>
        )}
        {phase === 'error' && <p className="text-danger m-0">{msg}</p>}
        <div className="text-end mt-3">
          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Twitch chat announcements ─────────────────────────────────────────
//
// Per-trigger enable + editable template. Only the triggers wired to actually
// post are shown; the rest exist in the DB and light up as later slices ship.
// When connected, the event's primary channel posts the rendered message to
// its own chat.

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

function ChatAnnouncementsEditor({ event }: { event: EventModel }) {
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

function RecurringMessagesEditor({ event }: { event: EventModel }) {
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
        <code>post_chat_reminders</code> cron). Placeholders:{' '}
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

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalInput(iso: string): string {
  // datetime-local input expects 'YYYY-MM-DDTHH:MM' in local time.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

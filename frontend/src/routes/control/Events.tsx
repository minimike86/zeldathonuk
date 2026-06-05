import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  Charity,
  DonationPage,
  DonationPlatformKey,
  EventCharityLink,
  EventModel,
  EventTwitchChannel,
} from '@/lib/obsApi';
import { api } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/env';
import { notifyEventChanged, onEventChanged } from '@/lib/eventBus';
import { ImageDropzone } from '@/components/ImageDropzone';

type SortKey =
  | 'name'
  | 'start_time'
  | 'currency_symbol'
  | 'is_active'
  | 'donation_pages'
  | 'raised';
type SortDir = 'asc' | 'desc';

/** Sum the synced donation-page aggregates for an event. These are the
 *  platform-reported page totals (JustGiving) cached via "Sync total" — the
 *  only figure available for completed/past events whose itemized donation
 *  feed has gone empty. `synced` is false until at least one page is synced. */
function eventSyncedTotal(e: EventModel): {
  amount: number;
  count: number;
  synced: boolean;
} {
  let amount = 0;
  let count = 0;
  let synced = false;
  for (const p of e.donation_pages) {
    if (p.total_synced_at !== null && p.total_raised !== null) {
      synced = true;
      amount += Number(p.total_raised) || 0;
      count += p.total_donation_count ?? 0;
    }
  }
  return { amount, count, synced };
}

const sortValue = (e: EventModel, key: SortKey): string | number => {
  switch (key) {
    case 'start_time':
      return new Date(e.start_time).getTime();
    case 'is_active':
      return e.is_active ? 1 : 0;
    case 'donation_pages':
      return e.donation_pages.length;
    case 'raised':
      return eventSyncedTotal(e).amount;
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
  // Bump on any event mutation (this tab or another) so the list — and the
  // Twitch-channel/connection state nested in it — refreshes within a frame
  // instead of waiting out the 5s poll.
  const [bump, setBump] = useState(0);
  useEffect(() => onEventChanged(() => setBump((b) => b + 1)), []);
  const { data: events } = usePolledQuery(obsApi.events, 5000, [bump]);
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
            <SortableTh label="Raised" sortKey="raised" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Status" sortKey="is_active" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleEvents.map((e) => {
            const raised = eventSyncedTotal(e);
            return editingId === e.id ? (
              <tr key={e.id}>
                <td colSpan={7}>
                  <EventForm
                    event={e}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                  <EventTwitchChannelsEditor event={e} />
                  <DonationPagesEditor event={e} />
                  <EventCharitiesEditor event={e} />
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
                  {raised.synced ? (
                    <span
                      title={`${raised.count} donations · synced page total${
                        e.donation_pages.some((p) => p.platform === 'justgiving')
                          ? ' (JustGiving)'
                          : ''
                      }`}
                    >
                      <strong>
                        {e.currency_symbol}
                        {raised.amount.toFixed(2)}
                      </strong>
                      <span className="text-white-50 small"> · {raised.count}</span>
                    </span>
                  ) : (
                    <span className="text-white-50 small">—</span>
                  )}
                </td>
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
            );
          })}
          {events && events.length === 0 && (
            <tr>
              <td colSpan={7} className="text-white-50 text-center py-4">
                No events yet — add one above.
              </td>
            </tr>
          )}
          {events && events.length > 0 && visibleEvents.length === 0 && (
            <tr>
              <td colSpan={7} className="text-white-50 text-center py-4">
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

  // JustGiving fetches by page short name and Tiltify by campaign id, both
  // stored in external_id — so it's required for those (optional for others).
  const needsExternalId = platform === 'justgiving' || platform === 'tiltify';
  const externalIdLabel =
    platform === 'justgiving'
      ? 'Page short name (required)'
      : platform === 'tiltify'
        ? 'Campaign ID (required)'
        : 'External id (optional)';
  const externalIdPlaceholder =
    platform === 'justgiving'
      ? 'e.g. zeldathonuk'
      : platform === 'tiltify'
        ? 'e.g. 12345 or campaign slug'
        : 'campaign id / slug';

  const handleSave = () => {
    if (!url.trim()) return;
    if (needsExternalId && !externalId.trim()) return;
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
        <label className="d-block small text-white-50">{externalIdLabel}</label>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          className="form-control form-control-sm"
          placeholder={externalIdPlaceholder}
        />
        {platform === 'justgiving' && (
          <span className="d-block text-white-50" style={{ fontSize: '0.7rem' }}>
            From the page URL: justgiving.com/<strong>page-short-name</strong>
          </span>
        )}
        {platform === 'tiltify' && (
          <span className="d-block text-white-50" style={{ fontSize: '0.7rem' }}>
            The Tiltify campaign id (from the campaign URL or API).
          </span>
        )}
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

// Per-page aggregate total for a JustGiving page. JustGiving stops exposing
// the itemized donation feed once a page is "Completed", but the page-details
// endpoint still reports the running total — so this lets the operator see (and
// refresh) what any past event raised, distinct from the itemized donations.
function JustGivingPageTotal({ page }: { page: DonationPage }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.syncDonationPageTotal(page.id);
      // Re-fetch the event so this row picks up the freshly-synced total.
      notifyEventChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const synced = page.total_synced_at !== null && page.total_raised !== null;
  const symbol =
    ({ GBP: '£', USD: '$', EUR: '€' } as Record<string, string>)[
      page.total_currency
    ] ?? (page.total_currency ? `${page.total_currency} ` : '£');

  return (
    <span className="d-inline-flex align-items-center gap-2 small">
      {synced ? (
        <span className="text-white-50">
          <strong className="text-white">
            {symbol}
            {Number(page.total_raised).toFixed(2)}
          </strong>{' '}
          · {page.total_donation_count ?? 0} donations
          {page.total_status ? ` · ${page.total_status}` : ''}
          {page.total_synced_at
            ? ` · synced ${new Date(page.total_synced_at).toLocaleString('en-GB')}`
            : ''}
        </span>
      ) : (
        <span className="text-white-50">total not synced</span>
      )}
      <button
        type="button"
        className="btn btn-sm btn-outline-light"
        onClick={() => void sync()}
        disabled={busy}
      >
        {busy ? 'Syncing…' : 'Sync total'}
      </button>
      {err && (
        <span className="badge bg-danger" title={err}>
          Error
        </span>
      )}
    </span>
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
                {p.platform === 'justgiving' && <JustGivingPageTotal page={p} />}
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

  // JustGiving fetches by page short name and Tiltify by campaign id, both
  // stored in external_id — so it's required for those (optional for others).
  const needsExternalId = platform === 'justgiving' || platform === 'tiltify';
  const externalIdLabel =
    platform === 'justgiving'
      ? 'Page short name (required)'
      : platform === 'tiltify'
        ? 'Campaign ID (required)'
        : 'External id (optional)';
  const externalIdPlaceholder =
    platform === 'justgiving'
      ? 'e.g. zeldathonuk'
      : platform === 'tiltify'
        ? 'e.g. 12345 or campaign slug'
        : 'campaign id / slug';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (needsExternalId && !externalId.trim()) {
      setErr(
        platform === 'tiltify'
          ? 'Tiltify pages need the campaign id in External id to fetch donations.'
          : 'JustGiving pages need the page short name in External id to fetch donations.',
      );
      return;
    }
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
        <label className="d-block small text-white-50">{externalIdLabel}</label>
        <input
          required={needsExternalId}
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          className="form-control form-control-sm"
          placeholder={externalIdPlaceholder}
        />
        {platform === 'justgiving' && (
          <span className="d-block text-white-50" style={{ fontSize: '0.7rem' }}>
            From the page URL: justgiving.com/<strong>page-short-name</strong>
          </span>
        )}
        {platform === 'tiltify' && (
          <span className="d-block text-white-50" style={{ fontSize: '0.7rem' }}>
            The Tiltify campaign id (from the campaign URL or API).
          </span>
        )}
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
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.user_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable (insecure context) — ignore */
    }
  };

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
      className="connect-modal__backdrop"
      onClick={onClose}
    >
      <div className="connect-modal__card" onClick={(e) => e.stopPropagation()}>
        <header className="connect-modal__head">
          <span className="connect-modal__glyph" aria-hidden="true">tv</span>
          <h5 className="connect-modal__title">Connect twitch.tv/{channel.login}</h5>
          <button
            type="button"
            className="connect-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="connect-modal__body">
          {phase === 'starting' && (
            <p className="connect-modal__status connect-modal__status--waiting">
              <span className="connect-modal__spinner" aria-hidden="true" />
              Starting…
            </p>
          )}

          {phase === 'waiting' && info && (
            <>
              <p className="connect-modal__lead">
                The broadcaster of <strong>{channel.login}</strong> authorises on
                their own device:
              </p>
              <ol className="connect-modal__steps">
                <li>
                  <span>
                    Open{' '}
                    <a
                      className="connect-modal__link"
                      href={info.verification_uri}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {info.verification_uri}
                    </a>
                  </span>
                </li>
                <li>
                  <span>
                    Enter this code:
                    <span className="connect-modal__code-row">
                      <code className="connect-modal__code">{info.user_code}</code>
                      <button
                        type="button"
                        className="connect-modal__copy"
                        onClick={copyCode}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </span>
                  </span>
                </li>
              </ol>
              <p className="connect-modal__status connect-modal__status--waiting">
                <span className="connect-modal__spinner" aria-hidden="true" />
                Waiting for authorisation… this updates automatically.
              </p>
            </>
          )}

          {phase === 'done' && (
            <p className="connect-modal__status connect-modal__status--done">
              ✓ Connected — you can close this.
            </p>
          )}

          {phase === 'error' && (
            <p className="connect-modal__status connect-modal__status--error">{msg}</p>
          )}
        </div>

        <footer className="connect-modal__foot">
          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
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

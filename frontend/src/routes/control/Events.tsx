import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  Charity,
  DonationPage,
  DonationPlatformKey,
  EventCharityLink,
  EventModel,
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

const DONATION_PLATFORMS: { value: DonationPlatformKey; label: string }[] = [
  { value: 'justgiving', label: 'JustGiving' },
  { value: 'tiltify', label: 'Tiltify' },
  { value: 'twitch', label: 'Twitch Charity' },
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
  const [twitchChannel, setTwitchChannel] = useState(event?.twitch_channel ?? 'zeldathonuk');
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
        twitch_channel: twitchChannel.trim().toLowerCase(),
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
      <div style={{ minWidth: 180 }}>
        <label className="d-block small text-white-50">Twitch channel</label>
        <div className="input-group input-group-sm">
          <span className="input-group-text">twitch.tv/</span>
          <input
            value={twitchChannel}
            onChange={(e) => setTwitchChannel(e.target.value)}
            className="form-control form-control-sm"
            placeholder="zeldathonuk"
            spellCheck={false}
            maxLength={50}
          />
        </div>
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

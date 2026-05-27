import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { DonationPage, DonationPlatformKey, EventModel } from '@/lib/obsApi';
import { api } from '@/lib/api';
import { notifyEventChanged } from '@/lib/eventBus';

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
                </td>
              </tr>
            ) : (
              <tr key={e.id}>
                <td>
                  {e.logo_url ? (
                    <img
                      src={e.logo_url}
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
                    {!e.is_active && (
                      <button
                        className="btn btn-sm btn-bloodmoon"
                        onClick={() => activate(e.id)}
                      >
                        Activate
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
          />
        </div>
        <div style={{ minWidth: 280, flex: 2 }}>
          <label className="d-block small text-white-50">Banner (wide poster)</label>
          <ImageDropzone
            value={bannerUrl}
            onChange={setBannerUrl}
            previewStyle={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4 }}
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

function ImageDropzone({
  value,
  onChange,
  previewStyle,
}: {
  value: string;
  onChange: (url: string) => void;
  previewStyle: React.CSSProperties;
}) {
  const inputId = `dz-${Math.random().toString(36).slice(2, 8)}`;
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? ''}/api/uploads/image/?folder=events`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: 'block',
          cursor: 'pointer',
          padding: '14px 16px',
          border: dragging
            ? '2px dashed #e71347'
            : '2px dashed rgba(255,255,255,0.2)',
          background: dragging
            ? 'rgba(231,19,71,0.12)'
            : 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          textAlign: 'center',
          transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        {uploading ? (
          <div className="small text-white-50">Uploading…</div>
        ) : value ? (
          <div className="d-flex align-items-center gap-3 justify-content-center flex-wrap">
            <img src={value} alt="" style={{ ...previewStyle, objectFit: 'cover' }} />
            <div className="small text-white-50">
              <div>Drop a new file to replace, or</div>
              <div>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-warning"
                  onClick={(ev) => {
                    ev.preventDefault();
                    onChange('');
                  }}
                >
                  remove image
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="small text-white-50">
            Drag & drop an image here, or click to browse
            <div style={{ opacity: 0.6 }}>PNG · JPG · GIF · WebP · SVG · max 10 MB</div>
          </div>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = '';
        }}
      />
      <div className="mt-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-control form-control-sm"
          placeholder="…or paste a URL"
        />
      </div>
      {err && <div className="text-danger small mt-1">{err}</div>}
    </div>
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

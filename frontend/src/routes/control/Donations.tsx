import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Donation, EventModel, MuteReason, MuteReasonChoice } from '@/lib/obsApi';
import { api } from '@/lib/api';
import { useResizableColumns, ResizeHandle } from './resizableColumns';

type SortKey = 'donated_at' | 'donor_name' | 'platform' | 'amount';
type SortDir = 'asc' | 'desc';

/** Character budget for the message column before truncation. Roughly
 *  a single line of the column at typical desktop widths — long
 *  enough that short donation messages render in full, short enough
 *  that pasted essays don't push every other row off-screen. The
 *  "Show more" toggle lets the operator open any row inline. */
const MESSAGE_TRUNCATE_LEN = 80;

/** Last-resort labels used before the /api/donation-mute-reasons/ poll
 *  resolves on first paint, or if the request fails. Kept in sync with
 *  `models.MuteReason.choices`; the live values supersede this list as
 *  soon as the fetch lands. */
const FALLBACK_MUTE_REASONS: MuteReasonChoice[] = [
  { value: '', label: '— not muted —' },
  { value: 'naughty_name', label: 'Inappropriate donor name' },
  { value: 'naughty_message', label: 'Inappropriate message text' },
  { value: 'naughty_image', label: 'Inappropriate donor image' },
  { value: 'already_announced', label: 'Already announced on stream' },
  { value: 'other', label: 'Other / manual' },
];

function labelForMuteReason(
  reason: MuteReason,
  choices: MuteReasonChoice[] | null | undefined,
): string {
  const list = choices ?? FALLBACK_MUTE_REASONS;
  const hit = list.find((c) => c.value === reason);
  return hit?.label ?? reason;
}

type ColumnKey = 'when' | 'donor' | 'platform' | 'amount' | 'message' | 'actions';

/** Default column widths (pixels). Operator drags from these as the
 *  starting point; persisted widths in localStorage win once set. */
const DEFAULT_COLUMN_WIDTHS_PX: Record<ColumnKey, number> = {
  when: 144,    // 9rem  — "27/05 18:30"
  donor: 192,   // 12rem — donor name + NOW READING pip
  platform: 144,// 9rem  — platform chip
  amount: 96,   // 6rem  — "£5.00"
  message: 480, // 30rem — fluid by nature; this is the starting width
  actions: 280, // ~17.5rem — Chest + Replay + Mute select + Delete
};

const COLUMN_WIDTH_STORAGE_KEY = 'control.donations.column-widths';

/** Compact "When" column rendering: "27/05 18:30" instead of the full
 *  "27/05/2026, 18:30:42" so the column stays narrow. Full timestamp
 *  surfaces via the cell's `title` attribute for hover detail. */
function fmtDonatedAt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Currency code → display symbol. Falls back to the code for
 *  anything unknown so the amount cell never goes blank. Keeping the
 *  amount glyph compact ("£5.00" vs "GBP 5.00") lets us shrink the
 *  Amount column from ~9rem to ~6rem. */
function currencySymbol(code: string): string {
  switch (code) {
    case 'GBP':
      return '£';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return `${code} `;
  }
}

const sortValue = (d: Donation, key: SortKey): string | number => {
  switch (key) {
    case 'donated_at':
      return new Date(d.donated_at).getTime();
    case 'amount':
      return Number(d.amount);
    case 'donor_name':
    case 'platform':
      return d[key].toLowerCase();
  }
};

const platforms: Array<{ value: string; label: string; color: string }> = [
  { value: 'justgiving', label: 'JustGiving', color: '#ad29b6' },
  { value: 'tiltify', label: 'Tiltify', color: '#232628' },
  { value: 'facebook', label: 'Facebook', color: '#3b5998' },
  { value: 'twitch', label: 'Twitch Charity', color: '#9146ff' },
  { value: 'paypal', label: 'PayPal', color: '#003087' },
  { value: 'direct', label: 'Direct / Cash', color: '#62182f' },
  { value: 'other', label: 'Other', color: '#444' },
];

export function DonationsControl() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: donations } = usePolledQuery(
    () => (event ? obsApi.donations(event.id) : Promise.resolve([])),
    3000,
  );
  const { data: totals } = usePolledQuery(
    () =>
      event
        ? obsApi.donationTotals(event.id)
        : Promise.resolve({ by_platform: [], grand_total: '0', donation_count: 0 }),
    3000,
  );
  // What /obs/tts is announcing right now. Poll fast — the operator's
  // primary reason for watching the highlight is to catch and mute a
  // bad donation mid-utterance, so latency matters.
  const { data: nowReading } = usePolledQuery(obsApi.ttsNowReading, 1500);
  const liveTtsId = nowReading?.donation_id ?? null;
  // Mute-reason dropdown options — source of truth is models.MuteReason
  // on the backend; refresh hourly so new reasons land without a
  // hard refresh.
  const { data: muteReasons } = usePolledQuery(obsApi.donationMuteReasons, 3_600_000);
  // Per-column widths, drag-resizable from the right edge of each
  // header. Persisted to localStorage so the operator's layout
  // survives reloads — pet peeve relief.
  const { widths: colWidths, startResize } = useResizableColumns(
    COLUMN_WIDTH_STORAGE_KEY,
    DEFAULT_COLUMN_WIDTHS_PX,
  );

  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('donated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  // Ids of donations whose message is currently expanded. Stored as a
  // Set so a row toggle is O(1) regardless of how many donations are
  // on screen, and so the expanded state survives re-renders from the
  // 3s donations poll.
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<number>>(
    () => new Set(),
  );
  const toggleMessageExpanded = (id: number) =>
    setExpandedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const visibleDonations = useMemo(() => {
    if (!donations) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? donations.filter(
          (d) =>
            d.donor_name.toLowerCase().includes(q) ||
            d.message.toLowerCase().includes(q) ||
            d.platform.toLowerCase().includes(q),
        )
      : donations;
    const sorted = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [donations, filter, sortKey, sortDir]);

  if (!event) {
    return (
      <div className="control-card">
        <h2>Donations</h2>
        <p className="text-warning">No active event. Set one to start tracking donations.</p>
      </div>
    );
  }

  return (
    <>
      <div className="control-card">
        <h2>Donations · totals</h2>
        <div className="row g-2 mt-2">
          <DonationKpi
            label="Grand total"
            value={`${event.currency_symbol}${Number(totals?.grand_total ?? 0).toFixed(2)}`}
            accent
          />
          <DonationKpi label="Count" value={String(totals?.donation_count ?? 0)} />
        </div>
        <div className="mt-4">
          <div className="small text-white-50 mb-1">Per platform</div>
          <table className="control-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Total</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              {(totals?.by_platform ?? []).map((row) => (
                <tr key={row.platform + row.currency}>
                  <td>
                    <PlatformChip value={row.platform} label={row.display_label} />
                  </td>
                  <td>
                    {row.currency} {Number(row.total).toFixed(2)}
                  </td>
                  <td>{row.count}</td>
                </tr>
              ))}
              {totals?.by_platform.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-white-50">
                    No donations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="control-card">
        <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <h2 className="m-0">Donations · list</h2>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by donor, message, platform…"
              className="form-control form-control-sm"
              style={{ width: 280 }}
            />
            {/* Bulk actions — event-scoped on the backend; UI
             *  double-confirms before firing so a stray click can't
             *  wipe or silence the operator's whole donation list. */}
            <BulkActions event={event} donations={donations ?? []} />
            {!adding && (
              <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
                + Add donation
              </button>
            )}
          </div>
        </header>

        {adding && (
          <AddDonationForm
            event={event}
            onCancel={() => setAdding(false)}
            onAdded={() => setAdding(false)}
          />
        )}

        {/* Horizontal scroll wrapper — the donation row now carries five
         *  data columns + an action column with three labelled buttons
         *  (Replay TTS / Mute / Delete), which together don't fit under
         *  ~1100px without ellipsising the message or stacking buttons.
         *  Scrolling preserves the dense data layout and avoids a mobile
         *  redesign of a control-panel-only page. */}
        <div className="control-table-scroll mt-3">
        <table className="control-table">
          <thead>
            <tr>
              {/* Every header is drag-resizable from its right edge;
               *  widths persist in localStorage via useResizableColumns
               *  so the operator's layout sticks across reloads. */}
              <SortableTh
                label="When"
                sortKey="donated_at"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                width={colWidths.when}
                onResizeStart={(e) => startResize('when', e)}
              />
              <SortableTh
                label="Donor"
                sortKey="donor_name"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                width={colWidths.donor}
                onResizeStart={(e) => startResize('donor', e)}
              />
              <SortableTh
                label="Platform"
                sortKey="platform"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                width={colWidths.platform}
                onResizeStart={(e) => startResize('platform', e)}
              />
              <SortableTh
                label="Amount"
                sortKey="amount"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                width={colWidths.amount}
                onResizeStart={(e) => startResize('amount', e)}
              />
              <th
                style={{
                  width: colWidths.message,
                  minWidth: colWidths.message,
                  position: 'relative',
                }}
              >
                Message
                <ResizeHandle onMouseDown={(e) => startResize('message', e)} />
              </th>
              <th
                style={{
                  width: colWidths.actions,
                  minWidth: colWidths.actions,
                  position: 'relative',
                }}
              >
                <ResizeHandle onMouseDown={(e) => startResize('actions', e)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleDonations.map((d) => (
              <tr
                key={d.id}
                className={d.id === liveTtsId ? 'donation-row-live' : undefined}
                title={
                  d.id === liveTtsId
                    ? 'Currently being announced on /obs/tts — mute to cancel mid-utterance'
                    : undefined
                }
              >
                <td
                  className="small text-white-50"
                  style={{ whiteSpace: 'nowrap' }}
                  title={new Date(d.donated_at).toLocaleString('en-GB')}
                >
                  {fmtDonatedAt(d.donated_at)}
                </td>
                <td>
                  {d.donor_name}
                  {d.id === liveTtsId && (
                    <span className="donation-now-reading-pip" aria-live="polite">
                      🔊 NOW READING
                    </span>
                  )}
                </td>
                <td>
                  <PlatformChip value={d.platform} />
                </td>
                <td
                  style={{ whiteSpace: 'nowrap', textAlign: 'right' }}
                  title={`${d.currency} ${Number(d.amount).toFixed(2)}`}
                >
                  <strong>
                    {currencySymbol(d.currency)}
                    {Number(d.amount).toFixed(2)}
                  </strong>
                </td>
                <td
                  className="text-white-50 donation-message-cell"
                  style={d.is_muted ? { opacity: 0.45, textDecoration: 'line-through' } : undefined}
                  title={
                    d.is_muted
                      ? `Muted (${labelForMuteReason(d.mute_reason, muteReasons)}) — suppressed in TTS and the omnibar`
                      : undefined
                  }
                >
                  <MessageText
                    message={d.message}
                    expanded={expandedMessageIds.has(d.id)}
                    onToggle={() => toggleMessageExpanded(d.id)}
                  />
                  {d.is_muted && (
                    <span className="donation-mute-reason-pip">
                      🔇 {labelForMuteReason(d.mute_reason, muteReasons)}
                    </span>
                  )}
                </td>
                <td>
                  <div className="donation-actions">
                    <button
                      className="btn btn-sm btn-outline-warning donation-action-btn"
                      aria-label="Retrigger the chest-announcer for this donation (unmutes first if needed)"
                      title={
                        d.is_muted
                          ? 'Chest replay — unmute first, then re-fire the chest-announcer card + fanfare'
                          : 'Chest replay — re-fire the chest-announcer card + fanfare'
                      }
                      onClick={async () => {
                        try {
                          // Unmute first if the donation has been
                          // muted — the chest-announcer skips muted
                          // donations at queue-entry and aborts ones
                          // muted mid-display, so replay would be a
                          // no-op without clearing the flag.
                          if (d.is_muted) {
                            await api(`/api/donations/${d.id}/`, {
                              method: 'PATCH',
                              body: { mute_reason: '' },
                            });
                          }
                          await obsApi.requestChestReplay(d.id);
                        } catch (e) {
                          alert(`Chest replay failed: ${(e as Error).message}`);
                        }
                      }}
                    >
                      📦
                    </button>
                    <button
                      className="btn btn-sm btn-outline-light donation-action-btn"
                      disabled={d.is_muted}
                      aria-label={
                        d.is_muted
                          ? 'Donation is muted — unmute first to replay'
                          : 'Re-announce this donation in the /obs/tts overlay'
                      }
                      title={
                        d.is_muted
                          ? 'Donation is muted — unmute first to replay'
                          : 'Replay TTS — re-announce in /obs/tts'
                      }
                      onClick={async () => {
                        try {
                          await obsApi.requestTtsReplay(d.id);
                        } catch (e) {
                          alert(`Replay failed: ${(e as Error).message}`);
                        }
                      }}
                    >
                      🔊
                    </button>
                    {/* Reason dropdown replaces the old two-state Mute
                     *  button. Choosing a non-empty reason mutes the
                     *  donation with that tag; choosing "— not muted —"
                     *  unmutes. The select renders the same width
                     *  whether muted or not so the action column
                     *  doesn't shift size as rows toggle. */}
                    <select
                      className={`form-select form-select-sm donation-mute-select${d.is_muted ? ' is-muted' : ''}`}
                      value={d.mute_reason}
                      title={
                        d.is_muted
                          ? 'Reason this donation is muted — change to reclassify or pick "— not muted —" to unmute'
                          : 'Mute this donation in TTS and the omnibar — pick a reason (profanity, repeat, etc.)'
                      }
                      onChange={async (e) => {
                        const next = e.target.value as Donation['mute_reason'];
                        try {
                          await api(`/api/donations/${d.id}/`, {
                            method: 'PATCH',
                            body: { mute_reason: next },
                          });
                        } catch (err) {
                          alert(`Mute change failed: ${(err as Error).message}`);
                        }
                      }}
                    >
                      {(muteReasons ?? FALLBACK_MUTE_REASONS).map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.value === '' ? '🔈 Not muted' : `🔇 ${r.label}`}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-sm btn-outline-danger donation-action-btn"
                      aria-label="Delete this donation"
                      title="Delete this donation"
                      onClick={async () => {
                        if (!confirm('Delete this donation?')) return;
                        await api(`/api/donations/${d.id}/`, { method: 'DELETE' });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {donations && donations.length === 0 && (
              <tr>
                <td colSpan={6} className="text-white-50 text-center py-4">
                  No donations yet — add the first one above.
                </td>
              </tr>
            )}
            {donations && donations.length > 0 && visibleDonations.length === 0 && (
              <tr>
                <td colSpan={6} className="text-white-50 text-center py-4">
                  No donations match “{filter}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

/** Bulk-action group in the donations header: Mute all + Delete all.
 *  Both scoped to the active event on the backend; the UI here adds
 *  a `confirm()` step (showing the donation count + event name) so a
 *  stray click can't wipe or silence everything. The buttons are
 *  greyed out + tooltipped when there's nothing to act on, so the
 *  operator gets an explanation rather than an inert mystery button. */
function BulkActions({
  event,
  donations,
}: {
  event: EventModel;
  donations: Donation[];
}) {
  const [busy, setBusy] = useState(false);
  const total = donations.length;
  const unmutedCount = donations.filter((d) => !d.is_muted).length;
  const mutedCount = total - unmutedCount;
  const eventLabel = event.name || `event #${event.id}`;

  const muteAll = async () => {
    if (unmutedCount === 0) return;
    if (
      !confirm(
        `Mute all ${unmutedCount} un-muted donation(s) for "${eventLabel}"?\n\n` +
          'They will be tagged "Already announced on stream" and skipped ' +
          'by /obs/tts and /obs/omnibar. Reversible per-row (or via this ' +
          'button by changing the default reason in code).',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await obsApi.muteAllDonations(event.id, 'already_announced');
    } catch (e) {
      alert(`Mute all failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  // Bulk-unmute uses the same endpoint with an empty reason — the
  // backend's mute_all view treats `reason === ''` as the unmute case,
  // clearing `mute_reason` on every donation for this event in one
  // SQL UPDATE (cheaper + less race-prone than N PATCH round-trips).
  const unmuteAll = async () => {
    if (mutedCount === 0) return;
    if (
      !confirm(
        `Unmute all ${mutedCount} muted donation(s) for "${eventLabel}"?\n\n` +
          'They will start announcing in /obs/tts and showing in the ' +
          'omnibar again on the next poll. /obs/chest-announcer will ' +
          'pick them up too once unmuted.',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await obsApi.muteAllDonations(event.id, '');
    } catch (e) {
      alert(`Unmute all failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    if (total === 0) return;
    // Double confirm — first asks intent, second forces the operator
    // to type the event name. Belt-and-braces because this is the
    // most destructive button on the control panel.
    if (
      !confirm(
        `Delete ALL ${total} donation(s) for "${eventLabel}"?\n\n` +
          'This cannot be undone. Totals will drop to zero immediately.',
      )
    ) {
      return;
    }
    const typed = prompt(
      `Type the event name exactly to confirm permanent deletion:\n\n${eventLabel}`,
    );
    if (typed !== eventLabel) {
      alert('Event name did not match — delete aborted.');
      return;
    }
    setBusy(true);
    try {
      const res = await obsApi.deleteAllDonations(event.id);
      alert(`Deleted ${res.deleted} donation row(s).`);
    } catch (e) {
      alert(`Delete all failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-warning"
        disabled={busy || unmutedCount === 0}
        title={
          unmutedCount === 0
            ? 'No un-muted donations to mute'
            : `Mute all ${unmutedCount} un-muted donation(s) for this event`
        }
        onClick={muteAll}
      >
        🔇 Mute all
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-light"
        disabled={busy || mutedCount === 0}
        title={
          mutedCount === 0
            ? 'No muted donations to unmute'
            : `Unmute all ${mutedCount} muted donation(s) for this event`
        }
        onClick={unmuteAll}
      >
        🔈 Unmute all
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        disabled={busy || total === 0}
        title={
          total === 0
            ? 'No donations to delete'
            : `Delete all ${total} donation(s) for this event`
        }
        onClick={deleteAll}
      >
        ✕ Delete all
      </button>
    </>
  );
}

/** Message cell content: shows the full text when expanded, otherwise
 *  truncates to `MESSAGE_TRUNCATE_LEN` chars and appends a "Show more"
 *  toggle. Messages shorter than the threshold render verbatim with no
 *  toggle (the operator never needs to expand them). The toggle button
 *  uses `type="button"` so it can't accidentally submit a parent form,
 *  and lives inline so the row height only changes when content
 *  actually requires it. */
function MessageText({
  message,
  expanded,
  onToggle,
}: {
  message: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!message) return null;
  if (message.length <= MESSAGE_TRUNCATE_LEN) return <>{message}</>;
  // Cut on a word boundary when possible so the truncation reads cleanly
  // ("Here is a really…") rather than splitting words mid-letter
  // ("Here is a real…ly long…"). Falls back to a hard cut at the limit
  // if no whitespace exists in the budget (e.g. pasted URLs).
  const hardCut = message.slice(0, MESSAGE_TRUNCATE_LEN);
  const lastSpace = hardCut.lastIndexOf(' ');
  const shown = expanded
    ? message
    : (lastSpace > MESSAGE_TRUNCATE_LEN / 2 ? hardCut.slice(0, lastSpace) : hardCut) + '…';
  return (
    <>
      {shown}{' '}
      <button
        type="button"
        className="btn btn-link btn-sm donation-message-toggle"
        onClick={onToggle}
        title={expanded ? 'Collapse this message' : 'Show the full message'}
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </>
  );
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onClick,
  width,
  onResizeStart,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  /** Explicit column width in px — driven by the resizable-columns
   *  hook so the operator's drags persist across reloads. */
  width: number;
  /** Mouse-down handler for the resize handle; wires into
   *  `useResizableColumns().startResize(key, e)`. */
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const active = current === sortKey;
  const indicator = active ? (dir === 'asc' ? '▲' : '▼') : '';
  return (
    <th
      onClick={() => onClick(sortKey)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        width,
        minWidth: width,
        // Needed so the absolutely-positioned ResizeHandle anchors
        // to the th's right edge rather than the table.
        position: 'relative',
      }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 1 : 0.35 }}>
        {indicator || '↕'}
      </span>
      <ResizeHandle onMouseDown={onResizeStart} />
    </th>
  );
}

function PlatformChip({ value, label }: { value: string; label?: string }) {
  const p = platforms.find((x) => x.value === value);
  return (
    <span
      style={{
        background: p?.color ?? '#444',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {label ?? p?.label ?? value}
    </span>
  );
}

function DonationKpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="col-6 col-md-3">
      <div
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '10px 14px',
          height: '100%',
        }}
      >
        <div
          className="small text-white-50 text-uppercase"
          style={{ letterSpacing: 0.5 }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: accent ? 28 : 22,
            fontWeight: 700,
            lineHeight: 1.1,
            ...(accent && {
              fontFamily: "'Bungee', sans-serif",
              background: 'linear-gradient(45deg, #e71347, #da4471, #e7364b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }),
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function AddDonationForm({
  event,
  onCancel,
  onAdded,
}: {
  event: EventModel;
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [platform, setPlatform] = useState('justgiving');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [message, setMessage] = useState('');
  const [giftAid, setGiftAid] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api('/api/donations/', {
        method: 'POST',
        body: {
          event: event.id,
          platform,
          donor_name: donorName || 'Anonymous',
          amount,
          currency,
          message,
          gift_aid_amount: giftAid ? giftAid : null,
        },
      });
      onAdded();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 d-flex gap-2 flex-wrap align-items-end">
      <div>
        <label className="d-block small text-white-50">Platform</label>
        <select
          className="form-select form-select-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          {platforms.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="d-block small text-white-50">Donor name</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Anonymous"
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Amount</label>
        <input
          type="number"
          step="0.01"
          required
          className="form-control form-control-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: 110 }}
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Currency</label>
        <input
          type="text"
          maxLength={3}
          className="form-control form-control-sm"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          style={{ width: 80 }}
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Gift Aid</label>
        <input
          type="number"
          step="0.01"
          className="form-control form-control-sm"
          value={giftAid}
          onChange={(e) => setGiftAid(e.target.value)}
          placeholder="0.00"
          style={{ width: 110 }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <label className="d-block small text-white-50">Message</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        Save
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
      {err && <div className="text-danger w-100 mt-2">{err}</div>}
    </form>
  );
}

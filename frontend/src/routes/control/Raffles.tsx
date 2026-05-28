import { useMemo, useState, type CSSProperties } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  Raffle,
  RaffleConditionTypeKey,
  RaffleDeliveryMethodKey,
  RaffleFulfillmentKey,
  RaffleWinner,
  ScheduleEntry,
} from '@/lib/obsApi';
import { ImageDropzone } from '@/components/ImageDropzone';

const DELIVERY_LABELS: Record<RaffleDeliveryMethodKey, string> = {
  physical: 'Physical (postal)',
  email: 'Email',
  twitch: 'Twitch whisper',
  discord: 'Discord',
  code: 'Unlock code / digital',
  other: 'Other',
};
const DELIVERY_KEYS = Object.keys(DELIVERY_LABELS) as RaffleDeliveryMethodKey[];

const CONDITION_LABELS: Record<RaffleConditionTypeKey, string> = {
  manual: 'Manual (operator opens/closes)',
  whole_event: 'Whole event',
  schedule_entry: 'While a schedule entry is playing',
  date_range: 'Between two dates/times',
};
const CONDITION_KEYS = Object.keys(CONDITION_LABELS) as RaffleConditionTypeKey[];

const FULFILLMENT_LABELS: Record<RaffleFulfillmentKey, string> = {
  pending: 'Pending contact',
  contacted: 'Contacted',
  sent: 'Sent / shipped',
  delivered: 'Delivered',
  forfeited: 'Forfeited / redraw',
};
const FULFILLMENT_KEYS = Object.keys(FULFILLMENT_LABELS) as RaffleFulfillmentKey[];

const childFormStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 6,
};

/** ISO string → value for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** datetime-local value → ISO string (or null when empty). */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function RafflesControl() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: raffles } = usePolledQuery(
    () => (event ? obsApi.raffles({ eventId: event.id }) : Promise.resolve([] as Raffle[])),
    5000,
    [event?.id],
  );
  const { data: schedule } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([] as ScheduleEntry[])),
    15_000,
    [event?.id],
  );

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const symbol = event?.currency_symbol || '£';

  // The raffle currently being edited. The edit form renders in a plain
  // block above the table (same DOM context as the add form) rather than
  // inside a colSpan'd <td> — a textarea's resize grip doesn't render
  // inside a table cell, so inline-in-row editing broke the description box.
  const editingRaffle =
    editingId != null ? raffles?.find((r) => r.id === editingId) ?? null : null;

  const visible = useMemo(() => {
    if (!raffles) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? raffles.filter((r) => r.name.toLowerCase().includes(q))
      : raffles;
    return [...filtered].sort((a, b) => a.order - b.order || a.id - b.id);
  }, [raffles, filter]);

  const remove = async (r: Raffle) => {
    if (!confirm(`Delete "${r.name}"? Its winners + fulfillment records will be removed too.`)) {
      return;
    }
    try {
      await obsApi.deleteRaffle(r.id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const runAction = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (!event) {
    return (
      <div className="control-card">
        <h2 className="m-0">Raffles</h2>
        <p className="text-white-50 mt-3">
          No active event. Activate an event in <code>/control/events</code> to manage
          its raffles.
        </p>
      </div>
    );
  }

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h2 className="m-0">Raffles</h2>
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
              + Add raffle
            </button>
          )}
        </div>
      </header>

      <p className="small text-white-50 mt-2 mb-0">
        Entrants are donors during the open window; draw odds are weighted by donation
        amount. Winner contact details are PII — this page must stay behind the control
        gate.
      </p>

      {adding && (
        <div className="mt-3">
          <RaffleForm
            eventId={event.id}
            schedule={schedule ?? []}
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        </div>
      )}

      {editingRaffle && (
        <div className="mt-3">
          <RaffleForm
            eventId={event.id}
            raffle={editingRaffle}
            schedule={schedule ?? []}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
          <WinnersPanel raffle={editingRaffle} />
        </div>
      )}

      {err && <p className="text-danger mt-2">{err}</p>}

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th style={{ width: 56 }}></th>
            <th>Name</th>
            <th>Delivery</th>
            <th>Condition</th>
            <th>Entries</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
              <tr
                key={r.id}
                style={
                  editingId === r.id
                    ? { background: 'rgba(255,255,255,0.06)' }
                    : undefined
                }
              >
                <td>
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      width={44}
                      height={44}
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      aria-hidden
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  )}
                </td>
                <td>
                  <strong>{r.name}</strong>
                  {r.quantity > 1 && (
                    <span className="small text-white-50 ms-2">×{r.quantity}</span>
                  )}
                </td>
                <td className="small text-white-50">
                  {DELIVERY_LABELS[r.delivery_method]}
                </td>
                <td className="small text-white-50">
                  {CONDITION_LABELS[r.condition_type]}
                </td>
                <td>
                  <span title={`${symbol}${r.total_weight} in the pot`}>
                    {r.entrant_count}
                  </span>
                </td>
                <td>
                  <RaffleStatusBadge raffle={r} />
                </td>
                <td>
                  <div className="control-btn-row">
                    {!r.is_open && r.status !== 'drawn' && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => runAction(() => obsApi.openRaffle(r.id))}
                      >
                        Open
                      </button>
                    )}
                    {r.is_open && (
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => runAction(() => obsApi.closeRaffle(r.id))}
                      >
                        Close
                      </button>
                    )}
                    {r.status !== 'drawn' ? (
                      <button
                        className="btn btn-sm btn-bloodmoon"
                        disabled={r.entrant_count === 0}
                        title={r.entrant_count === 0 ? 'No entrants yet' : 'Draw winners'}
                        onClick={() => {
                          if (confirm(`Draw ${r.quantity} winner(s) for "${r.name}"?`)) {
                            runAction(() => obsApi.drawRaffle(r.id));
                          }
                        }}
                      >
                        Draw
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => {
                          if (confirm(`Reset "${r.name}"? This deletes its winners.`)) {
                            runAction(() => obsApi.resetRaffle(r.id));
                          }
                        }}
                      >
                        Reset
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => {
                        setAdding(false);
                        setEditingId(editingId === r.id ? null : r.id);
                      }}
                    >
                      {editingId === r.id ? 'Close' : 'Edit'}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => remove(r)}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
          ))}
          {raffles && raffles.length === 0 && (
            <tr>
              <td colSpan={7} className="text-white-50 text-center py-4">
                No raffles yet — add one above.
              </td>
            </tr>
          )}
          {raffles && raffles.length > 0 && visible.length === 0 && (
            <tr>
              <td colSpan={7} className="text-white-50 text-center py-4">
                No raffles match “{filter}”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RaffleStatusBadge({ raffle }: { raffle: Raffle }) {
  if (raffle.status === 'drawn') {
    return <span className="badge bg-secondary">drawn</span>;
  }
  if (raffle.is_open) {
    return <span className="badge bg-success">open</span>;
  }
  if (raffle.status === 'closed') {
    return <span className="badge bg-warning text-dark">closed</span>;
  }
  return <span className="text-white-50 small">{raffle.status}</span>;
}

// ── Form ─────────────────────────────────────────────────────────────────

function RaffleForm({
  eventId,
  raffle,
  schedule,
  onCancel,
  onSaved,
}: {
  eventId: number;
  raffle?: Raffle;
  schedule: ScheduleEntry[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = raffle !== undefined;
  const [name, setName] = useState(raffle?.name ?? '');
  const [description, setDescription] = useState(raffle?.description ?? '');
  const [imageUrl, setImageUrl] = useState(raffle?.image_url ?? '');
  const [deliveryMethod, setDeliveryMethod] = useState<RaffleDeliveryMethodKey>(
    raffle?.delivery_method ?? 'physical',
  );
  const [quantity, setQuantity] = useState(raffle?.quantity ?? 1);
  const [minAmount, setMinAmount] = useState(raffle?.min_amount ?? '0');
  const [conditionType, setConditionType] = useState<RaffleConditionTypeKey>(
    raffle?.condition_type ?? 'manual',
  );
  const [scheduleEntry, setScheduleEntry] = useState<number | null>(
    raffle?.schedule_entry ?? null,
  );
  const [windowStart, setWindowStart] = useState(toLocalInput(raffle?.window_start ?? null));
  const [windowEnd, setWindowEnd] = useState(toLocalInput(raffle?.window_end ?? null));
  const [isActive, setIsActive] = useState(raffle?.is_active ?? true);
  const [order, setOrder] = useState(raffle?.order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        event: eventId,
        name: name.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        delivery_method: deliveryMethod,
        quantity,
        min_amount: String(minAmount).trim() || '0',
        condition_type: conditionType,
        schedule_entry: conditionType === 'schedule_entry' ? scheduleEntry : null,
        window_start: conditionType === 'date_range' ? fromLocalInput(windowStart) : null,
        window_end: conditionType === 'date_range' ? fromLocalInput(windowEnd) : null,
        is_active: isActive,
        order,
      };
      if (isEdit) {
        await obsApi.updateRaffle(raffle.id, body);
      } else {
        await obsApi.createRaffle(body);
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const games = schedule
    .filter((s) => s.parent_entry == null)
    .sort((a, b) => a.order - b.order);

  return (
    <form
      onSubmit={submit}
      className="p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <header className="mb-3">
        <strong>{isEdit ? `Edit ${raffle.name}` : 'Add raffle'}</strong>
      </header>

      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 240, flex: 2 }}>
          <label className="d-block small text-white-50">Prize name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="d-block small text-white-50">Delivery method</label>
          <select
            className="form-select form-select-sm"
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value as RaffleDeliveryMethodKey)}
          >
            {DELIVERY_KEYS.map((k) => (
              <option key={k} value={k}>
                {DELIVERY_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 100 }}>
          <label className="d-block small text-white-50">Winners</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="form-control form-control-sm"
            style={{ width: 90 }}
          />
        </div>
        <div style={{ minWidth: 120 }}>
          <label className="d-block small text-white-50">Min donation</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 80 }}>
          <label className="d-block small text-white-50">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="form-control form-control-sm"
            style={{ width: 80 }}
          />
        </div>
        <div className="form-check mb-1">
          <input
            id={`raffle-active-${raffle?.id ?? 'new'}`}
            type="checkbox"
            className="form-check-input"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor={`raffle-active-${raffle?.id ?? 'new'}`}
            className="form-check-label small"
          >
            Active
          </label>
        </div>
      </div>

      <div className="mt-3 d-flex gap-3 flex-wrap">
        <div style={{ minWidth: 240, flex: 1 }}>
          <label className="d-block small text-white-50">Prize image</label>
          <ImageDropzone
            value={imageUrl}
            onChange={setImageUrl}
            previewStyle={{ maxWidth: 160, maxHeight: 120, borderRadius: 6 }}
            folder="raffles"
          />
        </div>
        <div style={{ flex: 2, minWidth: 320 }}>
          <label className="d-block small text-white-50">
            Description (HTML allowed — inline links)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control form-control-sm"
            rows={4}
            style={{ resize: 'vertical', minHeight: '12rem' }}
            placeholder='e.g. A 3D-printed Master Sword — donate while open to enter!'
          />
        </div>
      </div>

      <div className="mt-3 d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 280 }}>
          <label className="d-block small text-white-50">Availability condition</label>
          <select
            className="form-select form-select-sm"
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value as RaffleConditionTypeKey)}
          >
            {CONDITION_KEYS.map((k) => (
              <option key={k} value={k}>
                {CONDITION_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {conditionType === 'schedule_entry' && (
          <div style={{ minWidth: 280, flex: 1 }}>
            <label className="d-block small text-white-50">Schedule entry</label>
            <select
              className="form-select form-select-sm"
              value={scheduleEntry ?? ''}
              onChange={(e) =>
                setScheduleEntry(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— select —</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.display_title}
                </option>
              ))}
            </select>
          </div>
        )}

        {conditionType === 'date_range' && (
          <>
            <div style={{ minWidth: 220 }}>
              <label className="d-block small text-white-50">Opens</label>
              <input
                type="datetime-local"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
            <div style={{ minWidth: 220 }}>
              <label className="d-block small text-white-50">Closes</label>
              <input
                type="datetime-local"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="form-control form-control-sm"
              />
            </div>
          </>
        )}
      </div>

      {conditionType === 'manual' && (
        <p className="small text-white-50 mt-2 mb-0">
          Manual raffles stay closed until you press <strong>Open</strong> in the list,
          and freeze when you <strong>Close</strong> or <strong>Draw</strong>.
        </p>
      )}

      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Save'}
        </button>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {err && <div className="text-danger mt-2 small">{err}</div>}
    </form>
  );
}

// ── Winners (PII — fulfillment trail) ──────────────────────────────────────

function WinnersPanel({ raffle }: { raffle: Raffle }) {
  const { data: winners } = usePolledQuery(
    () => obsApi.raffleWinners({ raffleId: raffle.id }),
    5000,
    [raffle.id],
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
      <header className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
        <strong>Winners &amp; fulfillment</strong>
        <span className="small text-white-50">
          Contact details are PII — handle per your privacy policy.
        </span>
      </header>
      {!winners || winners.length === 0 ? (
        <p className="text-white-50 small m-0">
          No winners drawn yet. Use <strong>Draw</strong> in the list once the raffle has
          entrants.
        </p>
      ) : (
        <ul className="list-unstyled m-0 d-flex flex-column gap-2">
          {winners.map((w) => (
            <WinnerRow key={w.id} winner={w} deliveryMethod={raffle.delivery_method} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WinnerRow({
  winner,
  deliveryMethod,
}: {
  winner: RaffleWinner;
  deliveryMethod: RaffleDeliveryMethodKey;
}) {
  const [contactInfo, setContactInfo] = useState(winner.contact_info);
  const [deliveryCode, setDeliveryCode] = useState(winner.delivery_code);
  const [status, setStatus] = useState<RaffleFulfillmentKey>(winner.fulfillment_status);
  const [notes, setNotes] = useState(winner.notes);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    setBusy(true);
    setSaved(false);
    try {
      await obsApi.updateRaffleWinner(winner.id, {
        contact_info: contactInfo,
        delivery_code: deliveryCode,
        fulfillment_status: status,
        notes,
      });
      setSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const showCode = deliveryMethod === 'code';
  const contactLabel = deliveryMethod === 'physical' ? 'Postal address' : 'Contact (email / handle)';

  return (
    <li className="p-2" style={childFormStyle}>
      <div className="d-flex gap-2 flex-wrap align-items-center mb-2">
        <strong style={{ minWidth: 160 }}>{winner.donor_name}</strong>
        <select
          className="form-select form-select-sm"
          style={{ width: 180 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as RaffleFulfillmentKey)}
        >
          {FULFILLMENT_KEYS.map((k) => (
            <option key={k} value={k}>
              {FULFILLMENT_LABELS[k]}
            </option>
          ))}
        </select>
        <span className="small text-white-50">
          drawn {new Date(winner.drawn_at).toLocaleString()}
        </span>
      </div>
      <div className="d-flex gap-2 flex-wrap">
        <div style={{ minWidth: 280, flex: 2 }}>
          <label className="d-block small text-white-50">{contactLabel}</label>
          <textarea
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="form-control form-control-sm"
            rows={2}
          />
        </div>
        {showCode && (
          <div style={{ minWidth: 200, flex: 1 }}>
            <label className="d-block small text-white-50">Unlock code</label>
            <input
              value={deliveryCode}
              onChange={(e) => setDeliveryCode(e.target.value)}
              className="form-control form-control-sm"
            />
          </div>
        )}
        <div style={{ minWidth: 200, flex: 1 }}>
          <label className="d-block small text-white-50">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
      </div>
      <div className="d-flex gap-2 mt-2 align-items-center">
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          onClick={save}
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="small text-success">Saved ✓</span>}
        {err && <span className="small text-danger">{err}</span>}
      </div>
    </li>
  );
}

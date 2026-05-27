import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Donation, EventModel } from '@/lib/obsApi';
import { api } from '@/lib/api';

type SortKey = 'donated_at' | 'donor_name' | 'platform' | 'amount';
type SortDir = 'asc' | 'desc';

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

  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('donated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
              <SortableTh
                label="When"
                sortKey="donated_at"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              <SortableTh
                label="Donor"
                sortKey="donor_name"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              <SortableTh
                label="Platform"
                sortKey="platform"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                minWidth={220}
              />
              <SortableTh
                label="Amount"
                sortKey="amount"
                current={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              <th>Message</th>
              <th></th>
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
                <td className="small text-white-50">
                  {new Date(d.donated_at).toLocaleString('en-GB')}
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
                <td>
                  <strong>
                    {d.currency} {Number(d.amount).toFixed(2)}
                  </strong>
                </td>
                <td
                  className="text-white-50"
                  style={d.is_muted ? { opacity: 0.45, textDecoration: 'line-through' } : undefined}
                  title={d.is_muted ? 'Muted — this message is suppressed in TTS and the omnibar' : undefined}
                >
                  {d.message}
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline-light"
                      disabled={d.is_muted}
                      title={
                        d.is_muted
                          ? 'Donation is muted — unmute first to replay'
                          : 'Re-announce this donation in the /obs/tts overlay'
                      }
                      onClick={async () => {
                        try {
                          await obsApi.requestTtsReplay(d.id);
                        } catch (e) {
                          alert(`Replay failed: ${(e as Error).message}`);
                        }
                      }}
                    >
                      🔊 Replay TTS
                    </button>
                    <button
                      className={`btn btn-sm ${d.is_muted ? 'btn-warning' : 'btn-outline-light'}`}
                      title={
                        d.is_muted
                          ? 'Unmute — let TTS and omnibar announce this donation again'
                          : 'Mute — skip this donation in TTS and the omnibar (profanity, repeats, etc.)'
                      }
                      onClick={async () => {
                        try {
                          await api(`/api/donations/${d.id}/`, {
                            method: 'PATCH',
                            body: { is_muted: !d.is_muted },
                          });
                        } catch (e) {
                          alert(`Mute toggle failed: ${(e as Error).message}`);
                        }
                      }}
                    >
                      {d.is_muted ? '🔈 Unmute' : '🔇 Mute'}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Delete this donation"
                      onClick={async () => {
                        if (!confirm('Delete this donation?')) return;
                        await api(`/api/donations/${d.id}/`, { method: 'DELETE' });
                      }}
                    >
                      ✕ Delete
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

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onClick,
  minWidth,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  minWidth?: number;
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
        minWidth,
      }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 1 : 0.35 }}>
        {indicator || '↕'}
      </span>
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

import { useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { EventModel } from '@/lib/obsApi';
import { api } from '@/lib/api';

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

  const [adding, setAdding] = useState(false);

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
        <div className="d-flex flex-wrap gap-3 align-items-baseline">
          <div>
            <div className="small text-white-50">Grand total</div>
            <div
              style={{
                fontFamily: "'Bungee', sans-serif",
                fontSize: '2.5rem',
                background: 'linear-gradient(45deg, #e71347, #da4471, #e7364b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              £{totals?.grand_total ?? '0.00'}
            </div>
          </div>
          <div>
            <div className="small text-white-50">Count</div>
            <div style={{ fontSize: '1.5rem' }}>{totals?.donation_count ?? 0}</div>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
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
                      <PlatformChip value={row.platform} />
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
      </div>

      <div className="control-card">
        <header className="d-flex justify-content-between align-items-baseline">
          <h2 className="m-0">Donations · list</h2>
          {!adding && (
            <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
              + Add donation
            </button>
          )}
        </header>

        {adding && (
          <AddDonationForm
            event={event}
            onCancel={() => setAdding(false)}
            onAdded={() => setAdding(false)}
          />
        )}

        <table className="control-table mt-3">
          <thead>
            <tr>
              <th>When</th>
              <th>Donor</th>
              <th>Platform</th>
              <th>Amount</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {donations?.map((d) => (
              <tr key={d.id}>
                <td className="small text-white-50">
                  {new Date(d.donated_at).toLocaleString('en-GB')}
                </td>
                <td>{d.donor_name}</td>
                <td>
                  <PlatformChip value={d.platform} />
                </td>
                <td>
                  <strong>
                    {d.currency} {Number(d.amount).toFixed(2)}
                  </strong>
                </td>
                <td className="text-white-50">{d.message}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={async () => {
                      if (!confirm('Delete this donation?')) return;
                      await api(`/api/donations/${d.id}/`, { method: 'DELETE' });
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {donations?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-white-50 text-center py-4">
                  No donations yet — add the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PlatformChip({ value }: { value: string }) {
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
      }}
    >
      {p?.label ?? value}
    </span>
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

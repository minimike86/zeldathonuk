import { useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';

export function BrbControl() {
  const { data: brb } = usePolledQuery(obsApi.currentBrb, 2000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('15');
  const [message, setMessage] = useState('Back soon!');

  const startBreak = async () => {
    setErr(null);
    setBusy(true);
    try {
      // Deactivate any existing brb timer first.
      if (brb) {
        await obsApi.updateBrb(brb.id, { is_active: false });
      }
      const target = new Date(Date.now() + Number(minutes) * 60_000);
      await obsApi.setBrb({
        target_time: target.toISOString(),
        message,
        is_active: true,
      });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const endBreak = async () => {
    if (!brb) return;
    setBusy(true);
    try {
      await obsApi.updateBrb(brb.id, { is_active: false });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="control-card">
      <h2>BRB countdown</h2>
      <p>
        Sets the "back at..." overlay shown at <code>/obs/brb</code>. The
        overlay polls every 2s and updates the countdown live.
      </p>

      {brb && (
        <div
          className="mt-3 p-3"
          style={{
            background: 'rgba(231,19,71,0.15)',
            border: '1px solid #b92753',
            borderRadius: 6,
          }}
        >
          <strong>Active</strong>
          <br />
          Returns at:{' '}
          <strong>{new Date(brb.target_time).toLocaleTimeString('en-GB')}</strong>
          <br />
          Message: "{brb.message}"
          <div className="mt-2">
            <button className="btn btn-sm btn-outline-light" onClick={endBreak} disabled={busy}>
              End break now
            </button>
          </div>
        </div>
      )}

      <form
        className="mt-4 d-flex gap-2 flex-wrap align-items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void startBreak();
        }}
      >
        <div>
          <label className="d-block small text-white-50">Duration (minutes)</label>
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: 120 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label className="d-block small text-white-50">Message</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-control form-control-sm"
            placeholder="Back soon!"
          />
        </div>
        <button type="submit" className="btn btn-bloodmoon" disabled={busy}>
          Start break
        </button>
      </form>

      {err && <p className="text-danger mt-3">{err}</p>}
    </div>
  );
}

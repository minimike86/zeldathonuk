import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import './brb.css';

/**
 * Be-Right-Back overlay. Polls the BRB endpoint every 2s for the current target
 * time, counts down to it, and shows the configured message.
 */
export function Brb() {
  const { data: brb } = usePolledQuery(obsApi.currentBrb, 2000);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  let remaining = 0;
  if (brb?.target_time) {
    remaining = Math.max(0, Math.floor((Date.parse(brb.target_time) - now) / 1000));
  }

  return (
    <div className="brb-stage">
      <div className="brb-content">
        <h1 className="brb-title">BE RIGHT BACK</h1>
        <div className="brb-clock">{formatHms(remaining)}</div>
        <p className="brb-message">{brb?.message || 'Back soon!'}</p>
      </div>
    </div>
  );
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

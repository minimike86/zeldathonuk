import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { playFanfare } from '@/routes/obs/fanfare';

/**
 * /control/chest-announcer — operator surface for the donation chest
 * overlay at /obs/chest-announcer.
 *
 * Audio behaviour is persisted on the backend (singleton
 * ChestAnnouncerSettings row) rather than carried in a URL query
 * string, so flipping the toggle here takes effect on every running
 * OBS browser source within one settings-poll cycle (5 s).
 *
 * Also exposes a one-click `Test fanfare` button so the operator can
 * audition the sound without waiting for a real donation.
 */
export function ChestAnnouncerControl() {
  const { data: settings } = usePolledQuery(
    obsApi.chestAnnouncerSettings,
    5000,
  );

  // Local override so the toggle responds instantly while the PATCH is
  // in flight (and on the next poll for the rest of the page). Mirrors
  // the server value when fresh data lands.
  const [override, setOverride] = useState<boolean | null>(null);
  const lastUpdatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!settings) return;
    if (settings.updated_at !== lastUpdatedRef.current) {
      lastUpdatedRef.current = settings.updated_at;
      setOverride(null);
    }
  }, [settings]);

  const audioEnabled =
    override ?? settings?.audio_enabled ?? false;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setAudioEnabled = async (next: boolean) => {
    setOverride(next);
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateChestAnnouncerSettings({ audio_enabled: next });
    } catch (e) {
      setErr((e as Error).message);
      setOverride(null);
    } finally {
      setBusy(false);
    }
  };

  const sourceUrl = `${window.location.origin}/obs/chest-announcer`;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section className="control-card">
        <h2>Chest announcer</h2>
        <p className="text-white-50">
          Transparent OBS browser source that animates a pixel hero
          walking to a chest and pulling each incoming donation out as
          a card with the donor name + amount, then confetti. Scales to
          whatever rect you give it in OBS — drop it over the 3DS
          ad-panel, the full bottom strip, or the entire stage.
        </p>
        <p className="text-white-50">
          The omnibar (<code>/obs/omnibar</code>) already announces
          donations via TTS. Pair the two by leaving audio off here so
          this overlay stays silent. Turn it on when this is the only
          donation surface in the scene or you want the extra audio
          celebration.
        </p>
      </section>

      <section className="control-card">
        <h2>Audio</h2>
        <div className="control-btn-row" style={{ alignItems: 'center', gap: '1rem' }}>
          <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => void setAudioEnabled(e.target.checked)}
              disabled={busy || !settings}
              style={{ width: 20, height: 20 }}
            />
            <span>
              <strong>Play fanfare on each donation card reveal</strong>
              <br />
              <small className="text-white-50">
                Short ascending arpeggio (~700 ms, square wave). Polled
                every 5 s — changes propagate to every running OBS
                browser source without a refresh.
              </small>
            </span>
          </label>
          <button
            type="button"
            className="btn btn-bloodmoon"
            onClick={() => playFanfare()}
          >
            Test fanfare
          </button>
        </div>
        {err && <div className="text-danger small mt-2">{err}</div>}
        {settings && (
          <div className="small text-white-50 mt-2">
            Last changed:{' '}
            {new Date(settings.updated_at).toLocaleTimeString('en-GB')}
          </div>
        )}
      </section>

      <section className="control-card">
        <h2>Source URL</h2>
        <p className="text-white-50">
          Same URL whether audio is on or off — the setting lives on
          the backend, so you don't need to maintain different URLs
          per scene.
        </p>
        <code className="d-block small text-warning mb-2 text-break">{sourceUrl}</code>
        <div className="control-btn-row">
          <Link
            to="/obs/chest-announcer"
            className="btn btn-sm btn-bloodmoon"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open preview
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => void navigator.clipboard.writeText(sourceUrl)}
          >
            Copy URL
          </button>
        </div>
      </section>

      <section className="control-card">
        <h2>Notes</h2>
        <ul className="text-white-50" style={{ paddingLeft: '1.2rem', margin: 0 }}>
          <li>
            Cold-boot suppression is on: existing donations are marked
            "already seen" the first time the route loads, so reloading
            mid-stream doesn't replay the queue.
          </li>
          <li>
            Hero sprites default to inline-SVG placeholders. To swap in
            real character art, run{' '}
            <code>python frontend/tools/build-chest-sprites.py --with-hero</code>{' '}
            and flip <code>USE_REAL_HERO_SPRITES</code> in{' '}
            <code>ChestAnnouncer.tsx</code>.
          </li>
          <li>
            The chest sprite is procedurally generated by the same
            build script and committed as <code>chest.png</code> —
            already real, no opt-in required.
          </li>
        </ul>
      </section>
    </div>
  );
}

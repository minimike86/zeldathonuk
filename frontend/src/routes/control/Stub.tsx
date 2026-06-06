/**
 * Placeholder pages for the control panel sections that aren't fully built
 * yet. Each one explains what it will do.
 */
export function ScheduleStub() {
  return (
    <div className="control-card">
      <h2>Schedule</h2>
      <p>Manage the game lineup for the active event.</p>
      <ul>
        <li>Drag-drop to reorder games</li>
        <li>Set event start time</li>
        <li>Override per-game planned duration; next-game start times recompute automatically</li>
        <li>Set the currently-playing game (drives every OBS browser source)</li>
        <li>Push the lineup to the Twitch channel schedule</li>
      </ul>
      <p>
        For now use the Django admin at{' '}
        <a className="text-warning" href="/admin/api/scheduleentry/" target="_blank" rel="noreferrer">
          /admin/api/scheduleentry/
        </a>{' '}
        to add entries.
      </p>
    </div>
  );
}

export function TimerStub() {
  return (
    <div className="control-card">
      <h2>Timer</h2>
      <p>
        Per-game run timer with start / pause / reset / stop. Persists across page
        reloads; total elapsed seconds get saved against the schedule entry so the
        runtime is preserved with the run record.
      </p>
      <p>API endpoints already exist:</p>
      <ul>
        <li>
          <code>POST /api/schedule/&lt;id&gt;/start_timer/</code>
        </li>
        <li>
          <code>POST /api/schedule/&lt;id&gt;/pause_timer/</code>
        </li>
        <li>
          <code>POST /api/schedule/&lt;id&gt;/reset_timer/</code>
        </li>
        <li>
          <code>POST /api/schedule/&lt;id&gt;/stop_timer/</code>
        </li>
      </ul>
    </div>
  );
}

export function ItemsStub() {
  return (
    <div className="control-card">
      <h2>Items collected</h2>
      <p>
        Per-game collectible checklist — Zelda items, songs, heart pieces. Toggle
        each as the player picks them up. The current state drives the OBS layout
        side panel (item grid).
      </p>
      <p>
        API: <code>POST /api/schedule/&lt;id&gt;/toggle_collected/</code> with{' '}
        <code>{`{ item_id }`}</code>.
      </p>
    </div>
  );
}

export function DonationsStub() {
  return (
    <div className="control-card">
      <h2>Donations</h2>
      <p>
        Add donations manually as they come in from JustGiving, Tiltify, Facebook,
        Twitch Charity, PayPal, direct, etc. View aggregate totals per platform and
        for the whole event.
      </p>
      <p>API: <code>/api/donations/</code> (list/create), <code>/api/donations/totals/</code> (aggregate).</p>
    </div>
  );
}

export function BrbStub() {
  return (
    <div className="control-card">
      <h2>BRB countdown</h2>
      <p>
        Set the target time when the stream resumes. The <code>/obs/brb</code> overlay
        polls every 2s and counts down to it.
      </p>
      <p>API: <code>/api/brb/</code> (list/create), <code>/api/brb/current/</code> (read active).</p>
    </div>
  );
}

export function GamesStub() {
  return (
    <div className="control-card">
      <h2>Games catalogue</h2>
      <p>
        Manage the catalogue of Zelda titles: title, platform, layout type (which
        OBS browser source to use), default play time, box art, HLTB ID.
      </p>
      <p>
        Quick-add via the Django admin at{' '}
        <a className="text-warning" href="/admin/api/game/" target="_blank" rel="noreferrer">
          /admin/api/game/
        </a>
        .
      </p>
    </div>
  );
}

import { useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { CustomReward, RewardAction, RewardMapping } from '@/lib/obsApi';

const ACTION_TYPES = [
  { value: 'chat', label: 'Post chat message' },
  { value: 'shoutout', label: 'Shout out the redeemer' },
  { value: 'death_counter', label: 'Adjust death counter' },
  { value: 'webhook', label: 'Call a webhook (HTTP)' },
  { value: 'alert', label: 'On-stream alert + sound' },
];

const ANNOUNCE_COLORS = ['primary', 'blue', 'green', 'orange', 'purple'];
const HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

export function RewardsPanel() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const [nonce, setNonce] = useState(0);
  const refetch = () => setNonce((n) => n + 1);
  const { data: mappings } = usePolledQuery(
    () => (event ? obsApi.rewardMappings(event.id) : Promise.resolve([])),
    6000,
    [event?.id, nonce],
  );
  // Best-effort list of the channel's rewards for the picker; empty if the
  // channel has none or the token can't read them.
  const { data: rewards } = usePolledQuery(obsApi.twitchCustomRewards, 60_000);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h5 className="m-0">Channel-point rewards</h5>
        <span className="text-white-50 small">
          A reward can run one or more actions when redeemed
        </span>
      </header>
      <p className="small text-white-50">
        Needs the redemption EventSub subscription (Automation → Sync) and the
        primary channel connected.
      </p>

      {!event && <p className="text-warning">No active event.</p>}
      {err && <p className="text-danger small">{err}</p>}

      {event && (
        <AddReward
          eventId={event.id}
          rewards={rewards ?? []}
          existing={mappings ?? []}
          onAdded={() => {
            setErr(null);
            refetch();
          }}
          onError={setErr}
        />
      )}

      <div className="mt-3">
        {(mappings ?? []).map((m) => (
          <RewardCard key={m.id} mapping={m} onChanged={refetch} onError={setErr} />
        ))}
        {mappings && mappings.length === 0 && (
          <p className="text-white-50 small">No reward mappings yet.</p>
        )}
      </div>
    </div>
  );
}

function AddReward({
  eventId,
  rewards,
  existing,
  onAdded,
  onError,
}: {
  eventId: number;
  rewards: CustomReward[];
  existing: RewardMapping[];
  onAdded: () => void;
  onError: (m: string | null) => void;
}) {
  // 'existing' = map an existing Twitch reward; 'create' = create a NEW reward
  // on the channel (so it actually appears for viewers) then map it.
  const [mode, setMode] = useState<'existing' | 'create'>('existing');
  const [title, setTitle] = useState('');
  const [rewardId, setRewardId] = useState('');
  const [cost, setCost] = useState(100);
  const [requireInput, setRequireInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const mappedIds = new Set(existing.map((m) => m.reward_id).filter(Boolean));
  const candidates = rewards.filter((r) => !mappedIds.has(r.id));

  const pick = (id: string) => {
    setRewardId(id);
    const r = rewards.find((x) => x.id === id);
    if (r) setTitle(r.title);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      let mappedRewardId = rewardId;
      if (mode === 'create') {
        // Create the reward on Twitch first, then map actions to its real id.
        const created = await obsApi.createTwitchReward({
          title: title.trim(),
          cost,
          require_input: requireInput,
        });
        mappedRewardId = created.id;
      }
      await obsApi.createRewardMapping({
        event: eventId,
        reward_id: mappedRewardId,
        reward_title: title.trim(),
      });
      setTitle('');
      setRewardId('');
      setCost(100);
      setRequireInput(false);
      onAdded();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2">
      <div className="btn-group btn-group-sm mb-2" role="group">
        <button
          type="button"
          className={`btn ${mode === 'existing' ? 'btn-bloodmoon' : 'btn-outline-light'}`}
          onClick={() => setMode('existing')}
        >
          Map existing reward
        </button>
        <button
          type="button"
          className={`btn ${mode === 'create' ? 'btn-bloodmoon' : 'btn-outline-light'}`}
          onClick={() => {
            setMode('create');
            setRewardId('');
          }}
        >
          Create new on Twitch
        </button>
      </div>

      <div className="d-flex gap-2 align-items-end flex-wrap">
        {mode === 'existing' && candidates.length > 0 && (
          <div>
            <label className="d-block small text-white-50">Pick a reward</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 220 }}
              value={rewardId}
              onChange={(e) => pick(e.target.value)}
            >
              <option value="">— choose —</option>
              {candidates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.cost})
                </option>
              ))}
            </select>
          </div>
        )}
        {mode === 'existing' && candidates.length === 0 && (
          <span className="small text-white-50 align-self-center">
            No unmapped rewards on the channel — switch to “Create new on Twitch”
            or check the primary channel is connected.
          </span>
        )}
        <div>
          <label className="d-block small text-white-50">Reward name</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control form-control-sm"
            placeholder="Add a death"
            style={{ width: 200 }}
          />
        </div>
        {mode === 'create' && (
          <>
            <div>
              <label className="d-block small text-white-50">Cost</label>
              <input
                type="number"
                min={1}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="form-control form-control-sm"
                style={{ width: 110 }}
              />
            </div>
            <div className="form-check mb-1">
              <input
                id="rw-require-input"
                type="checkbox"
                className="form-check-input"
                checked={requireInput}
                onChange={(e) => setRequireInput(e.target.checked)}
              />
              <label htmlFor="rw-require-input" className="form-check-label small">
                Require viewer text
              </label>
            </div>
          </>
        )}
        <button
          type="submit"
          className="btn btn-bloodmoon btn-sm"
          disabled={busy || !title.trim() || (mode === 'create' && cost < 1)}
        >
          {busy ? 'Adding…' : mode === 'create' ? '+ Create & add' : '+ Add reward'}
        </button>
      </div>
      {mode === 'create' && (
        <p className="small text-white-50 mt-1 mb-0">
          Creates the reward on your channel via Twitch so viewers can redeem it.
          Needs the primary channel connected with manage-redemptions.
        </p>
      )}
    </form>
  );
}

function RewardCard({
  mapping,
  onChanged,
  onError,
}: {
  mapping: RewardMapping;
  onChanged: () => void;
  onError: (m: string | null) => void;
}) {
  const [adding, setAdding] = useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    onError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div
      className="p-3 mb-2"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <div className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            id={`rm-${mapping.id}`}
            checked={mapping.enabled}
            onChange={(e) => act(() => obsApi.updateRewardMapping(mapping.id, { enabled: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor={`rm-${mapping.id}`}>
            <strong>{mapping.reward_title}</strong>
          </label>
        </div>
        {!mapping.reward_id && (
          <span className="badge bg-dark" title="Matched by name (no reward id)">
            by name
          </span>
        )}
        <div className="ms-auto control-btn-row">
          {!adding && (
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setAdding(true)}
            >
              + Action
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              if (confirm('Delete this reward mapping and its actions?'))
                act(() => obsApi.deleteRewardMapping(mapping.id));
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <ul className="list-unstyled m-0 mt-2">
        {mapping.actions.map((a) => (
          <ActionRow key={a.id} action={a} onChanged={onChanged} onError={onError} />
        ))}
        {mapping.actions.length === 0 && !adding && (
          <li className="text-white-50 small">No actions — add one.</li>
        )}
      </ul>

      {adding && (
        <ActionForm
          mappingId={mapping.id}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            onChanged();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}

function ActionRow({
  action,
  onChanged,
  onError,
}: {
  action: RewardAction;
  onChanged: () => void;
  onError: (m: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    onError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  if (editing) {
    return (
      <li className="mb-2">
        <ActionForm
          mappingId={action.mapping}
          action={action}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
          onError={onError}
        />
      </li>
    );
  }

  return (
    <li
      className="d-flex align-items-center gap-2 flex-wrap py-1 px-2"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="form-check form-switch m-0">
        <input
          className="form-check-input"
          type="checkbox"
          checked={action.enabled}
          onChange={(e) => act(() => obsApi.updateRewardAction(action.id, { enabled: e.target.checked }))}
        />
      </div>
      <span className="badge bg-secondary">{action.action_type_display}</span>
      <span className="small text-white-50">{summarise(action)}</span>
      <div className="ms-auto control-btn-row">
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => act(() => obsApi.deleteRewardAction(action.id))}
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function summarise(a: RewardAction): string {
  const p = a.params || {};
  if (a.action_type === 'chat') return String(p.template ?? '{user} redeemed {reward}');
  if (a.action_type === 'death_counter') return `delta ${p.delta ?? 1}`;
  if (a.action_type === 'shoutout') return 'shouts out the redeemer';
  if (a.action_type === 'webhook')
    return `${String(p.method ?? 'POST')} ${String(p.url ?? '')}`.trim();
  if (a.action_type === 'alert')
    return String(p.text ?? '{user} redeemed {reward}') + (p.sound_url ? ' 🔊' : '');
  return '';
}

function ActionForm({
  mappingId,
  action,
  onCancel,
  onSaved,
  onError,
}: {
  mappingId: number;
  action?: RewardAction;
  onCancel: () => void;
  onSaved: () => void;
  onError: (m: string | null) => void;
}) {
  const isEdit = action !== undefined;
  const [type, setType] = useState(action?.action_type ?? 'chat');
  const p = action?.params ?? {};
  const [template, setTemplate] = useState(String(p.template ?? '{user} redeemed {reward}!'));
  const [asAnnouncement, setAsAnnouncement] = useState(Boolean(p.as_announcement));
  const [color, setColor] = useState(String(p.color ?? 'primary'));
  const [delta, setDelta] = useState(Number(p.delta ?? 1));
  // webhook
  const [url, setUrl] = useState(String(p.url ?? ''));
  const [method, setMethod] = useState(String(p.method ?? 'POST'));
  const [contentType, setContentType] = useState(String(p.content_type ?? 'application/json'));
  const [webhookBody, setWebhookBody] = useState(
    String(p.body ?? '{"user": "{user}", "reward": "{reward}", "input": "{input}"}'),
  );
  // alert
  const [alertText, setAlertText] = useState(String(p.text ?? '{user} redeemed {reward}!'));
  const [soundUrl, setSoundUrl] = useState(String(p.sound_url ?? ''));
  const [busy, setBusy] = useState(false);

  const buildParams = (): Record<string, unknown> => {
    if (type === 'chat') return { template, as_announcement: asAnnouncement, color };
    if (type === 'death_counter') return { delta };
    if (type === 'webhook')
      return { url: url.trim(), method, content_type: contentType, body: webhookBody };
    if (type === 'alert') return { text: alertText, sound_url: soundUrl.trim() };
    return {};
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      if (isEdit) {
        await obsApi.updateRewardAction(action.id, { action_type: type, params: buildParams() });
      } else {
        await obsApi.createRewardAction({ mapping: mappingId, action_type: type, params: buildParams() });
      }
      onSaved();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-2 p-2"
      style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}
    >
      <div className="d-flex gap-2 align-items-end flex-wrap">
        <div>
          <label className="d-block small text-white-50">Action</label>
          <select
            className="form-select form-select-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {type === 'death_counter' && (
          <div>
            <label className="d-block small text-white-50">Delta</label>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 90 }}
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {type === 'chat' && (
        <div className="mt-2">
          <label className="d-block small text-white-50">
            Message — {'{user} {reward} {input} {cost}'}
          </label>
          <textarea
            className="form-control form-control-sm"
            rows={2}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <div className="d-flex gap-3 align-items-center mt-1 flex-wrap">
            <div className="form-check m-0">
              <input
                className="form-check-input"
                type="checkbox"
                id={`ra-ann-${action?.id ?? 'new'}`}
                checked={asAnnouncement}
                onChange={(e) => setAsAnnouncement(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor={`ra-ann-${action?.id ?? 'new'}`}>
                Highlight (/announce)
              </label>
            </div>
            {asAnnouncement && (
              <select
                className="form-select form-select-sm"
                style={{ width: 130 }}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                {ANNOUNCE_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c === 'primary' ? 'Channel accent' : c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
      {type === 'shoutout' && (
        <p className="small text-white-50 mt-2 mb-0">
          Queues a cooldown-managed shoutout for whoever redeemed the reward.
        </p>
      )}
      {type === 'webhook' && (
        <div className="mt-2">
          <div className="d-flex gap-2 align-items-end flex-wrap">
            <div>
              <label className="d-block small text-white-50">Method</label>
              <select
                className="form-select form-select-sm"
                style={{ width: 110 }}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label className="d-block small text-white-50">URL</label>
              <input
                type="url"
                className="form-control form-control-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/hook"
              />
            </div>
            <div>
              <label className="d-block small text-white-50">Content-Type</label>
              <input
                className="form-control form-control-sm"
                style={{ width: 170 }}
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              />
            </div>
          </div>
          {method !== 'GET' && (
            <div className="mt-2">
              <label className="d-block small text-white-50">
                Body — {'{user} {reward} {input} {cost}'}
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={webhookBody}
                onChange={(e) => setWebhookBody(e.target.value)}
              />
            </div>
          )}
          <p className="small text-white-50 mt-1 mb-0">
            Fires an HTTP request when redeemed — wire a reward to anything (a
            script, Discord, OBS, IFTTT/Zapier). 10s timeout, best-effort.
          </p>
        </div>
      )}
      {type === 'alert' && (
        <div className="mt-2">
          <label className="d-block small text-white-50">
            On-screen text — {'{user} {reward} {input} {cost}'}
          </label>
          <input
            className="form-control form-control-sm"
            value={alertText}
            onChange={(e) => setAlertText(e.target.value)}
          />
          <label className="d-block small text-white-50 mt-2">
            Sound URL (optional)
          </label>
          <input
            type="url"
            className="form-control form-control-sm"
            value={soundUrl}
            onChange={(e) => setSoundUrl(e.target.value)}
            placeholder="https://…/cheer.mp3"
          />
          <p className="small text-white-50 mt-1 mb-0">
            Shows a takeover on the omnibar overlay and plays the sound (if set)
            when redeemed.
          </p>
        </div>
      )}

      <div className="d-flex gap-2 mt-2">
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Add action'}
        </button>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

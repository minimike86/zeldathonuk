import { useMemo, useState, type CSSProperties } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { resolveMediaUrl } from '@/lib/env';
import type {
  Charity,
  CharityImage,
  CharityImpactTier,
  CharitySocialLink,
  CharityVideo,
  CharityWebsite,
  DonationPlatformKey,
  SocialPlatformKey,
} from '@/lib/obsApi';
import { ImageDropzone } from '@/components/ImageDropzone';

type SortKey = 'name' | 'order' | 'is_active' | 'event_count';
type SortDir = 'asc' | 'desc';

const sortValue = (c: Charity, key: SortKey): string | number => {
  switch (key) {
    case 'is_active':
      return c.is_active ? 1 : 0;
    case 'order':
      return c.order;
    case 'event_count':
      // Charity payload doesn't expose this directly; treat unknown as 0
      // so the sort is stable. Real per-charity event-counts are
      // available via /api/event-charities/?charity=<id> but we don't
      // pre-fetch them for the list view.
      return 0;
    case 'name':
      return c.name.toLowerCase();
  }
};

/** Display labels for DonationPlatform keys — mirrors the picker in
 *  /control/events. Keeping it local avoids a cross-file import for a
 *  five-item lookup. */
const PLATFORM_LABELS: Record<DonationPlatformKey, string> = {
  justgiving: 'JustGiving',
  tiltify: 'Tiltify',
  facebook: 'Facebook',
  twitch: 'Twitch Charity',
  paypal: 'PayPal',
  direct: 'Direct / cash',
  other: 'Other',
};
const PLATFORM_KEYS = Object.keys(PLATFORM_LABELS) as DonationPlatformKey[];

const CURRENCY_OPTIONS = ['GBP', 'USD', 'EUR', 'JPY'];

/** Display labels mirroring backend SocialPlatform.choices. Keep in
 *  sync when adding a new platform server-side. */
const SOCIAL_PLATFORM_LABELS: Record<SocialPlatformKey, string> = {
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  bluesky: 'Bluesky',
  threads: 'Threads',
  mastodon: 'Mastodon',
  twitch: 'Twitch',
  discord: 'Discord',
  reddit: 'Reddit',
  patreon: 'Patreon',
  other: 'Other',
};
const SOCIAL_PLATFORM_KEYS = Object.keys(
  SOCIAL_PLATFORM_LABELS,
) as SocialPlatformKey[];

/** Lightweight glyph per platform — single-character marker so the
 *  list reads at a glance without bundling brand SVGs. The public
 *  /charity page is free to upgrade to proper logos later. */
const SOCIAL_PLATFORM_GLYPHS: Record<SocialPlatformKey, string> = {
  twitter: '𝕏',
  facebook: 'f',
  instagram: '◎',
  youtube: '▶',
  tiktok: '♪',
  linkedin: 'in',
  bluesky: '☁',
  threads: '@',
  mastodon: 'M',
  twitch: 'tv',
  discord: 'D',
  reddit: 'r',
  patreon: 'P',
  other: '★',
};

export function CharitiesControl() {
  const { data: charities } = usePolledQuery(() => obsApi.charities(), 5000);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('order');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const visible = useMemo(() => {
    if (!charities) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? charities.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q) ||
            c.charity_number.toLowerCase().includes(q),
        )
      : charities;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [charities, filter, sortKey, sortDir]);

  const remove = async (c: Charity) => {
    if (
      !confirm(
        `Delete "${c.name}"? Any EventCharity links pointing at it will be removed too.`,
      )
    ) {
      return;
    }
    try {
      await obsApi.deleteCharity(c.id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h2 className="m-0">Charities</h2>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, slug, or charity number…"
            className="form-control form-control-sm"
            style={{ width: 300 }}
          />
          {!adding && (
            <button
              className="btn btn-bloodmoon btn-sm"
              onClick={() => setAdding(true)}
            >
              + Add charity
            </button>
          )}
        </div>
      </header>

      {adding && (
        <div className="mt-3">
          <CharityForm
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        </div>
      )}

      {err && <p className="text-danger mt-2">{err}</p>}

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th style={{ width: 64 }}></th>
            <SortableTh
              label="Name"
              sortKey="name"
              current={sortKey}
              dir={sortDir}
              onClick={toggleSort}
            />
            <th>Charity no.</th>
            <SortableTh
              label="Order"
              sortKey="order"
              current={sortKey}
              dir={sortDir}
              onClick={toggleSort}
            />
            <th>Impact tiers</th>
            <SortableTh
              label="Status"
              sortKey="is_active"
              current={sortKey}
              dir={sortDir}
              onClick={toggleSort}
            />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((c) =>
            editingId === c.id ? (
              <tr key={c.id}>
                <td colSpan={7}>
                  <CharityForm
                    charity={c}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                  <CharityChildPanels charity={c} />
                </td>
              </tr>
            ) : (
              <tr key={c.id}>
                <td>
                  {c.logo_thumbnail_url || c.logo_url ? (
                    <img
                      src={resolveMediaUrl(c.logo_thumbnail_url || c.logo_url)}
                      alt={`${c.name} logo`}
                      width={48}
                      height={48}
                      style={{
                        borderRadius: 6,
                        // Thumbnail variant is intended for square slots →
                        // crop-fit. Fallback to the full logo (often
                        // wordmark) → contain-fit so it doesn't get
                        // clipped, accepting a bit of letterbox padding.
                        objectFit: c.logo_thumbnail_url ? 'cover' : 'contain',
                        background: c.logo_thumbnail_url
                          ? undefined
                          : 'rgba(255,255,255,0.04)',
                      }}
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
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td>
                  <strong>{c.name}</strong>
                  {c.short_name && (
                    <span className="small text-white-50 ms-2">
                      ({c.short_name})
                    </span>
                  )}
                  <div className="small text-white-50 d-flex gap-2 flex-wrap mt-1">
                    <code>{c.slug}</code>
                    {c.primary_website_url && (
                      <a
                        className="text-white-50"
                        href={c.primary_website_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        website ↗
                      </a>
                    )}
                  </div>
                </td>
                <td className="small text-white-50">
                  {c.charity_number || '—'}
                </td>
                <td>{c.order}</td>
                <td>
                  <span className="small text-white-50">
                    {c.impact_tiers.length} tier
                    {c.impact_tiers.length === 1 ? '' : 's'} ·{' '}
                    {c.websites.length} site
                    {c.websites.length === 1 ? '' : 's'} ·{' '}
                    {c.social_links.length} social ·{' '}
                    {c.videos.length} vid
                    {c.videos.length === 1 ? '' : 's'} ·{' '}
                    {c.images.length} img
                    {c.images.length === 1 ? '' : 's'}
                  </span>
                </td>
                <td>
                  {c.is_active ? (
                    <span className="badge bg-success">active</span>
                  ) : (
                    <span className="text-white-50 small">archived</span>
                  )}
                </td>
                <td>
                  <div className="control-btn-row">
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setEditingId(c.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => remove(c)}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
          {charities && charities.length === 0 && (
            <tr>
              <td colSpan={7} className="text-white-50 text-center py-4">
                No charities yet — add one above. Charities become available
                as event beneficiaries once saved.
              </td>
            </tr>
          )}
          {charities && charities.length > 0 && visible.length === 0 && (
            <tr>
              <td colSpan={7} className="text-white-50 text-center py-4">
                No charities match “{filter}”.
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

// ── Top-level charity form ──────────────────────────────────────────────

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

function CharityForm({
  charity,
  onCancel,
  onSaved,
}: {
  charity?: Charity;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = charity !== undefined;

  const [name, setName] = useState(charity?.name ?? '');
  const [slug, setSlug] = useState(charity?.slug ?? '');
  const [shortName, setShortName] = useState(charity?.short_name ?? '');
  const [charityNumber, setCharityNumber] = useState(charity?.charity_number ?? '');
  const [mission, setMission] = useState(charity?.mission_statement ?? '');
  const [missionTagline, setMissionTagline] = useState(charity?.mission_tagline ?? '');
  const [logoUrl, setLogoUrl] = useState(charity?.logo_url ?? '');
  const [logoThumbnailUrl, setLogoThumbnailUrl] = useState(
    charity?.logo_thumbnail_url ?? '',
  );
  const [bannerUrl, setBannerUrl] = useState(charity?.banner_url ?? '');
  const [primaryWebsite, setPrimaryWebsite] = useState(
    charity?.primary_website_url ?? '',
  );

  const [helpHeadline, setHelpHeadline] = useState(charity?.help_cta_headline ?? '');
  const [helpBody, setHelpBody] = useState(charity?.help_cta_body ?? '');
  const [helpUrl, setHelpUrl] = useState(charity?.help_cta_url ?? '');
  const [donateHeadline, setDonateHeadline] = useState(
    charity?.donate_cta_headline ?? '',
  );
  const [donateBody, setDonateBody] = useState(charity?.donate_cta_body ?? '');
  const [donateUrl, setDonateUrl] = useState(charity?.donate_cta_url ?? '');

  const [supported, setSupported] = useState<DonationPlatformKey[]>(
    charity?.supported_platforms ?? [],
  );
  const [isActive, setIsActive] = useState(charity?.is_active ?? true);
  const [order, setOrder] = useState(charity?.order ?? 0);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auto-slug on add — once the user has touched the slug field, stop
  // overwriting it from the name. On edit we never auto-derive.
  const [slugDirty, setSlugDirty] = useState(isEdit);

  const onNameChange = (next: string) => {
    setName(next);
    if (!slugDirty) setSlug(slugify(next));
  };

  const togglePlatform = (key: DonationPlatformKey) => {
    setSupported((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        short_name: shortName.trim(),
        charity_number: charityNumber.trim(),
        mission_statement: mission.trim(),
        mission_tagline: missionTagline.trim(),
        logo_url: logoUrl.trim(),
        logo_thumbnail_url: logoThumbnailUrl.trim(),
        banner_url: bannerUrl.trim(),
        primary_website_url: primaryWebsite.trim(),
        help_cta_headline: helpHeadline.trim(),
        help_cta_body: helpBody.trim(),
        help_cta_url: helpUrl.trim(),
        donate_cta_headline: donateHeadline.trim(),
        donate_cta_body: donateBody.trim(),
        donate_cta_url: donateUrl.trim(),
        supported_platforms: supported,
        is_active: isActive,
        order,
      };
      if (isEdit) {
        await obsApi.updateCharity(charity.id, body);
      } else {
        await obsApi.createCharity(body);
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
      className="p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <header className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <strong>{isEdit ? `Edit ${charity.name}` : 'Add charity'}</strong>
      </header>

      {/* Identity */}
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 240, flex: 2 }}>
          <label className="d-block small text-white-50">Name</label>
          <input
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 200, flex: 1 }}>
          <label className="d-block small text-white-50">
            Slug (URL handle)
          </label>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugDirty(true);
            }}
            className="form-control form-control-sm"
            placeholder="specialeffect"
          />
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <label className="d-block small text-white-50">
            Short name (optional)
          </label>
          <input
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            className="form-control form-control-sm"
            placeholder="Compact display label"
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="d-block small text-white-50">Charity number</label>
          <input
            value={charityNumber}
            onChange={(e) => setCharityNumber(e.target.value)}
            className="form-control form-control-sm"
            placeholder="1121004"
          />
        </div>
        <div style={{ minWidth: 90 }}>
          <label className="d-block small text-white-50">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="form-control form-control-sm"
            style={{ width: 90 }}
          />
        </div>
        <div className="form-check mb-1">
          <input
            id={`ch-active-${charity?.id ?? 'new'}`}
            type="checkbox"
            className="form-check-input"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor={`ch-active-${charity?.id ?? 'new'}`}
            className="form-check-label small"
          >
            Active
          </label>
        </div>
      </div>

      {/* Branding */}
      <div className="w-100 d-flex gap-3 flex-wrap mt-3">
        <div style={{ minWidth: 240, flex: 1 }}>
          <label
            className="d-block small text-white-50"
            title="The official charity mark — any aspect ratio. Often a wide wordmark. Used in headers and donation side-panels."
          >
            Logo (full mark — any shape)
          </label>
          <ImageDropzone
            value={logoUrl}
            onChange={setLogoUrl}
            previewStyle={{
              maxWidth: 160,
              maxHeight: 96,
              borderRadius: 6,
            }}
            folder="charities"
          />
        </div>
        <div style={{ minWidth: 240, flex: 1 }}>
          <label
            className="d-block small text-white-50"
            title="Square / near-square thumbnail used in tight UI (omnibar pills, table rows, donation cards). Recommended when the main logo is a wordmark."
          >
            Thumbnail (square — small UI)
          </label>
          <ImageDropzone
            value={logoThumbnailUrl}
            onChange={setLogoThumbnailUrl}
            previewStyle={{ width: 64, height: 64, borderRadius: 6 }}
            folder="charities"
          />
        </div>
        <div style={{ minWidth: 280, flex: 2 }}>
          <label className="d-block small text-white-50">
            Banner (wide hero)
          </label>
          <ImageDropzone
            value={bannerUrl}
            onChange={setBannerUrl}
            previewStyle={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4 }}
            folder="charities"
          />
        </div>
      </div>

      {/* About + website */}
      <div className="mt-3">
        <label className="d-block small text-white-50">Mission statement</label>
        <textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          className="form-control form-control-sm"
          rows={3}
          placeholder="Short paragraph used on /charity and /donations."
        />
      </div>

      <div className="mt-3">
        <label className="d-block small text-white-50">
          Mission tagline{' '}
          <span className="text-white-50">— one-liner for the omnibar ticker</span>
        </label>
        <input
          value={missionTagline}
          onChange={(e) => setMissionTagline(e.target.value)}
          className="form-control form-control-sm"
          maxLength={160}
          placeholder="e.g. Helping disabled gamers play. Falls back to the mission above when blank."
        />
      </div>

      <div className="mt-3 d-flex gap-2 flex-wrap">
        <div style={{ minWidth: 320, flex: 2 }}>
          <label className="d-block small text-white-50">
            Primary website URL
          </label>
          <input
            type="url"
            value={primaryWebsite}
            onChange={(e) => setPrimaryWebsite(e.target.value)}
            className="form-control form-control-sm"
            placeholder="https://www.specialeffect.org.uk/"
          />
        </div>
        <div style={{ minWidth: 320, flex: 3 }}>
          <label className="d-block small text-white-50">
            Supported donation platforms
          </label>
          <div className="d-flex gap-3 flex-wrap pt-1">
            {PLATFORM_KEYS.map((key) => {
              const checked = supported.includes(key);
              return (
                <label
                  key={key}
                  className="d-inline-flex align-items-center gap-1 small"
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checked}
                    onChange={() => togglePlatform(key)}
                  />
                  <span className={checked ? '' : 'text-white-50'}>
                    {PLATFORM_LABELS[key]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Call to action — "how can they help you?" */}
      <SectionCard title='Call to action — "how can the charity help you?"'>
        <div className="d-flex gap-2 flex-wrap">
          <div style={{ minWidth: 280, flex: 2 }}>
            <label className="d-block small text-white-50">Headline</label>
            <input
              value={helpHeadline}
              onChange={(e) => setHelpHeadline(e.target.value)}
              className="form-control form-control-sm"
              placeholder='e.g. "Need help adapting your gaming setup?"'
            />
          </div>
          <div style={{ minWidth: 280, flex: 2 }}>
            <label className="d-block small text-white-50">CTA URL</label>
            <input
              type="url"
              value={helpUrl}
              onChange={(e) => setHelpUrl(e.target.value)}
              className="form-control form-control-sm"
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="mt-2">
          <label className="d-block small text-white-50">Body</label>
          <textarea
            value={helpBody}
            onChange={(e) => setHelpBody(e.target.value)}
            className="form-control form-control-sm"
            rows={2}
          />
        </div>
      </SectionCard>

      {/* Call to action — "make a donation" */}
      <SectionCard title='Call to action — "make a donation"'>
        <div className="d-flex gap-2 flex-wrap">
          <div style={{ minWidth: 280, flex: 2 }}>
            <label className="d-block small text-white-50">Headline</label>
            <input
              value={donateHeadline}
              onChange={(e) => setDonateHeadline(e.target.value)}
              className="form-control form-control-sm"
              placeholder='e.g. "Every penny helps disabled gamers play"'
            />
          </div>
          <div style={{ minWidth: 280, flex: 2 }}>
            <label className="d-block small text-white-50">CTA URL</label>
            <input
              type="url"
              value={donateUrl}
              onChange={(e) => setDonateUrl(e.target.value)}
              className="form-control form-control-sm"
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="mt-2">
          <label className="d-block small text-white-50">Body</label>
          <textarea
            value={donateBody}
            onChange={(e) => setDonateBody(e.target.value)}
            className="form-control form-control-sm"
            rows={2}
          />
        </div>
      </SectionCard>

      <div className="d-flex gap-2 mt-3">
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
      </div>
      {err && <div className="text-danger mt-2 small">{err}</div>}
      {!isEdit && (
        <div className="small text-white-50 mt-2">
          After saving you'll be able to add impact tiers, websites, videos,
          and gallery images to this charity.
        </div>
      )}
    </form>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-3 p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
      }}
    >
      <div className="small text-white-50 mb-2" style={{ letterSpacing: 0.3 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Child panels (impact tiers + websites + videos + images) ─────────────

function CharityChildPanels({ charity }: { charity: Charity }) {
  return (
    <div className="mt-3 d-flex flex-column gap-3">
      <ImpactTiersEditor charity={charity} />
      <WebsitesEditor charity={charity} />
      <SocialLinksEditor charity={charity} />
      <VideosEditor charity={charity} />
      <ImagesEditor charity={charity} />
    </div>
  );
}

// — Impact tiers (the "What could your donation do?" rows) ——————————————

function ImpactTiersEditor({ charity }: { charity: Charity }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tiers = [...charity.impact_tiers].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Delete this impact tier?')) return;
    try {
      await obsApi.deleteCharityImpactTier(id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <ChildPanel
      title="Impact tiers — “What could your donation do?”"
      onAdd={() => setAdding(true)}
      adding={adding}
      addLabel="+ Add tier"
    >
      {err && <div className="text-danger small mb-2">{err}</div>}
      {adding && (
        <ImpactTierForm
          charityId={charity.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
      {tiers.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          No tiers yet — add £-amount → benefit rows to populate the side panel
          on /donations.
        </p>
      )}
      {tiers.length > 0 && (
        <ul className="list-unstyled m-0">
          {tiers.map((t) =>
            editingId === t.id ? (
              <li key={t.id} className="mb-2">
                <ImpactTierForm
                  charityId={charity.id}
                  tier={t}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={t.id}
                className="d-flex align-items-center gap-3 flex-wrap py-2 px-2"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 4,
                }}
              >
                {t.image_url ? (
                  <img
                    src={resolveMediaUrl(t.image_url)}
                    alt={t.alt_text}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: 'contain',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  />
                )}
                <div style={{ minWidth: 80 }}>
                  <strong>
                    {formatCurrency(t.amount, t.currency)}
                  </strong>
                </div>
                <div className="flex-grow-1" style={{ minWidth: 220 }}>
                  <div className="small">{t.description}</div>
                  {t.description_html && (
                    <div className="small text-white-50 mt-1">
                      <code>html override set</code>
                    </div>
                  )}
                </div>
                <span className="small text-white-50">order {t.order}</span>
                <div className="ms-auto control-btn-row">
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(t.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(t.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </ChildPanel>
  );
}

function ImpactTierForm({
  charityId,
  tier,
  onCancel,
  onSaved,
}: {
  charityId: number;
  tier?: CharityImpactTier;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = tier !== undefined;
  const [amount, setAmount] = useState(tier?.amount ?? '10.00');
  const [currency, setCurrency] = useState(tier?.currency ?? 'GBP');
  const [imageUrl, setImageUrl] = useState(tier?.image_url ?? '');
  const [altText, setAltText] = useState(tier?.alt_text ?? '');
  const [description, setDescription] = useState(tier?.description ?? '');
  const [descriptionHtml, setDescriptionHtml] = useState(tier?.description_html ?? '');
  const [order, setOrder] = useState(tier?.order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        charity: charityId,
        amount: amount.trim(),
        currency: currency.trim() || 'GBP',
        image_url: imageUrl.trim(),
        alt_text: altText.trim(),
        description: description.trim(),
        description_html: descriptionHtml.trim(),
        order,
      };
      if (isEdit) {
        await obsApi.updateCharityImpactTier(tier.id, body);
      } else {
        await obsApi.createCharityImpactTier(body);
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-2" style={childFormStyle}>
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 120 }}>
          <label className="d-block small text-white-50">Amount</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 100 }}>
          <label className="d-block small text-white-50">Currency</label>
          <select
            className="form-select form-select-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 90 }}>
          <label className="d-block small text-white-50">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="form-control form-control-sm"
            style={{ width: 90 }}
          />
        </div>
        <div style={{ minWidth: 220, flex: 1 }}>
          <label className="d-block small text-white-50">Alt text</label>
          <input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="form-control form-control-sm"
            placeholder='e.g. "Joystick extensions"'
          />
        </div>
      </div>

      <div className="mt-2 d-flex gap-3 flex-wrap">
        <div style={{ minWidth: 240, flex: 1 }}>
          <label className="d-block small text-white-50">
            Illustration image
          </label>
          <ImageDropzone
            value={imageUrl}
            onChange={setImageUrl}
            previewStyle={{ width: 72, height: 72, borderRadius: 6 }}
            folder="charity-impact"
          />
        </div>
        <div style={{ flex: 2, minWidth: 320 }}>
          <label className="d-block small text-white-50">
            Description (plain text — required)
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control form-control-sm"
            rows={2}
          />
          <label className="d-block small text-white-50 mt-2">
            HTML override (optional — embeds inline links)
          </label>
          <textarea
            value={descriptionHtml}
            onChange={(e) => setDescriptionHtml(e.target.value)}
            className="form-control form-control-sm"
            rows={2}
            placeholder='e.g. Will buy an <a href="…">Xbox Adaptive Controller</a> for…'
          />
        </div>
      </div>

      <div className="d-flex gap-2 mt-2">
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      {err && <div className="text-danger small mt-2">{err}</div>}
    </form>
  );
}

// — Websites ——————————————————————————————————————————————————————————

function WebsitesEditor({ charity }: { charity: Charity }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rows = [...charity.websites].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Delete this website link?')) return;
    try {
      await obsApi.deleteCharityWebsite(id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <ChildPanel
      title="Additional websites"
      onAdd={() => setAdding(true)}
      adding={adding}
      addLabel="+ Add website"
    >
      {err && <div className="text-danger small mb-2">{err}</div>}
      {adding && (
        <WebsiteForm
          charityId={charity.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
      {rows.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          The primary website goes on the main form above. Use this for
          additional links (campaign microsites, blog, GameBlast page…).
        </p>
      )}
      {rows.length > 0 && (
        <ul className="list-unstyled m-0">
          {rows.map((w) =>
            editingId === w.id ? (
              <li key={w.id} className="mb-2">
                <WebsiteForm
                  charityId={charity.id}
                  website={w}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={w.id}
                className="d-flex align-items-center gap-2 flex-wrap py-2 px-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <strong>{w.label}</strong>
                <a
                  className="text-warning small text-truncate"
                  style={{ maxWidth: 420 }}
                  href={w.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {w.url}
                </a>
                <span className="small text-white-50">order {w.order}</span>
                <div className="ms-auto control-btn-row">
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(w.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(w.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </ChildPanel>
  );
}

function WebsiteForm({
  charityId,
  website,
  onCancel,
  onSaved,
}: {
  charityId: number;
  website?: CharityWebsite;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = website !== undefined;
  const [label, setLabel] = useState(website?.label ?? '');
  const [url, setUrl] = useState(website?.url ?? '');
  const [order, setOrder] = useState(website?.order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        charity: charityId,
        label: label.trim(),
        url: url.trim(),
        order,
      };
      if (isEdit) {
        await obsApi.updateCharityWebsite(website.id, body);
      } else {
        await obsApi.createCharityWebsite(body);
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
      className="d-flex gap-2 flex-wrap align-items-end p-2"
      style={childFormStyle}
    >
      <div style={{ minWidth: 200, flex: 1 }}>
        <label className="d-block small text-white-50">Label</label>
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="form-control form-control-sm"
          placeholder='e.g. "GameBlast 24"'
        />
      </div>
      <div style={{ minWidth: 320, flex: 2 }}>
        <label className="d-block small text-white-50">URL</label>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div style={{ minWidth: 90 }}>
        <label className="d-block small text-white-50">Order</label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="form-control form-control-sm"
          style={{ width: 90 }}
        />
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
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

// — Social links ——————————————————————————————————————————————————————

function SocialLinksEditor({ charity }: { charity: Charity }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rows = [...charity.social_links].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Delete this social link?')) return;
    try {
      await obsApi.deleteCharitySocialLink(id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <ChildPanel
      title="Social links"
      onAdd={() => setAdding(true)}
      adding={adding}
      addLabel="+ Add social"
    >
      {err && <div className="text-danger small mb-2">{err}</div>}
      {adding && (
        <SocialLinkForm
          charityId={charity.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
      {rows.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          Add the charity's social profiles (X, Facebook, Instagram, YouTube…)
          so /charity and the omnibar can render the right icons next to
          links out.
        </p>
      )}
      {rows.length > 0 && (
        <ul className="list-unstyled m-0">
          {rows.map((s) =>
            editingId === s.id ? (
              <li key={s.id} className="mb-2">
                <SocialLinkForm
                  charityId={charity.id}
                  social={s}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={s.id}
                className="d-flex align-items-center gap-2 flex-wrap py-2 px-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <SocialGlyph platform={s.platform} />
                <strong style={{ minWidth: 110 }}>
                  {s.platform_label || SOCIAL_PLATFORM_LABELS[s.platform]}
                </strong>
                {s.handle && (
                  <code className="small text-white-50">{s.handle}</code>
                )}
                <a
                  className="text-warning small text-truncate"
                  style={{ maxWidth: 420 }}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.url}
                </a>
                <span className="small text-white-50">order {s.order}</span>
                <div className="ms-auto control-btn-row">
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(s.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(s.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </ChildPanel>
  );
}

function SocialGlyph({ platform }: { platform: SocialPlatformKey }) {
  return (
    <span
      aria-hidden
      title={SOCIAL_PLATFORM_LABELS[platform]}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'rgba(231,19,71,0.18)',
        border: '1px solid rgba(231,19,71,0.4)',
        fontFamily: '"Bungee", sans-serif',
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {SOCIAL_PLATFORM_GLYPHS[platform]}
    </span>
  );
}

function SocialLinkForm({
  charityId,
  social,
  onCancel,
  onSaved,
}: {
  charityId: number;
  social?: CharitySocialLink;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = social !== undefined;
  const [platform, setPlatform] = useState<SocialPlatformKey>(
    social?.platform ?? 'twitter',
  );
  const [url, setUrl] = useState(social?.url ?? '');
  const [handle, setHandle] = useState(social?.handle ?? '');
  const [order, setOrder] = useState(social?.order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        charity: charityId,
        platform,
        url: url.trim(),
        handle: handle.trim(),
        order,
      };
      if (isEdit) {
        await obsApi.updateCharitySocialLink(social.id, body);
      } else {
        await obsApi.createCharitySocialLink(body);
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
      className="d-flex gap-2 flex-wrap align-items-end p-2"
      style={childFormStyle}
    >
      <div style={{ minWidth: 160 }}>
        <label className="d-block small text-white-50">Platform</label>
        <select
          className="form-select form-select-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as SocialPlatformKey)}
        >
          {SOCIAL_PLATFORM_KEYS.map((k) => (
            <option key={k} value={k}>
              {SOCIAL_PLATFORM_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: 200 }}>
        <label className="d-block small text-white-50">
          Handle (optional)
        </label>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="form-control form-control-sm"
          placeholder="@specialeffect"
        />
      </div>
      <div style={{ minWidth: 320, flex: 2 }}>
        <label className="d-block small text-white-50">Profile URL</label>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="form-control form-control-sm"
          placeholder="https://x.com/SpecialEffect"
        />
      </div>
      <div style={{ minWidth: 90 }}>
        <label className="d-block small text-white-50">Order</label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="form-control form-control-sm"
          style={{ width: 90 }}
        />
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
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

// — Videos ————————————————————————————————————————————————————————————

function VideosEditor({ charity }: { charity: Charity }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rows = [...charity.videos].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Delete this video?')) return;
    try {
      await obsApi.deleteCharityVideo(id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <ChildPanel
      title="Fundraising videos"
      onAdd={() => setAdding(true)}
      adding={adding}
      addLabel="+ Add video"
    >
      {err && <div className="text-danger small mb-2">{err}</div>}
      {adding && (
        <VideoForm
          charityId={charity.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
      {rows.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          Add YouTube / Vimeo / direct-mp4 links to short videos that explain
          the charity's work.
        </p>
      )}
      {rows.length > 0 && (
        <ul className="list-unstyled m-0">
          {rows.map((v) =>
            editingId === v.id ? (
              <li key={v.id} className="mb-2">
                <VideoForm
                  charityId={charity.id}
                  video={v}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={v.id}
                className="d-flex align-items-center gap-3 flex-wrap py-2 px-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {v.thumbnail_url ? (
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    style={{
                      width: 96,
                      height: 54,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 96,
                      height: 54,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  />
                )}
                {/* `min-width: 0` lets the inner truncating link
                  * actually shrink — without it, flex children default
                  * to `min-width: auto` (their content's intrinsic
                  * width) and a long URL would just push the column
                  * wider instead of triggering the ellipsis. */}
                <div
                  className="flex-grow-1"
                  style={{ minWidth: 0, flexBasis: 240 }}
                >
                  <strong>{v.title}</strong>
                  {/* `d-block` is required for `text-truncate` to
                    * engage — an inline `<a>` sizes to its content
                    * and never overflows. */}
                  <a
                    className="text-warning small text-truncate d-block"
                    style={{ maxWidth: '100%' }}
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    title={v.url}
                  >
                    {v.url}
                  </a>
                  {v.description && (
                    <div className="small text-white-50 mt-1">
                      {v.description}
                    </div>
                  )}
                </div>
                <span className="small text-white-50">order {v.order}</span>
                <div className="ms-auto control-btn-row">
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(v.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(v.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </ChildPanel>
  );
}

function VideoForm({
  charityId,
  video,
  onCancel,
  onSaved,
}: {
  charityId: number;
  video?: CharityVideo;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = video !== undefined;
  const [title, setTitle] = useState(video?.title ?? '');
  const [url, setUrl] = useState(video?.url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnail_url ?? '');
  const [description, setDescription] = useState(video?.description ?? '');
  const [order, setOrder] = useState(video?.order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        charity: charityId,
        title: title.trim(),
        url: url.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        description: description.trim(),
        order,
      };
      if (isEdit) {
        await obsApi.updateCharityVideo(video.id, body);
      } else {
        await obsApi.createCharityVideo(body);
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-2" style={childFormStyle}>
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 240, flex: 2 }}>
          <label className="d-block small text-white-50">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 320, flex: 3 }}>
          <label className="d-block small text-white-50">Watch URL</label>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="form-control form-control-sm"
            placeholder="https://youtu.be/…"
          />
        </div>
        <div style={{ minWidth: 90 }}>
          <label className="d-block small text-white-50">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="form-control form-control-sm"
            style={{ width: 90 }}
          />
        </div>
      </div>
      <div className="mt-2 d-flex gap-3 flex-wrap">
        <div style={{ minWidth: 240, flex: 1 }}>
          <label className="d-block small text-white-50">
            Thumbnail (optional)
          </label>
          <ImageDropzone
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            previewStyle={{ width: 120, height: 68, borderRadius: 4 }}
            folder="charities"
          />
        </div>
        <div style={{ flex: 2, minWidth: 280 }}>
          <label className="d-block small text-white-50">
            Caption / description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control form-control-sm"
            rows={3}
          />
        </div>
      </div>
      <div className="d-flex gap-2 mt-2">
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      {err && <div className="text-danger small mt-2">{err}</div>}
    </form>
  );
}

// — Images ————————————————————————————————————————————————————————————

function ImagesEditor({ charity }: { charity: Charity }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rows = [...charity.images].sort((a, b) => a.order - b.order);

  const remove = async (id: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      await obsApi.deleteCharityImage(id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <ChildPanel
      title="Fundraising image gallery"
      onAdd={() => setAdding(true)}
      adding={adding}
      addLabel="+ Add image"
    >
      {err && <div className="text-danger small mb-2">{err}</div>}
      {adding && (
        <ImageForm
          charityId={charity.id}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
      {rows.length === 0 && !adding && (
        <p className="text-white-50 small m-0">
          Photos / marketing assets the public /charity page and OBS scenes
          can rotate through. Distinct from the canonical logo + banner above.
        </p>
      )}
      {rows.length > 0 && (
        <div className="d-flex flex-wrap gap-3">
          {rows.map((img) =>
            editingId === img.id ? (
              <div key={img.id} style={{ minWidth: '100%' }}>
                <ImageForm
                  charityId={charity.id}
                  image={img}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                key={img.id}
                style={{
                  width: 200,
                  padding: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.25)',
                }}
              >
                <img
                  src={resolveMediaUrl(img.image_url)}
                  alt={img.alt_text}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                />
                {img.caption && (
                  <div className="small mt-2">{img.caption}</div>
                )}
                <div className="small text-white-50 mt-1">
                  order {img.order}
                </div>
                <div className="control-btn-row mt-2">
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setEditingId(img.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(img.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </ChildPanel>
  );
}

function ImageForm({
  charityId,
  image,
  onCancel,
  onSaved,
}: {
  charityId: number;
  image?: CharityImage;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = image !== undefined;
  const [imageUrl, setImageUrl] = useState(image?.image_url ?? '');
  const [altText, setAltText] = useState(image?.alt_text ?? '');
  const [caption, setCaption] = useState(image?.caption ?? '');
  const [order, setOrder] = useState(image?.order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        charity: charityId,
        image_url: imageUrl.trim(),
        alt_text: altText.trim(),
        caption: caption.trim(),
        order,
      };
      if (!body.image_url) {
        throw new Error('Image is required.');
      }
      if (isEdit) {
        await obsApi.updateCharityImage(image.id, body);
      } else {
        await obsApi.createCharityImage(body);
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-2" style={childFormStyle}>
      <div className="d-flex gap-3 flex-wrap">
        <div style={{ minWidth: 240, flex: 1 }}>
          <label className="d-block small text-white-50">Image</label>
          <ImageDropzone
            value={imageUrl}
            onChange={setImageUrl}
            previewStyle={{ width: 160, height: 100, borderRadius: 4 }}
            folder="charities"
          />
        </div>
        <div style={{ flex: 2, minWidth: 280 }}>
          <div className="d-flex gap-2">
            <div style={{ flex: 2 }}>
              <label className="d-block small text-white-50">Alt text</label>
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="form-control form-control-sm"
                placeholder="Screen-reader description"
              />
            </div>
            <div style={{ minWidth: 90 }}>
              <label className="d-block small text-white-50">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="form-control form-control-sm"
                style={{ width: 90 }}
              />
            </div>
          </div>
          <label className="d-block small text-white-50 mt-2">
            Caption (optional)
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
      </div>
      <div className="d-flex gap-2 mt-2">
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      {err && <div className="text-danger small mt-2">{err}</div>}
    </form>
  );
}

// ── Shared sub-shells ───────────────────────────────────────────────────

const childFormStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 6,
};

function ChildPanel({
  title,
  onAdd,
  adding,
  addLabel,
  children,
}: {
  title: string;
  onAdd: () => void;
  adding: boolean;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <header className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
        <strong>{title}</strong>
        {!adding && (
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={onAdd}
          >
            {addLabel}
          </button>
        )}
      </header>
      {children}
    </div>
  );
}

function formatCurrency(amount: string, currency: string): string {
  // Symbol lookup mirrors the small map used in CharityImpactTier on the
  // backend. Unknown codes fall through to "<CODE> <amount>" so we
  // never lose the value.
  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    JPY: '¥',
  };
  const symbol = symbols[currency];
  const n = Number(amount);
  const display = Number.isFinite(n) ? n.toFixed(2) : amount;
  return symbol ? `${symbol}${display}` : `${currency} ${display}`;
}

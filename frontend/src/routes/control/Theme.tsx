import { useEffect, useState } from 'react';
import type { ThemeSettings } from '@/lib/obsApi';
import { obsApi } from '@/lib/obsApi';
import { applyTheme } from '@/components/ThemeProvider';
import { LOGO_CATALOG } from '@/lib/logoCatalog';

/**
 * /control/theme — library of themes. The list on the left lets the user
 * activate, duplicate, delete, or add a new theme. The selected theme is
 * edited live on the right; changes preview instantly by writing CSS
 * variables onto :root, and `Save` persists. Activating a theme is its
 * own one-click action so quick switches don't need a save.
 */
export function ThemeControl() {
  const [themes, setThemes] = useState<ThemeSettings[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ThemeSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Initial fetch — pick the active theme as the default selection.
  useEffect(() => {
    void obsApi.themesList().then((list) => {
      setThemes(list);
      const active = list.find((t) => t.is_active) ?? list[0] ?? null;
      if (active) {
        setSelectedId(active.id);
        setDraft(active);
      }
    });
  }, []);

  // Switching selection drops any unsaved draft for the previous theme.
  useEffect(() => {
    if (selectedId == null || !themes) return;
    const fresh = themes.find((t) => t.id === selectedId) ?? null;
    setDraft(fresh);
    setSavedAt(null);
  }, [selectedId, themes]);

  // Live-preview: any edit applies immediately to CSS vars (only when the
  // draft is the active theme, so non-active themes don't override the
  // live look while you're poking at them).
  useEffect(() => {
    if (draft && draft.is_active) applyTheme(draft);
  }, [draft]);

  const dirty = !!(
    draft &&
    themes &&
    themes.find((t) => t.id === draft.id) &&
    JSON.stringify(draft) !== JSON.stringify(themes.find((t) => t.id === draft.id))
  );

  const set = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const refresh = async () => {
    const list = await obsApi.themesList();
    setThemes(list);
    return list;
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setErr(null);
    try {
      const fresh = await obsApi.themeUpdate(draft.id, draft);
      setDraft(fresh);
      const list = await refresh();
      // If the edit was on the active theme, re-apply so live values match.
      if (fresh.is_active) applyTheme(fresh);
      else {
        const active = list.find((t) => t.is_active);
        if (active) applyTheme(active);
      }
      setSavedAt(new Date());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const activate = async (id: number) => {
    setBusy(true);
    setErr(null);
    try {
      const activated = await obsApi.themeActivate(id);
      await refresh();
      applyTheme(activated);
      // Promote the activated theme into the editor pane regardless of
      // what was selected before — operators expect "Activate" to also
      // bring that theme up for editing, so the detail pane reflects
      // what's now live on the site.
      setSelectedId(activated.id);
      setDraft(activated);
      setSavedAt(new Date());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (id: number) => {
    setBusy(true);
    setErr(null);
    try {
      const clone = await obsApi.themeDuplicate(id);
      await refresh();
      setSelectedId(clone.id);
      setDraft(clone);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    const t = themes?.find((x) => x.id === id);
    if (!t) return;
    if (t.is_active) {
      alert("Can't delete the active theme — activate another one first.");
      return;
    }
    if (!confirm(`Delete the "${t.name}" theme?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.themeDelete(id);
      const list = await refresh();
      if (selectedId === id) {
        const fallback = list.find((x) => x.is_active) ?? list[0] ?? null;
        setSelectedId(fallback?.id ?? null);
        setDraft(fallback);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const createNew = async () => {
    setBusy(true);
    setErr(null);
    try {
      const created = await obsApi.themeCreate({ name: 'New theme' });
      await refresh();
      setSelectedId(created.id);
      setDraft(created);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const revert = () => {
    if (!themes || !draft) return;
    const fresh = themes.find((t) => t.id === draft.id) ?? null;
    setDraft(fresh);
    if (fresh?.is_active) applyTheme(fresh);
  };

  if (!themes) {
    return (
      <div className="control-card">
        <h2>Theme library</h2>
        <p className="text-white-50">Loading themes…</p>
      </div>
    );
  }

  return (
    <div className="theme-shell">
      <aside className="control-card theme-rail">
        <header className="d-flex justify-content-between align-items-center">
          <h2 className="m-0">Themes</h2>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={createNew}
            disabled={busy}
          >
            + New
          </button>
        </header>
        <ul className="theme-list">
          {themes.map((t) => (
            <li
              key={t.id}
              className={`theme-list-item${selectedId === t.id ? ' is-selected' : ''}${t.is_active ? ' is-active' : ''}`}
            >
              <button
                type="button"
                className="theme-list-button"
                onClick={() => setSelectedId(t.id)}
              >
                <div
                  className="theme-list-swatch"
                  style={{ background: swatchGradient(t) }}
                  aria-hidden
                />
                <div className="theme-list-name">
                  <strong>{t.name}</strong>
                  {t.is_active && (
                    <span className="badge bg-warning text-dark ms-2">Active</span>
                  )}
                </div>
              </button>
              <div className="theme-list-actions">
                {!t.is_active && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => activate(t.id)}
                    disabled={busy}
                    title="Make this theme live"
                  >
                    Activate
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={() => duplicate(t.id)}
                  disabled={busy}
                  title="Duplicate as a starting point"
                >
                  ⎘
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => remove(t.id)}
                  disabled={busy || t.is_active}
                  title={t.is_active ? 'Activate another theme first' : 'Delete'}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="theme-editor">
        {!draft ? (
          <div className="control-card">
            <p className="text-white-50 m-0">Select a theme to edit.</p>
          </div>
        ) : (
          <ThemeEditor
            draft={draft}
            set={set}
            dirty={dirty}
            busy={busy}
            err={err}
            savedAt={savedAt}
            onSave={save}
            onRevert={revert}
            onActivate={() => activate(draft.id)}
          />
        )}
      </section>
    </div>
  );
}

/**
 * Build the rail's per-theme swatch background. Cycles through every
 * accent slot the theme exposes so the swatch previews the FULL
 * palette at a glance — primary + primary_bright + secondary plus
 * the optional accent_1/2/3 trio.
 *
 * Empty accent slots fall back to the same chain the apply-time
 * bridge uses (accent_1 → primary_bright, accent_2 → primary,
 * accent_3 → secondary), so single-accent themes (Bloodmoon,
 * Wind Waker, etc.) still produce a clean gradient instead of
 * blank stops. Order interleaves the named accents with brand
 * colours so multi-colour themes (SNES PAL) show all four PAL
 * face-button colours in the strip.
 */
function swatchGradient(t: ThemeSettings): string {
  const accent1 = t.accent_1 || t.primary_bright;
  const accent2 = t.accent_2 || t.primary;
  const accent3 = t.accent_3 || t.secondary;
  return (
    'linear-gradient(135deg, ' +
    `${t.primary} 0%, ` +
    `${accent1} 20%, ` +
    `${accent2} 40%, ` +
    `${accent3} 60%, ` +
    `${t.primary_bright} 80%, ` +
    `${t.secondary} 100%)`
  );
}

/**
 * Compact Save / Revert footer rendered at the bottom of every editor
 * card. The themes page is long enough that the header's Save sits
 * off-screen once you scroll into the omnibar / accent cards; this
 * keeps the action one click away no matter which card you're in.
 * Disabled until the draft is dirty so non-dirty cards don't show
 * actionable-looking buttons that wouldn't do anything.
 */
function CardSaveBar({
  dirty,
  busy,
  onSave,
  onRevert,
}: {
  dirty: boolean;
  busy: boolean;
  onSave: () => void;
  onRevert: () => void;
}) {
  return (
    <div className="d-flex justify-content-end align-items-center gap-2 mt-3 pt-3 border-top border-secondary border-opacity-25">
      {dirty && <span className="small text-warning me-2">Unsaved changes</span>}
      <button
        className="btn btn-sm btn-outline-light"
        disabled={!dirty || busy}
        onClick={onRevert}
      >
        Revert
      </button>
      <button
        className="btn btn-sm btn-bloodmoon"
        disabled={!dirty || busy}
        onClick={onSave}
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function ThemeEditor({
  draft,
  set,
  dirty,
  busy,
  err,
  savedAt,
  onSave,
  onRevert,
  onActivate,
}: {
  draft: ThemeSettings;
  set: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  dirty: boolean;
  busy: boolean;
  err: string | null;
  savedAt: Date | null;
  onSave: () => void;
  onRevert: () => void;
  onActivate: () => void;
}) {
  const saveBar = (
    <CardSaveBar dirty={dirty} busy={busy} onSave={onSave} onRevert={onRevert} />
  );
  return (
    <>
      <div className="control-card">
        <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-3">
            <h2 className="m-0">{draft.name}</h2>
            {draft.is_active ? (
              <span className="badge bg-warning text-dark">Active</span>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-bloodmoon"
                onClick={onActivate}
                disabled={busy}
              >
                Activate
              </button>
            )}
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            {savedAt && !dirty && (
              <span className="small text-white-50">
                Saved {savedAt.toLocaleTimeString('en-GB')}
              </span>
            )}
            {dirty && <span className="small text-warning">Unsaved changes</span>}
            <button
              className="btn btn-sm btn-outline-light"
              disabled={!dirty || busy}
              onClick={onRevert}
            >
              Revert
            </button>
            <button
              className="btn btn-sm btn-bloodmoon"
              disabled={!dirty || busy}
              onClick={onSave}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>
        {err && <div className="text-danger small mt-2">{err}</div>}

        <div className="mb-3 mt-3">
          <label className="d-block small text-white-50">Name</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>
      </div>

      <div className="control-card">
        <h2>Palette</h2>
        <div className="row g-3 mt-2">
          <ColorField label="Primary" value={draft.primary} onChange={(v) => set('primary', v)} />
          <ColorField label="Primary (bright)" value={draft.primary_bright} onChange={(v) => set('primary_bright', v)} />
          <ColorField label="Secondary" value={draft.secondary} onChange={(v) => set('secondary', v)} />
          <ColorField label="Background — top" value={draft.background_from} onChange={(v) => set('background_from', v)} />
          <ColorField label="Background — bottom" value={draft.background_to} onChange={(v) => set('background_to', v)} />
          <AngleField
            label="Background angle (°)"
            value={draft.background_gradient_angle}
            onChange={(v) => set('background_gradient_angle', v)}
            previewFrom={draft.background_from}
            previewTo={draft.background_to}
          />
          <ColorField label="Navbar tint" value={draft.navbar_tint_color} onChange={(v) => set('navbar_tint_color', v)} />
          <ColorField label="Text" value={draft.text_color} onChange={(v) => set('text_color', v)} />
          <ColorField label="Muted text" value={draft.text_muted} onChange={(v) => set('text_muted', v)} />
          <ColorField label="Lines / borders" value={draft.line_color} onChange={(v) => set('line_color', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Accents</h2>
        <p className="text-white-50 small mb-3 mt-1">
          Multi-colour palettes use these three slots to drive status badges,
          KPI underlines, and the omnibar ticker accent. Blank fields fall
          back to primary_bright / primary / secondary.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Accent 1 (success)" value={draft.accent_1} onChange={(v) => set('accent_1', v)} />
          <ColorField label="Accent 2 (warning)" value={draft.accent_2} onChange={(v) => set('accent_2', v)} />
          <ColorField label="Accent 3 (danger)" value={draft.accent_3} onChange={(v) => set('accent_3', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Card surfaces</h2>
        <p className="text-white-50 small mb-3 mt-1">
          The fill behind every <code>.control-card</code> and omnibar slot.
          Dark themes can leave the default semi-transparent black; bright
          themes (SNES, Game Boy) should set a solid light surface +
          matching dark text so cards stay readable.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Surface fill" value={draft.surface_color} onChange={(v) => set('surface_color', v)} />
          <ColorField label="Surface text" value={draft.surface_text_color} onChange={(v) => set('surface_text_color', v)} />
          <ColorField label="Surface border" value={draft.surface_border_color} onChange={(v) => set('surface_border_color', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Omnibar — lane + ticker</h2>
        <p className="text-white-50 small mb-3 mt-1">
          The omnibar normally inherits the per-game accent set by the
          playthrough state. Setting any field below overrides that to
          lock the broadcast layer to this theme regardless of which
          game is live. Per-section gradients live in the cards below;
          this card controls the lane fill + divider stripe + the
          legacy global tag colour (which acts as a fallback default
          for any section gradient you leave blank).
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Lane background" value={draft.omnibar_lane_bg} onChange={(v) => set('omnibar_lane_bg', v)} />
          <ColorField label="Global tag fallback" value={draft.omnibar_tag_color} onChange={(v) => set('omnibar_tag_color', v)} />
          <ColorField label="Ticker accent" value={draft.omnibar_ticker_accent} onChange={(v) => set('omnibar_ticker_accent', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Omnibar — logo / brand pill</h2>
        <p className="text-white-50 small mb-3 mt-1">
          Two-stop gradient (top → bottom) on the left chevron pill that
          carries the event logo. Blank stops fall back to the global
          tag fallback above.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Brand — from" value={draft.omnibar_brand_from} onChange={(v) => set('omnibar_brand_from', v)} />
          <ColorField label="Brand — to" value={draft.omnibar_brand_to} onChange={(v) => set('omnibar_brand_to', v)} />
          <ColorField label="Brand — text" value={draft.omnibar_brand_text} onChange={(v) => set('omnibar_brand_text', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Omnibar — top lane tag pill</h2>
        <p className="text-white-50 small mb-3 mt-1">
          Two-stop gradient on every panel tag pill in the top lane
          (current-game, objective, items-collected, setpiece, etc.).
          Blank stops fall back to the global tag fallback.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Top tag — from" value={draft.omnibar_top_tag_from} onChange={(v) => set('omnibar_top_tag_from', v)} />
          <ColorField label="Top tag — to" value={draft.omnibar_top_tag_to} onChange={(v) => set('omnibar_top_tag_to', v)} />
          <ColorField label="Top tag — text (on pill)" value={draft.omnibar_top_tag_text} onChange={(v) => set('omnibar_top_tag_text', v)} />
          <ColorField label="Top lane — body text" value={draft.omnibar_top_lane_text} onChange={(v) => set('omnibar_top_lane_text', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Omnibar — bottom lane tag pill</h2>
        <p className="text-white-50 small mb-3 mt-1">
          Two-stop gradient on every panel tag pill in the bottom lane
          (donation reel, charity info, schedule, milestones, etc.).
          Lets you give donation/charity content its own colour distinct
          from the top lane's game-state content. Blank stops fall back
          to the global tag fallback.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Bottom tag — from" value={draft.omnibar_bottom_tag_from} onChange={(v) => set('omnibar_bottom_tag_from', v)} />
          <ColorField label="Bottom tag — to" value={draft.omnibar_bottom_tag_to} onChange={(v) => set('omnibar_bottom_tag_to', v)} />
          <ColorField label="Bottom tag — text (on pill)" value={draft.omnibar_bottom_tag_text} onChange={(v) => set('omnibar_bottom_tag_text', v)} />
          <ColorField label="Bottom lane — body text" value={draft.omnibar_bottom_lane_text} onChange={(v) => set('omnibar_bottom_lane_text', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Omnibar — total raised / charity cluster</h2>
        <p className="text-white-50 small mb-3 mt-1">
          Two-stop gradient on the right-hand cluster (running total
          amount + beneficiary logos). The donation/charity right-side
          chrome you probably want to brand distinctly from the lanes.
          Blank stops fall back to the global tag fallback.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Total — from" value={draft.omnibar_total_from} onChange={(v) => set('omnibar_total_from', v)} />
          <ColorField label="Total — to" value={draft.omnibar_total_to} onChange={(v) => set('omnibar_total_to', v)} />
          <ColorField label="Total — text" value={draft.omnibar_total_text} onChange={(v) => set('omnibar_total_text', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Omnibar — celebration takeover</h2>
        <p className="text-white-50 small mb-3 mt-1">
          Defaults for the full-bar takeover that fires when an incentive
          is unlocked, a milestone is reached, or a schedule-entry sound
          trigger plays. Individual triggers can still override per-fire
          via the payload (<code>tag_color_from</code> +{' '}
          <code>tag_color_to</code>, <code>heading_color</code>,{' '}
          <code>sub_color</code>, <code>flash_color</code> on the
          schedule-entry sound trigger).
          Blank fields fall back to the baked-in gold-flash mood.
        </p>
        <div className="row g-3 mt-2">
          <ColorField label="Celebration — tag from" value={draft.omnibar_celebration_tag_from} onChange={(v) => set('omnibar_celebration_tag_from', v)} />
          <ColorField label="Celebration — tag to" value={draft.omnibar_celebration_tag_to} onChange={(v) => set('omnibar_celebration_tag_to', v)} />
          <ColorField label="Celebration — headline" value={draft.omnibar_celebration_heading} onChange={(v) => set('omnibar_celebration_heading', v)} />
          <ColorField label="Celebration — subhead" value={draft.omnibar_celebration_sub} onChange={(v) => set('omnibar_celebration_sub', v)} />
          <ColorField label="Celebration — flash" value={draft.omnibar_celebration_flash} onChange={(v) => set('omnibar_celebration_flash', v)} />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Branding</h2>
        <div className="row g-3 mt-2">
          <LogoPickerField label="Logo URL (wordmark)" value={draft.logo_url} onChange={(v) => set('logo_url', v)} placeholder="/assets/img/your-logo.svg" />
          <LogoPickerField label="Logo URL (small / compact)" value={draft.logo_small_url} onChange={(v) => set('logo_small_url', v)} placeholder="/assets/img/your-mark.svg" />
          <LogoPickerField label="Logo URL (omnibar pill)" value={draft.omnibar_logo_url} onChange={(v) => set('omnibar_logo_url', v)} placeholder="Blank = use site wordmark" />
          <TextField label="Favicon URL" value={draft.favicon_url} onChange={(v) => set('favicon_url', v)} placeholder="/assets/img/favicon.png" preview="image" />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Background media</h2>
        <div className="row g-3 mt-2">
          <TextField label="Background video URL" value={draft.background_video_url} onChange={(v) => set('background_video_url', v)} placeholder="https://…/loop.mp4" preview="video" />
          <TextField label="Background image URL" value={draft.background_image_url} onChange={(v) => set('background_image_url', v)} placeholder="https://…/bg.jpg" preview="image" />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Buttons + lines</h2>
        <div className="row g-3 mt-2">
          <ColorField label="Button gradient — from" value={draft.button_gradient_from} onChange={(v) => set('button_gradient_from', v)} />
          <ColorField label="Button gradient — to" value={draft.button_gradient_to} onChange={(v) => set('button_gradient_to', v)} />
          <AngleField
            label="Button angle (°)"
            value={draft.button_gradient_angle}
            onChange={(v) => set('button_gradient_angle', v)}
            previewFrom={draft.button_gradient_to}
            previewTo={draft.button_gradient_from}
          />
          <ColorField label="Button text" value={draft.button_text_color} onChange={(v) => set('button_text_color', v)} />
          <ColorField label="Button border" value={draft.button_border_color} onChange={(v) => set('button_border_color', v)} />
          <div className="col-md-3">
            <label className="d-block small text-white-50">Divider thickness</label>
            <input
              type="number"
              min={0}
              max={12}
              className="form-control form-control-sm"
              value={draft.divider_thickness}
              onChange={(e) => set('divider_thickness', Number(e.target.value) || 0)}
              style={{ maxWidth: 120 }}
            />
          </div>
          <div className="col-md-3">
            <label className="d-block small text-white-50">Image hue rotate (°)</label>
            <input
              type="number"
              min={-180}
              max={360}
              className="form-control form-control-sm"
              value={draft.image_hue_rotate}
              onChange={(e) => set('image_hue_rotate', Number(e.target.value) || 0)}
              style={{ maxWidth: 120 }}
            />
            <div className="small text-white-50 mt-1">
              Tint applied to decorative images so they match the palette.
              −50 = bloodmoon, 0 = sepia, +180 = teal.
            </div>
          </div>
          <ColorField
            label="Link colour"
            value={draft.link_color}
            onChange={(v) => set('link_color', v)}
          />
          <ColorField
            label="Link hover"
            value={draft.link_hover_color}
            onChange={(v) => set('link_hover_color', v)}
          />
        </div>
        {saveBar}
      </div>

      <div className="control-card">
        <h2>Fonts</h2>
        <div className="row g-3 mt-2">
          <TextField label="Heading font-family" value={draft.heading_font} onChange={(v) => set('heading_font', v)} placeholder="'Bungee', sans-serif" />
          <TextField label="Body font-family" value={draft.body_font} onChange={(v) => set('body_font', v)} placeholder="'Open Sans', sans-serif" />
        </div>
        {saveBar}
      </div>
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Parse value → { hex, alpha } so the colour picker + alpha slider
  // both work for hex AND rgba() inputs. Themes serialise borders /
  // muted text as `rgba(...)` for opacity control, so without the
  // alpha-aware parser those fields would never get a colour picker.
  const parsed = parseColor(value);
  const hex = parsed?.hex ?? null;
  const alpha = parsed?.alpha ?? 1;
  // Only surface the alpha slider when the source value already
  // implies opacity (rgba) or the user has dropped alpha below 1 via
  // the slider. Solid hex fields stay visually unchanged.
  const showAlpha = parsed?.hadAlpha ?? false;
  return (
    <div className="col-md-3">
      <label className="d-block small text-white-50">{label}</label>
      <div className="d-flex gap-2 align-items-center">
        {hex !== null && (
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(formatColor(e.target.value, alpha, showAlpha))}
            style={{ width: 36, height: 36, padding: 0, border: 0, background: 'transparent' }}
            title="Pick colour"
          />
        )}
        <input
          type="text"
          className="form-control form-control-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
      {hex !== null && (
        <div className="d-flex gap-2 align-items-center mt-1">
          <small className="text-white-50" style={{ minWidth: 36 }}>
            α {alpha.toFixed(2)}
          </small>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={alpha}
            onChange={(e) => onChange(formatColor(hex, Number(e.target.value), true))}
            style={{ flex: 1 }}
            title="Opacity"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Numeric input + range slider + live preview swatch for a gradient
 * angle (degrees, 0–360). The preview repaints in real time so the
 * operator can see how each angle change rotates the gradient
 * without having to save / reload. Wraps at 360°: typing 400 clamps
 * to 360, -10 clamps to 0.
 */
function AngleField({
  label,
  value,
  onChange,
  previewFrom,
  previewTo,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  previewFrom: string;
  previewTo: string;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(360, Math.round(n)));
  return (
    <div className="col-md-3">
      <label className="d-block small text-white-50">{label}</label>
      <div className="d-flex gap-2 align-items-center">
        <div
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.2)',
            background: `linear-gradient(${value}deg, ${previewFrom} 0%, ${previewTo} 100%)`,
            flexShrink: 0,
          }}
          title={`${value}°`}
        />
        <input
          type="number"
          min={0}
          max={360}
          step={5}
          className="form-control form-control-sm"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ maxWidth: 90 }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="form-range mt-1"
        title="Drag to rotate gradient"
      />
    </div>
  );
}

/** Parse a CSS colour string into a hex + alpha pair. Returns null
 *  when the input isn't a recognised hex / rgb / rgba — that lets the
 *  caller fall back to a plain text field. `hadAlpha` records whether
 *  the source value carried an explicit alpha so the field can decide
 *  whether to show the opacity slider by default. */
function parseColor(
  value: string,
): { hex: string; alpha: number; hadAlpha: boolean } | null {
  const trimmed = value.trim();
  // #rrggbb
  const hexMatch = /^#([0-9a-f]{6})$/i.exec(trimmed);
  if (hexMatch) {
    return { hex: `#${hexMatch[1].toLowerCase()}`, alpha: 1, hadAlpha: false };
  }
  // #rgb shorthand
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return { hex: `#${r}${r}${g}${g}${b}${b}`.toLowerCase(), alpha: 1, hadAlpha: false };
  }
  // rgb(r,g,b) / rgba(r,g,b,a). Tolerates spaces and percentages.
  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(trimmed);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    const a = rgbMatch[4] != null
      ? Math.min(1, Math.max(0, parseFloat(rgbMatch[4])))
      : 1;
    return {
      hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`,
      alpha: a,
      hadAlpha: rgbMatch[4] != null,
    };
  }
  return null;
}

/** Round-trip a hex + alpha back to a CSS string. Stays in hex when
 *  the colour is fully opaque AND the source value didn't already use
 *  rgba(), so plain palette swatches don't suddenly switch syntax on
 *  every edit. */
function formatColor(hex: string, alpha: number, preferRgba: boolean): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  if (clamped >= 0.999 && !preferRgba) return hex.toLowerCase();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [, rr, gg, bb] = m;
  const r = parseInt(rr, 16);
  const g = parseInt(gg, 16);
  const b = parseInt(bb, 16);
  // Trim trailing zeroes so 0.50 reads as 0.5 in the saved theme.
  const aStr = Number(clamped.toFixed(2)).toString();
  return `rgba(${r}, ${g}, ${b}, ${aStr})`;
}

/**
 * Logo picker — clickable trigger button shows the current selection
 * with a thumbnail; clicking opens a grid of all logos in the brand
 * folder with visible previews. A "Custom URL…" tile reveals a text
 * input for external images. Native `<select>` can't render images
 * in its options, so the picker is a custom disclosure instead.
 */
function LogoPickerField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const known = LOGO_CATALOG.find((opt) => opt.url === value);
  const isCustom = !!value && !known;
  const triggerLabel = !value
    ? '— Pick a logo —'
    : known
      ? known.label
      : 'Custom URL';
  const pick = (url: string) => {
    onChange(url);
    setOpen(false);
  };
  return (
    <div className="col-md-4">
      <label className="d-block small text-white-50">{label}</label>
      <button
        type="button"
        className="form-control form-control-sm d-flex align-items-center"
        style={{ gap: 8, textAlign: 'left', cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {value ? (
          <img
            src={value}
            alt=""
            style={{
              height: 24,
              maxWidth: 60,
              objectFit: 'contain',
              background: 'rgba(0,0,0,0.25)',
              padding: 2,
              borderRadius: 3,
              flex: '0 0 auto',
            }}
          />
        ) : null}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {triggerLabel}
        </span>
        <span aria-hidden style={{ opacity: 0.6 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          className="mt-2 p-2"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 8,
            }}
          >
            <LogoTile
              label="— None —"
              selected={!value}
              onClick={() => pick('')}
            />
            {LOGO_CATALOG.map((opt) => (
              <LogoTile
                key={opt.url}
                label={opt.label}
                imgSrc={opt.url}
                selected={value === opt.url}
                onClick={() => pick(opt.url)}
              />
            ))}
            <LogoTile
              label="Custom URL…"
              selected={isCustom}
              onClick={() => {
                if (!isCustom) onChange('');
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {isCustom && (
        <input
          type="text"
          className="form-control form-control-sm mt-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
        />
      )}
    </div>
  );
}

function LogoTile({
  label,
  imgSrc,
  selected,
  onClick,
}: {
  label: string;
  imgSrc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 6,
        background: selected ? 'rgba(231, 19, 71, 0.25)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? 'rgba(231,19,71,0.7)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6,
        cursor: 'pointer',
        color: '#fff',
        minHeight: 88,
      }}
    >
      <div
        style={{
          width: '100%',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 4,
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span aria-hidden style={{ opacity: 0.6, fontSize: '0.8em' }}>—</span>
        )}
      </div>
      <span
        style={{
          fontSize: '0.7rem',
          textAlign: 'center',
          lineHeight: 1.2,
          opacity: 0.9,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {label}
      </span>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  preview,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  preview?: 'image' | 'video';
}) {
  return (
    <div className="col-md-4">
      <label className="d-block small text-white-50">{label}</label>
      <input
        type="text"
        className="form-control form-control-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      {preview === 'image' && value && (
        <img
          src={value}
          alt=""
          style={{
            marginTop: 8,
            maxHeight: 64,
            maxWidth: '100%',
            background: 'rgba(0,0,0,0.25)',
            padding: 4,
            borderRadius: 4,
          }}
        />
      )}
      {preview === 'video' && value && (
        <video
          src={value}
          autoPlay
          muted
          loop
          playsInline
          style={{
            marginTop: 8,
            maxHeight: 96,
            maxWidth: '100%',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.25)',
          }}
        />
      )}
    </div>
  );
}

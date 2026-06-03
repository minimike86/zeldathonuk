import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ThemeSettings } from '@/lib/obsApi';
import { onThemeChanged } from '@/lib/themeBus';
import { resolveMediaUrl } from '@/lib/env';

/** localStorage key holding the last resolved theme as a `:root{…}` CSS string.
 *  index.html's preload <script> applies it before first paint (no flash);
 *  applyTheme() refreshes it after every successful fetch. */
export const THEME_CSS_KEY = 'zeldathon-theme-css';

/**
 * Pulls the singleton theme from /api/theme/ on a short interval (3s) so
 * cross-browser / cross-device theme switches read as effectively
 * instant. Same-browser tabs get a true zero-latency push via
 * BroadcastChannel — see `lib/themeBus.ts` and the `bump` dep below,
 * which forces an immediate re-fetch the moment a notify arrives.
 *
 * All theme-aware styles read off CSS custom properties on :root (with
 * hardcoded fallbacks so blank fields don't break the visual). Drop
 * this component once at the router root.
 *
 * Optionally renders a looping <video> background when the theme defines
 * `background_video_url` AND the caller opts in via `renderBackgroundMedia`.
 * OBS overlay layouts (ObsLayout) leave this off so the browser source
 * stays fully transparent.
 */
export function ThemeProvider({
  renderBackgroundMedia = false,
  pollMs = 30000,
}: {
  renderBackgroundMedia?: boolean;
  /** Theme re-fetch interval. The default 30s suits same-browser surfaces
   *  (control panel / public site) that already get an instant BroadcastChannel
   *  push on change. OBS browser sources are a SEPARATE browser, so the bus
   *  never reaches them — ObsLayout passes a short interval so theme switches
   *  land on the overlays within a couple of seconds, not up to 30. */
  pollMs?: number;
} = {}) {
  // Bumping this state restarts the polled-query effect, which triggers
  // an immediate fetch. Other tabs notify via BroadcastChannel after a
  // mutation, so the visible theme catches up within one render frame
  // rather than waiting for the next poll tick.
  const [bump, setBump] = useState(0);
  useEffect(() => onThemeChanged(() => setBump((b) => b + 1)), []);

  const { data: theme } = usePolledQuery(obsApi.themeSettings, pollMs, [bump], {
    cacheKey: 'zeldathon-theme',
  });

  useEffect(() => {
    if (!theme) return;
    applyTheme(theme);
  }, [theme]);

  if (!renderBackgroundMedia) return null;
  if (!theme?.background_video_url) return null;
  return (
    <video
      className="theme-bg-video"
      src={theme.background_video_url}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
    />
  );
}

export function applyTheme(t: ThemeSettings): void {
  const root = document.documentElement;
  // Record every var we set so the resolved theme can be cached for the
  // no-flash preload (index.html applies it before first paint next load).
  const applied: Record<string, string> = {};
  const setVar = (name: string, value: string): void => {
    root.style.setProperty(name, value);
    applied[name] = value;
  };
  const setOrClearVar = (name: string, value: string): void => {
    // Empty → remove so the CSS `var(--x, fallback)` chain re-applies the
    // baked-in default (and the var stays out of the cached snapshot).
    if (value) setVar(name, value);
    else root.style.removeProperty(name);
  };
  setVar('--theme-primary', t.primary);
  setVar('--theme-primary-bright', t.primary_bright);
  setVar('--theme-secondary', t.secondary);
  setVar('--theme-bg-from', t.background_from);
  setVar('--theme-bg-to', t.background_to);
  setVar('--theme-bg-angle', `${t.background_gradient_angle}deg`);
  setVar('--theme-navbar-tint', t.navbar_tint_color);
  setVar('--theme-text', t.text_color);
  setVar('--theme-text-muted', t.text_muted);
  setVar('--theme-line', t.line_color);
  setVar('--theme-button-from', t.button_gradient_from);
  setVar('--theme-button-to', t.button_gradient_to);
  setVar('--theme-button-angle', `${t.button_gradient_angle}deg`);
  setVar('--theme-button-text', t.button_text_color);
  setVar('--theme-button-border', t.button_border_color);
  setVar('--theme-divider-thickness', `${t.divider_thickness}px`);
  setVar('--theme-image-hue-rotate', `${t.image_hue_rotate}deg`);
  setVar('--theme-link', t.link_color);
  setVar('--theme-link-hover', t.link_hover_color);

  // Multi-colour accents — empty fields resolve to a sensible existing
  // palette value at apply time, so a theme that hasn't been updated
  // for the new fields still drives sensible badge / KPI colours.
  setVar('--theme-accent-1', t.accent_1 || t.primary_bright);
  setVar('--theme-accent-2', t.accent_2 || t.primary);
  setVar('--theme-accent-3', t.accent_3 || t.secondary);
  // Card / panel surface — solid override for bright themes. Empty
  // value here means "don't set the var", which lets the CSS-level
  // fallback (the legacy semi-transparent bloodmoon card) re-apply.
  setOrClearVar('--theme-surface', t.surface_color);
  setOrClearVar('--theme-surface-text', t.surface_text_color);
  setOrClearVar('--theme-surface-border', t.surface_border_color);
  // Omnibar overrides. Same pattern — empty → unset → CSS fallback
  // wins. For omnibar_lane_bg the fallback is the baked-in steel
  // gradient; for omnibar_tag_color the fallback is --obs-accent (set
  // per-game by the playthrough state machine); for the ticker accent
  // the fallback is the primary_bright we already broadcast.
  setOrClearVar('--theme-omnibar-lane-bg', t.omnibar_lane_bg);
  setOrClearVar('--theme-omnibar-tag', t.omnibar_tag_color);
  setOrClearVar('--theme-omnibar-ticker', t.omnibar_ticker_accent);
  // Per-section gradient stops. Each pair has its own fallback chain
  // in omnibar.css → `--theme-omnibar-tag` → `--obs-accent`, so a
  // theme that fills only the brand pair still gets the rest from the
  // deprecated single-colour default + per-game accent.
  setOrClearVar('--theme-omnibar-brand-from', t.omnibar_brand_from);
  setOrClearVar('--theme-omnibar-brand-to', t.omnibar_brand_to);
  setOrClearVar('--theme-omnibar-brand-text', t.omnibar_brand_text);
  setOrClearVar('--theme-omnibar-top-tag-from', t.omnibar_top_tag_from);
  setOrClearVar('--theme-omnibar-top-tag-to', t.omnibar_top_tag_to);
  // Tag pill text and lane body text are independent — the pill sits
  // on the gradient, the body sits on the lane background. Each var
  // is set only when the theme provides a value, so the CSS-level
  // fallback chain (tag → lane → --theme-text) keeps working.
  setOrClearVar('--theme-omnibar-top-tag-text', t.omnibar_top_tag_text);
  setOrClearVar('--theme-omnibar-top-lane-text', t.omnibar_top_lane_text);
  setOrClearVar('--theme-omnibar-bottom-tag-from', t.omnibar_bottom_tag_from);
  setOrClearVar('--theme-omnibar-bottom-tag-to', t.omnibar_bottom_tag_to);
  setOrClearVar('--theme-omnibar-bottom-tag-text', t.omnibar_bottom_tag_text);
  setOrClearVar('--theme-omnibar-bottom-lane-text', t.omnibar_bottom_lane_text);
  setOrClearVar('--theme-omnibar-total-from', t.omnibar_total_from);
  setOrClearVar('--theme-omnibar-total-to', t.omnibar_total_to);
  setOrClearVar('--theme-omnibar-total-text', t.omnibar_total_text);
  // Celebration banner defaults — each trigger can still override
  // per-fire via payload.tag_color / heading_color / sub_color
  // (CelebrationBanner applies those as inline styles, which win
  // over these defaults).
  setOrClearVar('--theme-omnibar-celebration-tag', t.omnibar_celebration_tag);
  setOrClearVar('--theme-omnibar-celebration-tag-from', t.omnibar_celebration_tag_from);
  setOrClearVar('--theme-omnibar-celebration-tag-to', t.omnibar_celebration_tag_to);
  setOrClearVar('--theme-omnibar-celebration-heading', t.omnibar_celebration_heading);
  setOrClearVar('--theme-omnibar-celebration-sub', t.omnibar_celebration_sub);
  setOrClearVar('--theme-omnibar-celebration-flash', t.omnibar_celebration_flash);

  setVar('--theme-font-heading', t.heading_font);
  setVar('--theme-font-body', t.body_font);
  // Media URLs wrap in url(...) so they can be referenced via background.
  // resolveMediaUrl re-points any loopback/relative value at the API origin so
  // the public site doesn't try to fetch a localhost media path.
  const bgImage = resolveMediaUrl(t.background_image_url);
  setVar('--theme-bg-image', bgImage ? `url("${bgImage}")` : 'none');
  setVar('--theme-bg-video', resolveMediaUrl(t.background_video_url));
  setVar('--theme-logo', resolveMediaUrl(t.logo_url));
  setVar('--theme-logo-small', resolveMediaUrl(t.logo_small_url));

  const faviconUrl = resolveMediaUrl(t.favicon_url);
  if (faviconUrl) {
    let link = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }

  // Cache the resolved CSS vars so index.html's preload <script> can apply
  // them on the next load BEFORE first paint — eliminates the bloodmoon→theme
  // flash (and the logo/bg swap, since those are CSS vars too).
  try {
    const css =
      ':root{' + Object.keys(applied).map((k) => `${k}:${applied[k]}`).join(';') + '}';
    window.localStorage.setItem(THEME_CSS_KEY, css);
  } catch {
    /* private mode / quota — preload just falls back to the CSS defaults */
  }
}

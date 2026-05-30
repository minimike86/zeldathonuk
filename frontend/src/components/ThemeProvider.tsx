import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ThemeSettings } from '@/lib/obsApi';
import { onThemeChanged } from '@/lib/themeBus';

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
}: {
  renderBackgroundMedia?: boolean;
} = {}) {
  // Bumping this state restarts the polled-query effect, which triggers
  // an immediate fetch. Other tabs notify via BroadcastChannel after a
  // mutation, so the visible theme catches up within one render frame
  // rather than waiting for the next poll tick.
  const [bump, setBump] = useState(0);
  useEffect(() => onThemeChanged(() => setBump((b) => b + 1)), []);

  const { data: theme } = usePolledQuery(obsApi.themeSettings, 3000, [bump]);

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

/** Set a CSS custom property on the root, or remove it when the value
 *  is an empty string. Removing lets the `var(--x, fallback)` chain
 *  resolve to the fallback, which is how optional theme fields keep
 *  inheriting the baked-in defaults until an operator opts in. */
function setOrClear(root: HTMLElement, name: string, value: string): void {
  if (value) root.style.setProperty(name, value);
  else root.style.removeProperty(name);
}

export function applyTheme(t: ThemeSettings): void {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', t.primary);
  root.style.setProperty('--theme-primary-bright', t.primary_bright);
  root.style.setProperty('--theme-secondary', t.secondary);
  root.style.setProperty('--theme-bg-from', t.background_from);
  root.style.setProperty('--theme-bg-to', t.background_to);
  root.style.setProperty('--theme-bg-angle', `${t.background_gradient_angle}deg`);
  root.style.setProperty('--theme-navbar-tint', t.navbar_tint_color);
  root.style.setProperty('--theme-text', t.text_color);
  root.style.setProperty('--theme-text-muted', t.text_muted);
  root.style.setProperty('--theme-line', t.line_color);
  root.style.setProperty('--theme-button-from', t.button_gradient_from);
  root.style.setProperty('--theme-button-to', t.button_gradient_to);
  root.style.setProperty('--theme-button-angle', `${t.button_gradient_angle}deg`);
  root.style.setProperty('--theme-button-text', t.button_text_color);
  root.style.setProperty('--theme-button-border', t.button_border_color);
  root.style.setProperty('--theme-divider-thickness', `${t.divider_thickness}px`);
  root.style.setProperty('--theme-image-hue-rotate', `${t.image_hue_rotate}deg`);
  root.style.setProperty('--theme-link', t.link_color);
  root.style.setProperty('--theme-link-hover', t.link_hover_color);

  // Multi-colour accents — empty fields resolve to a sensible existing
  // palette value at apply time, so a theme that hasn't been updated
  // for the new fields still drives sensible badge / KPI colours.
  root.style.setProperty('--theme-accent-1', t.accent_1 || t.primary_bright);
  root.style.setProperty('--theme-accent-2', t.accent_2 || t.primary);
  root.style.setProperty('--theme-accent-3', t.accent_3 || t.secondary);
  // Card / panel surface — solid override for bright themes. Empty
  // value here means "don't set the var", which lets the CSS-level
  // fallback (the legacy semi-transparent bloodmoon card) re-apply.
  setOrClear(root, '--theme-surface', t.surface_color);
  setOrClear(root, '--theme-surface-text', t.surface_text_color);
  setOrClear(root, '--theme-surface-border', t.surface_border_color);
  // Omnibar overrides. Same pattern — empty → unset → CSS fallback
  // wins. For omnibar_lane_bg the fallback is the baked-in steel
  // gradient; for omnibar_tag_color the fallback is --obs-accent (set
  // per-game by the playthrough state machine); for the ticker accent
  // the fallback is the primary_bright we already broadcast.
  setOrClear(root, '--theme-omnibar-lane-bg', t.omnibar_lane_bg);
  setOrClear(root, '--theme-omnibar-tag', t.omnibar_tag_color);
  setOrClear(root, '--theme-omnibar-ticker', t.omnibar_ticker_accent);
  // Per-section gradient stops. Each pair has its own fallback chain
  // in omnibar.css → `--theme-omnibar-tag` → `--obs-accent`, so a
  // theme that fills only the brand pair still gets the rest from the
  // deprecated single-colour default + per-game accent.
  setOrClear(root, '--theme-omnibar-brand-from', t.omnibar_brand_from);
  setOrClear(root, '--theme-omnibar-brand-to', t.omnibar_brand_to);
  setOrClear(root, '--theme-omnibar-brand-text', t.omnibar_brand_text);
  setOrClear(root, '--theme-omnibar-top-tag-from', t.omnibar_top_tag_from);
  setOrClear(root, '--theme-omnibar-top-tag-to', t.omnibar_top_tag_to);
  // Tag pill text and lane body text are independent — the pill sits
  // on the gradient, the body sits on the lane background. Each var
  // is set only when the theme provides a value, so the CSS-level
  // fallback chain (tag → lane → --theme-text) keeps working.
  setOrClear(root, '--theme-omnibar-top-tag-text', t.omnibar_top_tag_text);
  setOrClear(root, '--theme-omnibar-top-lane-text', t.omnibar_top_lane_text);
  setOrClear(root, '--theme-omnibar-bottom-tag-from', t.omnibar_bottom_tag_from);
  setOrClear(root, '--theme-omnibar-bottom-tag-to', t.omnibar_bottom_tag_to);
  setOrClear(root, '--theme-omnibar-bottom-tag-text', t.omnibar_bottom_tag_text);
  setOrClear(root, '--theme-omnibar-bottom-lane-text', t.omnibar_bottom_lane_text);
  setOrClear(root, '--theme-omnibar-total-from', t.omnibar_total_from);
  setOrClear(root, '--theme-omnibar-total-to', t.omnibar_total_to);
  setOrClear(root, '--theme-omnibar-total-text', t.omnibar_total_text);
  // Celebration banner defaults — each trigger can still override
  // per-fire via payload.tag_color / heading_color / sub_color
  // (CelebrationBanner applies those as inline styles, which win
  // over these defaults).
  setOrClear(root, '--theme-omnibar-celebration-tag', t.omnibar_celebration_tag);
  setOrClear(root, '--theme-omnibar-celebration-tag-from', t.omnibar_celebration_tag_from);
  setOrClear(root, '--theme-omnibar-celebration-tag-to', t.omnibar_celebration_tag_to);
  setOrClear(root, '--theme-omnibar-celebration-heading', t.omnibar_celebration_heading);
  setOrClear(root, '--theme-omnibar-celebration-sub', t.omnibar_celebration_sub);
  setOrClear(root, '--theme-omnibar-celebration-flash', t.omnibar_celebration_flash);

  root.style.setProperty('--theme-font-heading', t.heading_font);
  root.style.setProperty('--theme-font-body', t.body_font);
  // Media URLs wrap in url(...) so they can be referenced via background.
  root.style.setProperty(
    '--theme-bg-image',
    t.background_image_url ? `url("${t.background_image_url}")` : 'none',
  );
  root.style.setProperty('--theme-bg-video', t.background_video_url || '');
  root.style.setProperty('--theme-logo', t.logo_url || '');
  root.style.setProperty('--theme-logo-small', t.logo_small_url || '');

  if (t.favicon_url) {
    let link = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = t.favicon_url;
  }
}

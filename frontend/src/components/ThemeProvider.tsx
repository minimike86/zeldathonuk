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

export function applyTheme(t: ThemeSettings): void {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', t.primary);
  root.style.setProperty('--theme-primary-bright', t.primary_bright);
  root.style.setProperty('--theme-secondary', t.secondary);
  root.style.setProperty('--theme-bg-from', t.background_from);
  root.style.setProperty('--theme-bg-to', t.background_to);
  root.style.setProperty('--theme-text', t.text_color);
  root.style.setProperty('--theme-text-muted', t.text_muted);
  root.style.setProperty('--theme-line', t.line_color);
  root.style.setProperty('--theme-button-from', t.button_gradient_from);
  root.style.setProperty('--theme-button-to', t.button_gradient_to);
  root.style.setProperty('--theme-button-text', t.button_text_color);
  root.style.setProperty('--theme-button-border', t.button_border_color);
  root.style.setProperty('--theme-divider-thickness', `${t.divider_thickness}px`);
  root.style.setProperty('--theme-image-hue-rotate', `${t.image_hue_rotate}deg`);
  root.style.setProperty('--theme-link', t.link_color);
  root.style.setProperty('--theme-link-hover', t.link_hover_color);
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

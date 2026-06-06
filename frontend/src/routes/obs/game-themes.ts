/**
 * Game/franchise visual themes for the /obs/audio-countdown visualiser.
 *
 * Every franchise (Zelda included) is a self-contained module under
 * scenes/franchises/<name>/ exporting an ordered `Array<{ match, theme }>`.
 * This file is the neutral registry: it concatenates them into one THEMES
 * cascade and resolves a playing track's `game` string to a theme.
 *
 * A theme carries CSS variables (background/primary/secondary/glow) plus an
 * optional `scenes` array of React components — one is picked at random when
 * the theme activates, so a game with several canonical settings shows variety.
 *
 * Match is fuzzy (substring). Cross-franchise matches are disjoint, so the
 * order between modules is irrelevant; each module orders its own matches
 * most-specific-first (e.g. "final fantasy vi" before "final fantasy v").
 */
import type { ComponentType, CSSProperties } from 'react';

import { zeldaThemes } from './scenes/franchises/zelda';
import { ffThemes } from './scenes/franchises/ff';
import { chronoThemes } from './scenes/franchises/chrono';
import { megamanThemes } from './scenes/franchises/megaman';
import { sonicThemes } from './scenes/franchises/sonic';
import { marioThemes } from './scenes/franchises/mario';
import { dkThemes } from './scenes/franchises/dk';
import { metroidThemes } from './scenes/franchises/metroid';
import { castlevaniaThemes } from './scenes/franchises/castlevania';
import { streetfighterThemes } from './scenes/franchises/streetfighter';
import { earthboundThemes } from './scenes/franchises/earthbound';
import { ducktalesThemes } from './scenes/franchises/ducktales';
import { miscThemes } from './scenes/franchises/misc';

export interface GameTheme {
  /** Display label, used by the now-playing card. */
  label: string;
  bgFrom: string;
  bgTo: string;
  primary: string;
  secondary: string;
  tertiary?: string;
  glow: string;
  /** One or more scene components — one picked at random when this theme activates. */
  scenes?: ComponentType[];
}

export const DEFAULT_THEME: GameTheme = {
  label: 'Bloodmoon',
  bgFrom: '#4c1324',
  bgTo: '#1a0a10',
  primary: '#e71347',
  secondary: '#62182f',
  tertiary: '#da4471',
  glow: 'rgba(231, 19, 71, 0.8)',
};

const THEMES: Array<{ match: string; theme: GameTheme }> = [
  ...zeldaThemes,
  ...ffThemes,
  ...chronoThemes,
  ...megamanThemes,
  ...sonicThemes,
  ...marioThemes,
  ...dkThemes,
  ...metroidThemes,
  ...castlevaniaThemes,
  ...streetfighterThemes,
  ...earthboundThemes,
  ...ducktalesThemes,
  ...miscThemes,
];

export function themeFor(gameName: string | undefined | null): GameTheme {
  if (!gameName) return DEFAULT_THEME;
  const normalised = gameName.toLowerCase();
  for (const { match, theme } of THEMES) {
    if (normalised.includes(match)) return theme;
  }
  return DEFAULT_THEME;
}

export function themeToCssVars(theme: GameTheme): CSSProperties {
  return {
    ['--ac-bg-from' as string]: theme.bgFrom,
    ['--ac-bg-to' as string]: theme.bgTo,
    ['--ac-primary' as string]: theme.primary,
    ['--ac-secondary' as string]: theme.secondary,
    ['--ac-tertiary' as string]: theme.tertiary ?? theme.primary,
    ['--ac-glow' as string]: theme.glow,
  };
}

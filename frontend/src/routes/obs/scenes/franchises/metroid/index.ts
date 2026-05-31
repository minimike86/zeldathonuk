import type { GameTheme } from '../../../game-themes';
import { SuperMetroidScene } from './SuperMetroidScene';
import { MetroidPrimeScene } from './MetroidPrimeScene';
import { MetroidScene } from './MetroidScene';

/**
 * Metroid franchise theme entries. Spread into the `THEMES` array in
 * game-themes.ts. Match substrings are ordered MOST-SPECIFIC FIRST because
 * themeFor returns on the first substring hit:
 *   'super metroid' before 'metroid prime' before the catch-all 'metroid'.
 */
export const metroidThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'super metroid',
    theme: {
      label: 'Super Metroid',
      bgFrom: '#0c2a2c',
      bgTo: '#04100f',
      primary: '#5fe8d6',
      secondary: '#1f7a78',
      tertiary: '#d63a6a',
      glow: 'rgba(95, 232, 214, 0.6)',
      scenes: [SuperMetroidScene],
    },
  },
  {
    match: 'metroid prime',
    theme: {
      label: 'Metroid Prime',
      bgFrom: '#1a2026',
      bgTo: '#060809',
      primary: '#f5821f',
      secondary: '#19c6d6',
      tertiary: '#ffd0a0',
      glow: 'rgba(245, 130, 31, 0.6)',
      scenes: [MetroidPrimeScene],
    },
  },
  {
    match: 'metroid',
    theme: {
      label: 'Metroid',
      bgFrom: '#2a0636',
      bgTo: '#100418',
      primary: '#5fe87a',
      secondary: '#e23b6a',
      tertiary: '#2aa84a',
      glow: 'rgba(95, 232, 122, 0.6)',
      scenes: [MetroidScene],
    },
  },
];

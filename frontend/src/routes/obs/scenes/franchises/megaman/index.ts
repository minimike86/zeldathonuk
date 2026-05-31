import type { ZeldaTheme } from '../../../zelda-themes';
import { MegaManXScene } from './MegaManXScene';
import { MegaMan9Scene } from './MegaMan9Scene';
import { MegaMan3Scene } from './MegaMan3Scene';
import { MegaMan2Scene } from './MegaMan2Scene';
import { MegaManScene } from './MegaManScene';

/**
 * Mega Man franchise theme entries. Spread into the `THEMES` array in
 * zelda-themes.ts. Most-specific `match` substrings MUST come first — themeFor
 * returns the first substring hit, so 'mega man x' / 'mega man 9' / 'mega man 3'
 * / 'mega man 2' are listed ahead of the bare 'mega man' fallback (covers 1/4/5).
 */
export const megamanThemes: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'mega man x',
    theme: {
      label: 'Mega Man X',
      bgFrom: '#06183f',
      bgTo: '#020a22',
      primary: '#28e6ff',
      secondary: '#1cd6ff',
      tertiary: '#7af6ff',
      glow: 'rgba(40, 230, 255, 0.7)',
      scenes: [MegaManXScene],
    },
  },
  {
    match: 'mega man 9',
    theme: {
      label: 'Mega Man 9',
      bgFrom: '#2f7fe0',
      bgTo: '#1b58b8',
      primary: '#e07a1a',
      secondary: '#0b63d8',
      tertiary: '#ffd07a',
      glow: 'rgba(224, 122, 26, 0.7)',
      scenes: [MegaMan9Scene],
    },
  },
  {
    match: 'mega man 3',
    theme: {
      label: 'Mega Man 3',
      bgFrom: '#243a5e',
      bgTo: '#1a2c47',
      primary: '#1763c8',
      secondary: '#5a6f8c',
      tertiary: '#ffd23a',
      glow: 'rgba(23, 99, 200, 0.7)',
      scenes: [MegaMan3Scene],
    },
  },
  {
    match: 'mega man 2',
    theme: {
      label: 'Mega Man 2',
      bgFrom: '#071640',
      bgTo: '#030a26',
      primary: '#2fd2ff',
      secondary: '#103a86',
      tertiary: '#7af6ff',
      glow: 'rgba(47, 210, 255, 0.7)',
      scenes: [MegaMan2Scene],
    },
  },
  {
    match: 'mega man',
    theme: {
      label: 'Mega Man',
      bgFrom: '#16284a',
      bgTo: '#0c1d3a',
      primary: '#28e6ff',
      secondary: '#0b63d8',
      tertiary: '#2f74dd',
      glow: 'rgba(40, 230, 255, 0.7)',
      scenes: [MegaManScene],
    },
  },
];

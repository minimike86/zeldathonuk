import type { GameTheme } from '../../../game-themes';
import { MegaManXScene } from './MegaManXScene';
import { MegaMan9Scene } from './MegaMan9Scene';
import { MegaMan6Scene } from './MegaMan6Scene';
import { MegaMan5Scene } from './MegaMan5Scene';
import { MegaMan4Scene } from './MegaMan4Scene';
import { MegaMan7Scene } from './MegaMan7Scene';
import { MegaMan8Scene } from './MegaMan8Scene';
import { MegaMan3Scene } from './MegaMan3Scene';
import { MegaMan2Scene } from './MegaMan2Scene';
import { MegaManZeroScene } from './MegaManZeroScene';
import { MegaManZxScene } from './MegaManZxScene';
import { MegaManScene } from './MegaManScene';

/**
 * Mega Man franchise theme entries. Spread into the `THEMES` array in
 * game-themes.ts. Most-specific `match` substrings MUST come first — themeFor
 * returns the first substring hit, so the specific titles ('mega man x',
 * numbered entries, 'mega man zero', 'mega man zx') are listed ahead of the
 * bare 'mega man' fallback (now mainly MM1). Note 'mega man zero' / 'mega man
 * zx' use their full strings so neither shadows the other nor the bare match.
 */
export const megamanThemes: Array<{ match: string; theme: GameTheme }> = [
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
    match: 'mega man 6',
    theme: {
      label: 'Mega Man 6',
      bgFrom: '#2f7fe0',
      bgTo: '#1b58b8',
      primary: '#e22a2a',
      secondary: '#1763c8',
      tertiary: '#ffd23a',
      glow: 'rgba(226, 42, 42, 0.7)',
      scenes: [MegaMan6Scene],
    },
  },
  {
    match: 'mega man 5',
    theme: {
      label: 'Mega Man 5',
      bgFrom: '#34465f',
      bgTo: '#1c2a3c',
      primary: '#1763c8',
      secondary: '#5c7290',
      tertiary: '#7af6ff',
      glow: 'rgba(122, 246, 255, 0.6)',
      scenes: [MegaMan5Scene],
    },
  },
  {
    match: 'mega man 4',
    theme: {
      label: 'Mega Man 4',
      bgFrom: '#7f93ad',
      bgTo: '#4e5f78',
      primary: '#1763c8',
      secondary: '#3a4656',
      tertiary: '#e8f1ff',
      glow: 'rgba(232, 241, 255, 0.6)',
      scenes: [MegaMan4Scene],
    },
  },
  {
    match: 'mega man 7',
    theme: {
      label: 'Mega Man 7',
      bgFrom: '#2f9be0',
      bgTo: '#1b8ad8',
      primary: '#e0521a',
      secondary: '#3ac06a',
      tertiary: '#9fe0ff',
      glow: 'rgba(159, 224, 255, 0.7)',
      scenes: [MegaMan7Scene],
    },
  },
  {
    match: 'mega man 8',
    theme: {
      label: 'Mega Man 8',
      bgFrom: '#3fb6d8',
      bgTo: '#1576a0',
      primary: '#2fe0ff',
      secondary: '#0c4f78',
      tertiary: '#bff0ff',
      glow: 'rgba(47, 224, 255, 0.7)',
      scenes: [MegaMan8Scene],
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
    match: 'mega man zero',
    theme: {
      label: 'Mega Man Zero',
      bgFrom: '#6e3418',
      bgTo: '#3a1c12',
      primary: '#c81a1a',
      secondary: '#ff8a3a',
      tertiary: '#5fffce',
      glow: 'rgba(255, 138, 58, 0.7)',
      scenes: [MegaManZeroScene],
    },
  },
  {
    match: 'mega man zx',
    theme: {
      label: 'Mega Man ZX',
      bgFrom: '#0a1f1d',
      bgTo: '#06100f',
      primary: '#1ad6c4',
      secondary: '#5fffe6',
      tertiary: '#0d3b38',
      glow: 'rgba(26, 214, 196, 0.7)',
      scenes: [MegaManZxScene],
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

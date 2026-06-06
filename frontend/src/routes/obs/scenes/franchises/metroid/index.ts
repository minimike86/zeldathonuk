import type { GameTheme } from '../../../game-themes';
import { SuperMetroidScene } from './SuperMetroidScene';
import { MetroidFusionScene } from './MetroidFusionScene';
import { MetroidPrime3Scene } from './MetroidPrime3Scene';
import { MetroidPrime2Scene } from './MetroidPrime2Scene';
import { MetroidPrimeScene } from './MetroidPrimeScene';
import { MetroidIIScene } from './MetroidIIScene';
import { MetroidScene } from './MetroidScene';

/**
 * Metroid franchise theme entries. Spread into the `THEMES` array in
 * game-themes.ts. Match substrings are ordered MOST-SPECIFIC FIRST because
 * themeFor returns on the first substring hit:
 *   'super metroid' / 'metroid fusion' / 'metroid prime 3' / 'metroid prime 2'
 *   before 'metroid prime', and 'metroid ii' before the catch-all 'metroid'.
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
    match: 'metroid fusion',
    theme: {
      label: 'Metroid Fusion',
      bgFrom: '#07302d',
      bgTo: '#03100f',
      primary: '#5fe8d6',
      secondary: '#1f7a78',
      tertiary: '#f5961e',
      glow: 'rgba(245, 150, 30, 0.6)',
      scenes: [MetroidFusionScene],
    },
  },
  {
    match: 'metroid prime 3',
    theme: {
      label: 'Metroid Prime 3',
      bgFrom: '#0a1830',
      bgTo: '#03060c',
      primary: '#3aa0ff',
      secondary: '#7ac6ff',
      tertiary: '#243a52',
      glow: 'rgba(58, 160, 255, 0.6)',
      scenes: [MetroidPrime3Scene],
    },
  },
  {
    match: 'metroid prime 2',
    theme: {
      label: 'Metroid Prime 2',
      bgFrom: '#1c4a30',
      bgTo: '#0c0418',
      primary: '#a8e8a0',
      secondary: '#a040d0',
      tertiary: '#e0c0ff',
      glow: 'rgba(160, 64, 208, 0.6)',
      scenes: [MetroidPrime2Scene],
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
    match: 'metroid ii',
    theme: {
      label: 'Metroid II',
      bgFrom: '#1a4a1a',
      bgTo: '#0a280a',
      primary: '#9bbc0f',
      secondary: '#306230',
      tertiary: '#0f380f',
      glow: 'rgba(155, 188, 15, 0.6)',
      scenes: [MetroidIIScene],
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

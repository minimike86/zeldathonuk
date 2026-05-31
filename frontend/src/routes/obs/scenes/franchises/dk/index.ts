import type { GameTheme } from '../../../game-themes';
import { DonkeyKongCountry2Scene } from './DonkeyKongCountry2Scene';
import { DonkeyKongCountry3Scene } from './DonkeyKongCountry3Scene';
import { DonkeyKongCountryScene } from './DonkeyKongCountryScene';
import { DonkeyKong64Scene } from './DonkeyKong64Scene';
import { DonkeyKongLandScene } from './DonkeyKongLandScene';
import { DonkeyKongScene } from './DonkeyKongScene';

/**
 * Donkey Kong franchise theme entries. Spread into the `THEMES` array in
 * game-themes.ts. Most-specific `match` substrings MUST come first — themeFor
 * returns the first substring hit, so the numbered Country entries are listed
 * ahead of bare 'donkey kong country', which precedes the 'donkey kong'
 * arcade fallback.
 */
export const dkThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'donkey kong country 2',
    theme: {
      label: 'Donkey Kong Country 2',
      bgFrom: '#3a1c52',
      bgTo: '#1a2e44',
      primary: '#a07cff',
      secondary: '#15324a',
      tertiary: '#ffb84a',
      glow: 'rgba(160, 124, 255, 0.7)',
      scenes: [DonkeyKongCountry2Scene],
    },
  },
  {
    match: 'donkey kong country 3',
    theme: {
      label: 'Donkey Kong Country 3',
      bgFrom: '#7fb0cf',
      bgTo: '#234e6c',
      primary: '#3f7396',
      secondary: '#1f4838',
      tertiary: '#dceaf4',
      glow: 'rgba(63, 115, 150, 0.7)',
      scenes: [DonkeyKongCountry3Scene],
    },
  },
  {
    match: 'donkey kong country',
    theme: {
      label: 'Donkey Kong Country',
      bgFrom: '#3e7438',
      bgTo: '#1c4a26',
      primary: '#6aa04a',
      secondary: '#7a4a22',
      tertiary: '#caa23a',
      glow: 'rgba(106, 160, 74, 0.7)',
      scenes: [DonkeyKongCountryScene],
    },
  },
  {
    match: 'donkey kong 64',
    theme: {
      label: 'Donkey Kong 64',
      bgFrom: '#f4d27a',
      bgTo: '#4e8a3a',
      primary: '#ffd23a',
      secondary: '#2f7a34',
      tertiary: '#e0341a',
      glow: 'rgba(255, 210, 58, 0.7)',
      scenes: [DonkeyKong64Scene],
    },
  },
  {
    match: 'donkey kong land',
    theme: {
      label: 'Donkey Kong Land',
      bgFrom: '#9bbc0f',
      bgTo: '#306230',
      primary: '#0f380f',
      secondary: '#306230',
      tertiary: '#8bac0f',
      glow: 'rgba(139, 172, 15, 0.6)',
      scenes: [DonkeyKongLandScene],
    },
  },
  {
    match: 'donkey kong',
    theme: {
      label: 'Donkey Kong',
      bgFrom: '#0a0a10',
      bgTo: '#050507',
      primary: '#e0341a',
      secondary: '#ffd23a',
      tertiary: '#9a5a28',
      glow: 'rgba(224, 52, 26, 0.7)',
      scenes: [DonkeyKongScene],
    },
  },
];

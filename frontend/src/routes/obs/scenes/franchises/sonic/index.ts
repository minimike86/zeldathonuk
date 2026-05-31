import type { GameTheme } from '../../../game-themes';
import { SonicScene } from './SonicScene';
import { Sonic2Scene } from './Sonic2Scene';
import { Sonic3Scene } from './Sonic3Scene';
import { SonicCdScene } from './SonicCdScene';
import { Sonic3dScene } from './Sonic3dScene';

/**
 * Sonic the Hedgehog franchise theme entries. Spread into the `THEMES` array
 * in game-themes.ts. Most-specific `match` substrings come FIRST (themeFor
 * returns the first substring hit) so the bare 'sonic' fallback stays last.
 */
export const sonicThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'sonic the hedgehog 3',
    theme: {
      label: 'Sonic 3',
      bgFrom: '#d8662c',
      bgTo: '#ffb24a',
      primary: '#1fc7bf',
      secondary: '#d8662c',
      tertiary: '#ffd23a',
      glow: 'rgba(255, 178, 74, 0.7)',
      scenes: [Sonic3Scene],
    },
  },
  {
    match: 'sonic the hedgehog 2',
    theme: {
      label: 'Sonic 2',
      bgFrom: '#b0308c',
      bgTo: '#2a1060',
      primary: '#5b9bff',
      secondary: '#ff4fb0',
      tertiary: '#7a3fd0',
      glow: 'rgba(255, 79, 176, 0.7)',
      scenes: [Sonic2Scene],
    },
  },
  {
    match: 'sonic cd',
    theme: {
      label: 'Sonic CD',
      bgFrom: '#4fc3f7',
      bgTo: '#c8f2c0',
      primary: '#36b85a',
      secondary: '#1f8edb',
      tertiary: '#e23b6f',
      glow: 'rgba(255, 226, 122, 0.7)',
      scenes: [SonicCdScene],
    },
  },
  {
    match: 'sonic 3d',
    theme: {
      label: 'Sonic 3D Blast',
      bgFrom: '#aee8b6',
      bgTo: '#f0fae8',
      primary: '#4fbf5e',
      secondary: '#2f7ce0',
      tertiary: '#ffd23a',
      glow: 'rgba(79, 191, 94, 0.6)',
      scenes: [Sonic3dScene],
    },
  },
  {
    match: 'sonic',
    theme: {
      label: 'Sonic the Hedgehog',
      bgFrom: '#1f8edb',
      bgTo: '#9fdcff',
      primary: '#37c14a',
      secondary: '#1a6fd6',
      tertiary: '#ffd23a',
      glow: 'rgba(31, 142, 219, 0.7)',
      scenes: [SonicScene],
    },
  },
];

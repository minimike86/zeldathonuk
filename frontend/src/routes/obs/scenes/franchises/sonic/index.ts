import type { GameTheme } from '../../../game-themes';
import { SonicScene } from './SonicScene';
import { Sonic2Scene } from './Sonic2Scene';
import { Sonic3Scene } from './Sonic3Scene';
import { SonicCdScene } from './SonicCdScene';
import { Sonic3dScene } from './Sonic3dScene';
import { KnucklesScene } from './KnucklesScene';
import { SonicAdventure2Scene } from './SonicAdventure2Scene';
import { SonicAdventureScene } from './SonicAdventureScene';
import { SonicManiaScene } from './SonicManiaScene';
import { SonicHeroesScene } from './SonicHeroesScene';
import { SonicColorsScene } from './SonicColorsScene';

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
    match: 'knuckles',
    theme: {
      label: 'Sonic & Knuckles',
      bgFrom: '#6fae3a',
      bgTo: '#d4e89a',
      primary: '#c0392b',
      secondary: '#3f7a2c',
      tertiary: '#e0a23a',
      glow: 'rgba(192, 57, 43, 0.6)',
      scenes: [KnucklesScene],
    },
  },
  {
    match: 'sonic adventure 2',
    theme: {
      label: 'Sonic Adventure 2',
      bgFrom: '#1f6f9e',
      bgTo: '#aee4d0',
      primary: '#7fe0c8',
      secondary: '#2f5e7a',
      tertiary: '#ffe27a',
      glow: 'rgba(127, 224, 200, 0.6)',
      scenes: [SonicAdventure2Scene],
    },
  },
  {
    match: 'sonic adventure',
    theme: {
      label: 'Sonic Adventure',
      bgFrom: '#2ec8e8',
      bgTo: '#d4f6fa',
      primary: '#1fb8d8',
      secondary: '#2fbf7a',
      tertiary: '#ffd23a',
      glow: 'rgba(46, 200, 232, 0.6)',
      scenes: [SonicAdventureScene],
    },
  },
  {
    match: 'sonic mania',
    theme: {
      label: 'Sonic Mania',
      bgFrom: '#2a0e4e',
      bgTo: '#2a1550',
      primary: '#ff5fa8',
      secondary: '#33e6d0',
      tertiary: '#ffe27a',
      glow: 'rgba(255, 95, 168, 0.65)',
      scenes: [SonicManiaScene],
    },
  },
  {
    match: 'sonic heroes',
    theme: {
      label: 'Sonic Heroes',
      bgFrom: '#29c4cc',
      bgTo: '#d2f6ee',
      primary: '#19c0c8',
      secondary: '#3fb86a',
      tertiary: '#e8dcb4',
      glow: 'rgba(25, 192, 200, 0.6)',
      scenes: [SonicHeroesScene],
    },
  },
  {
    match: 'sonic colors',
    theme: {
      label: 'Sonic Colours',
      bgFrom: '#160a3a',
      bgTo: '#1a0e30',
      primary: '#b07cff',
      secondary: '#33e6d0',
      tertiary: '#ff5fa8',
      glow: 'rgba(176, 124, 255, 0.65)',
      scenes: [SonicColorsScene],
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

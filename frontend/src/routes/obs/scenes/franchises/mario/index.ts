import type { ZeldaTheme } from '../../../zelda-themes';
import { SuperMarioBros3Scene } from './SuperMarioBros3Scene';
import { SuperMarioBros2Scene } from './SuperMarioBros2Scene';
import { YoshisIslandScene } from './YoshisIslandScene';
import { SuperMarioGalaxyScene } from './SuperMarioGalaxyScene';
import { SuperMarioWorldScene } from './SuperMarioWorldScene';
import { SuperMario64Scene } from './SuperMario64Scene';
import { SuperMarioRpgScene } from './SuperMarioRpgScene';
import { MarioKartScene } from './MarioKartScene';
import { SuperMarioBrosScene } from './SuperMarioBrosScene';
import { MarioScene } from './MarioScene';

/**
 * Mario franchise theme entries. Spread into the `THEMES` array in
 * zelda-themes.ts. Match substrings are ordered MOST-SPECIFIC FIRST because
 * themeFor returns on the first substring hit:
 *   'super mario bros. 3' before 'super mario bros. 2' before 'super mario bros';
 *   'super mario world 2' (Yoshi's Island) before 'super mario world';
 *   'super mario galaxy' / '64' / 'rpg' before the bare 'super mario world';
 *   'mario kart' before the catch-all 'mario'.
 */
export const marioThemes: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'super mario bros. 3',
    theme: {
      label: 'Super Mario Bros. 3',
      bgFrom: '#4a9ff0',
      bgTo: '#bfe3ff',
      primary: '#e23b3b',
      secondary: '#9a6326',
      tertiary: '#ffffff',
      glow: 'rgba(226, 59, 59, 0.6)',
      scenes: [SuperMarioBros3Scene],
    },
  },
  {
    match: 'super mario bros. 2',
    theme: {
      label: 'Super Mario Bros. 2',
      bgFrom: '#6a1f9a',
      bgTo: '#b03ca8',
      primary: '#d6203a',
      secondary: '#7a2db0',
      tertiary: '#f6ecdc',
      glow: 'rgba(154, 76, 214, 0.6)',
      scenes: [SuperMarioBros2Scene],
    },
  },
  {
    match: 'super mario world 2',
    theme: {
      label: "Yoshi's Island",
      bgFrom: '#bfeaff',
      bgTo: '#eef9d8',
      primary: '#5fd64a',
      secondary: '#f47a2a',
      tertiary: '#fbe06a',
      glow: 'rgba(95, 214, 74, 0.6)',
      scenes: [YoshisIslandScene],
    },
  },
  {
    match: 'super mario galaxy',
    theme: {
      label: 'Super Mario Galaxy',
      bgFrom: '#2a1f6a',
      bgTo: '#070424',
      primary: '#7af0ff',
      secondary: '#c86adf',
      tertiary: '#ffd23a',
      glow: 'rgba(122, 240, 255, 0.6)',
      scenes: [SuperMarioGalaxyScene],
    },
  },
  {
    match: 'super mario world',
    theme: {
      label: 'Super Mario World',
      bgFrom: '#3a9ff5',
      bgTo: '#aee0ff',
      primary: '#4caf50',
      secondary: '#e23b3b',
      tertiary: '#5fd64a',
      glow: 'rgba(76, 175, 80, 0.6)',
      scenes: [SuperMarioWorldScene],
    },
  },
  {
    match: 'super mario 64',
    theme: {
      label: 'Super Mario 64',
      bgFrom: '#4aa5f5',
      bgTo: '#cdeeff',
      primary: '#e23b3b',
      secondary: '#f0e6d2',
      tertiary: '#ffd0e6',
      glow: 'rgba(122, 196, 255, 0.6)',
      scenes: [SuperMario64Scene],
    },
  },
  {
    match: 'super mario rpg',
    theme: {
      label: 'Super Mario RPG',
      bgFrom: '#1a1452',
      bgTo: '#b06a3a',
      primary: '#ffd23a',
      secondary: '#5a3a7a',
      tertiary: '#fff6c8',
      glow: 'rgba(255, 210, 58, 0.6)',
      scenes: [SuperMarioRpgScene],
    },
  },
  {
    match: 'mario kart',
    theme: {
      label: 'Mario Kart',
      bgFrom: '#1f1452',
      bgTo: '#060320',
      primary: '#a07cff',
      secondary: '#7af0ff',
      tertiary: '#ffe83a',
      glow: 'rgba(160, 124, 255, 0.65)',
      scenes: [MarioKartScene],
    },
  },
  {
    match: 'super mario bros',
    theme: {
      label: 'Super Mario Bros.',
      bgFrom: '#5c94fc',
      bgTo: '#7aa8ff',
      primary: '#e23b3b',
      secondary: '#36c34a',
      tertiary: '#c8702a',
      glow: 'rgba(226, 59, 59, 0.6)',
      scenes: [SuperMarioBrosScene],
    },
  },
  {
    match: 'mario',
    theme: {
      label: 'Mario',
      bgFrom: '#4a9ff0',
      bgTo: '#aee0ff',
      primary: '#e23b3b',
      secondary: '#ffd23a',
      tertiary: '#36c34a',
      glow: 'rgba(226, 59, 59, 0.6)',
      scenes: [MarioScene],
    },
  },
];

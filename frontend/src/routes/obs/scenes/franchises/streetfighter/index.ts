import type { GameTheme } from '../../../game-themes';
import { StreetFighterScene } from './StreetFighterScene';
import { AlphaScene } from './AlphaScene';
import { ThirdStrikeScene } from './ThirdStrikeScene';
import { InkDojoScene } from './InkDojoScene';
import { WorldTourScene } from './WorldTourScene';

/**
 * Street Fighter franchise theme entries. Spread into the `THEMES` array in
 * game-themes.ts. `themeFor` returns the first substring hit, so entries are
 * ordered MOST-SPECIFIC FIRST to dodge substring traps:
 *   - 'street fighter iii' contains 'street fighter ii'
 *   - 'super street fighter' contains 'street fighter'
 *   - 'street fighter' (generic) must stay LAST as the fallback — it now mainly
 *     catches SF II / SF I, and uses the original Suzaku Castle scene.
 * Final match order: alpha, super, iii, iv, then the generic fallback.
 */
export const streetfighterThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'street fighter alpha',
    theme: {
      label: 'Street Fighter Alpha',
      bgFrom: '#ff8a3c',
      bgTo: '#1b6e80',
      primary: '#ffd06a',
      secondary: '#e8542e',
      tertiary: '#28aab4',
      glow: 'rgba(255, 160, 80, 0.6)',
      scenes: [AlphaScene],
    },
  },
  {
    match: 'super street fighter',
    theme: {
      label: 'Super Street Fighter II',
      bgFrom: '#2a8fe0',
      bgTo: '#cfe9fb',
      primary: '#9fd2f5',
      secondary: '#ffd23a',
      tertiary: '#286ec8',
      glow: 'rgba(120, 200, 255, 0.6)',
      scenes: [WorldTourScene],
    },
  },
  {
    match: 'street fighter iii',
    theme: {
      label: 'Street Fighter III',
      bgFrom: '#3a3a40',
      bgTo: '#1a1a1f',
      primary: '#ff3d7f',
      secondary: '#36e0a6',
      tertiary: '#7fd0ff',
      glow: 'rgba(255, 61, 127, 0.55)',
      scenes: [ThirdStrikeScene],
    },
  },
  {
    match: 'street fighter iv',
    theme: {
      label: 'Street Fighter IV',
      bgFrom: '#f4ecd8',
      bgTo: '#e6d4b0',
      primary: '#c01e26',
      secondary: '#120e0c',
      tertiary: '#d6bc96',
      glow: 'rgba(192, 30, 38, 0.5)',
      scenes: [InkDojoScene],
    },
  },
  {
    match: 'street fighter',
    theme: {
      label: 'Street Fighter II',
      bgFrom: '#e8542e',
      bgTo: '#2a103a',
      primary: '#ffd24a',
      secondary: '#c9202a',
      tertiary: '#9fe0ff',
      glow: 'rgba(255, 210, 74, 0.6)',
      scenes: [StreetFighterScene],
    },
  },
];

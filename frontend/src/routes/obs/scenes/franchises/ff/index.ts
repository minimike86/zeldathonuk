import type { GameTheme } from '../../../game-themes';
import { Ff14Scene } from './Ff14Scene';
import { Ff13Scene } from './Ff13Scene';
import { Ff12Scene } from './Ff12Scene';
import { Ff8Scene } from './Ff8Scene';
import { Ff7Scene } from './Ff7Scene';
import { Ff6Scene } from './Ff6Scene';
import { Ff9Scene } from './Ff9Scene';
import { Ff10Scene } from './Ff10Scene';
import { Ff5Scene } from './Ff5Scene';
import { Ff4Scene } from './Ff4Scene';
import { Ff3Scene } from './Ff3Scene';
import { Ff2Scene } from './Ff2Scene';
import { FfTacticsScene } from './FfTacticsScene';
import { FfAdventureScene } from './FfAdventureScene';
import { FfMysticQuestScene } from './FfMysticQuestScene';
import { FfScene } from './FfScene';

/**
 * Final Fantasy franchise theme entries for the audio-countdown visualiser.
 * Spread into the `THEMES` array in game-themes.ts.
 *
 * ORDER IS LOAD-BEARING — `themeFor` returns the first substring hit, so the
 * most-specific match MUST come first. Roman numerals nest badly: "final
 * fantasy x" is a substring of "...xii"/"...xiii"/"...xiv", "final fantasy vi"
 * is a prefix of "...vii"/"...viii", "...iii" contains "...ii", and bare
 * "final fantasy" is a prefix of everything. So every multi-letter suffix is
 * listed before the shorter ones it contains, and bare "final fantasy" is dead
 * last as the fallback (also catching XI/XV/XVI, which fall through to FFX's
 * neighbours — acceptable, they have few tracks).
 *
 * Sequence: XIV → XIII → XII → VIII → VII → VI → IX → X → V → IV → III → II →
 * Tactics → Adventure → Mystic Quest → (bare).
 */
export const ffThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'final fantasy xiv',
    theme: {
      label: 'Final Fantasy XIV',
      bgFrom: '#2f86c8',
      bgTo: '#1d5fa0',
      primary: '#8cc8ff',
      secondary: '#3c6096',
      tertiary: '#cfe8ff',
      glow: 'rgba(140, 200, 255, 0.7)',
      scenes: [Ff14Scene],
    },
  },
  {
    match: 'final fantasy xiii',
    theme: {
      label: 'Final Fantasy XIII',
      bgFrom: '#2c4e78',
      bgTo: '#1a2c44',
      primary: '#d2ebff',
      secondary: '#466eaf',
      tertiary: '#96c3f5',
      glow: 'rgba(210, 235, 255, 0.7)',
      scenes: [Ff13Scene],
    },
  },
  {
    match: 'final fantasy xii',
    theme: {
      label: 'Final Fantasy XII',
      bgFrom: '#b07a40',
      bgTo: '#6e4a26',
      primary: '#ffd98a',
      secondary: '#96683c',
      tertiary: '#e0a860',
      glow: 'rgba(255, 217, 138, 0.7)',
      scenes: [Ff12Scene],
    },
  },
  {
    match: 'final fantasy viii',
    theme: {
      label: 'Final Fantasy VIII',
      bgFrom: '#134a6e',
      bgTo: '#0c2348',
      primary: '#5cc8d8',
      secondary: '#2a6f9e',
      tertiary: '#ffd98a',
      glow: 'rgba(92, 200, 216, 0.7)',
      scenes: [Ff8Scene],
    },
  },
  {
    match: 'final fantasy vii',
    theme: {
      label: 'Final Fantasy VII',
      bgFrom: '#10201c',
      bgTo: '#08120f',
      primary: '#7bff8a',
      secondary: '#2c504a',
      tertiary: '#cfe8d0',
      glow: 'rgba(123, 255, 138, 0.7)',
      scenes: [Ff7Scene],
    },
  },
  {
    match: 'final fantasy vi',
    theme: {
      label: 'Final Fantasy VI',
      bgFrom: '#4a2c64',
      bgTo: '#2a1a44',
      primary: '#c89aff',
      secondary: '#6e4080',
      tertiary: '#ff7adf',
      glow: 'rgba(200, 154, 255, 0.7)',
      scenes: [Ff6Scene],
    },
  },
  {
    match: 'final fantasy ix',
    theme: {
      label: 'Final Fantasy IX',
      bgFrom: '#243a64',
      bgTo: '#131f44',
      primary: '#ffce72',
      secondary: '#3a4f7a',
      tertiary: '#96603a',
      glow: 'rgba(255, 206, 114, 0.7)',
      scenes: [Ff9Scene],
    },
  },
  {
    match: 'final fantasy x',
    theme: {
      label: 'Final Fantasy X',
      bgFrom: '#102a52',
      bgTo: '#08142e',
      primary: '#8cc8ff',
      secondary: '#1a3a66',
      tertiary: '#5aaae6',
      glow: 'rgba(140, 200, 255, 0.7)',
      scenes: [Ff10Scene],
    },
  },
  {
    match: 'final fantasy v',
    theme: {
      label: 'Final Fantasy V',
      bgFrom: '#3a6e34',
      bgTo: '#1c3a1e',
      primary: '#ffd24a',
      secondary: '#4fd16a',
      tertiary: '#8aa84a',
      glow: 'rgba(255, 210, 74, 0.7)',
      scenes: [Ff5Scene],
    },
  },
  {
    match: 'final fantasy iv',
    theme: {
      label: 'Final Fantasy IV',
      bgFrom: '#0c1640',
      bgTo: '#050a24',
      primary: '#e8e2d0',
      secondary: '#962428',
      tertiary: '#ffd98a',
      glow: 'rgba(232, 226, 208, 0.7)',
      scenes: [Ff4Scene],
    },
  },
  {
    match: 'final fantasy iii',
    theme: {
      label: 'Final Fantasy III',
      bgFrom: '#1a2a5a',
      bgTo: '#0a1238',
      primary: '#cfe0ff',
      secondary: '#2c3f74',
      tertiary: '#96aae6',
      glow: 'rgba(207, 224, 255, 0.7)',
      scenes: [Ff3Scene],
    },
  },
  {
    match: 'final fantasy ii',
    theme: {
      label: 'Final Fantasy II',
      bgFrom: '#1a2048',
      bgTo: '#0a0f2e',
      primary: '#dcd2f0',
      secondary: '#2a3158',
      tertiary: '#b43c40',
      glow: 'rgba(220, 210, 240, 0.7)',
      scenes: [Ff2Scene],
    },
  },
  {
    match: 'final fantasy tactics',
    theme: {
      label: 'Final Fantasy Tactics',
      bgFrom: '#7a5e3c',
      bgTo: '#4a3826',
      primary: '#e6cd96',
      secondary: '#96603c',
      tertiary: '#963c32',
      glow: 'rgba(230, 205, 150, 0.7)',
      scenes: [FfTacticsScene],
    },
  },
  {
    match: 'final fantasy adventure',
    theme: {
      label: 'Final Fantasy Adventure',
      bgFrom: '#8cb86c',
      bgTo: '#6c9858',
      primary: '#dcf0b4',
      secondary: '#4a6e40',
      tertiary: '#78b068',
      glow: 'rgba(220, 240, 180, 0.7)',
      scenes: [FfAdventureScene],
    },
  },
  {
    match: 'final fantasy mystic quest',
    theme: {
      label: 'Final Fantasy Mystic Quest',
      bgFrom: '#6ab0ee',
      bgTo: '#3a86d8',
      primary: '#fff4c0',
      secondary: '#3c9050',
      tertiary: '#f06e46',
      glow: 'rgba(255, 244, 192, 0.7)',
      scenes: [FfMysticQuestScene],
    },
  },
  {
    match: 'final fantasy',
    theme: {
      label: 'Final Fantasy',
      bgFrom: '#0e1238',
      bgTo: '#06081f',
      primary: '#a0beff',
      secondary: '#16204a',
      tertiary: '#ffd24a',
      glow: 'rgba(160, 190, 255, 0.7)',
      scenes: [FfScene],
    },
  },
];

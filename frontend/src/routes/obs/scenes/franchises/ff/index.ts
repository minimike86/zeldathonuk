import type { ZeldaTheme } from '../../../zelda-themes';
import { Ff8Scene } from './Ff8Scene';
import { Ff7Scene } from './Ff7Scene';
import { Ff6Scene } from './Ff6Scene';
import { Ff9Scene } from './Ff9Scene';
import { Ff5Scene } from './Ff5Scene';
import { Ff4Scene } from './Ff4Scene';
import { Ff10Scene } from './Ff10Scene';
import { FfScene } from './FfScene';

/**
 * Final Fantasy franchise theme entries for the audio-countdown visualiser.
 * Spread into the `THEMES` array in zelda-themes.ts.
 *
 * ORDER IS LOAD-BEARING — `themeFor` returns the first substring hit, so the
 * most-specific match MUST come first. Roman numerals nest: "final fantasy vi"
 * is a prefix of "final fantasy vii"/"...viii", and "final fantasy" alone is a
 * prefix of everything, so it is listed dead last as the I/II/Adventure
 * fallback. Sequence: VIII → VII → VI → IX → V → IV → X → (bare).
 */
export const ffThemes: Array<{ match: string; theme: ZeldaTheme }> = [
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

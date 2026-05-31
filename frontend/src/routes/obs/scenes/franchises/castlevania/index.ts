import type { GameTheme } from '../../../game-themes';
import { SymphonyScene } from './SymphonyScene';
import { SuperCv4Scene } from './SuperCv4Scene';
import { Castlevania3Scene } from './Castlevania3Scene';
import { Castlevania2Scene } from './Castlevania2Scene';
import { CastlevaniaScene } from './CastlevaniaScene';

/**
 * Castlevania franchise theme entries. Spread into the `THEMES` array in
 * game-themes.ts. themeFor returns the FIRST substring hit, so the most
 * specific `match` strings MUST come first. Note 'castlevania iii' contains
 * 'castlevania ii', which contains 'castlevania' — hence the descending order.
 */
export const castlevaniaThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'symphony of the night',
    theme: {
      label: 'Symphony of the Night',
      bgFrom: '#141452',
      bgTo: '#1d1438',
      primary: '#ffcf57',
      secondary: '#4a3f9a',
      tertiary: '#e1d7b4',
      glow: 'rgba(255, 207, 87, 0.6)',
      scenes: [SymphonyScene],
    },
  },
  {
    match: 'super castlevania iv',
    theme: {
      label: 'Super Castlevania IV',
      bgFrom: '#4a0c12',
      bgTo: '#1c0406',
      primary: '#ffd76a',
      secondary: '#b3303e',
      tertiary: '#d4992e',
      glow: 'rgba(255, 215, 106, 0.6)',
      scenes: [SuperCv4Scene],
    },
  },
  {
    match: 'castlevania iii',
    theme: {
      label: 'Castlevania III',
      bgFrom: '#241a3c',
      bgTo: '#0c0816',
      primary: '#caa6ff',
      secondary: '#9a1a22',
      tertiary: '#7a5a2a',
      glow: 'rgba(202, 166, 255, 0.55)',
      scenes: [Castlevania3Scene],
    },
  },
  {
    match: 'castlevania ii',
    theme: {
      label: 'Castlevania II',
      bgFrom: '#16242c',
      bgTo: '#1a1030',
      primary: '#9fd8b0',
      secondary: '#6a4f9a',
      tertiary: '#d4a23a',
      glow: 'rgba(159, 216, 176, 0.5)',
      scenes: [Castlevania2Scene],
    },
  },
  {
    match: 'castlevania',
    theme: {
      label: 'Castlevania',
      bgFrom: '#3a0a18',
      bgTo: '#100308',
      primary: '#ff5a4a',
      secondary: '#b81e1e',
      tertiary: '#d4992e',
      glow: 'rgba(255, 90, 74, 0.6)',
      scenes: [CastlevaniaScene],
    },
  },
];

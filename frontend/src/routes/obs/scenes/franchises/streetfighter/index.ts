import type { ZeldaTheme } from '../../../zelda-themes';
import { StreetFighterScene } from './StreetFighterScene';

/**
 * Street Fighter franchise theme entries. Spread into the `THEMES` array in
 * zelda-themes.ts. A single broad 'street fighter' match covers SF II / Super
 * SF II and friends (themeFor returns the first substring hit).
 */
export const streetfighterThemes: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'street fighter',
    theme: {
      label: 'Street Fighter',
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

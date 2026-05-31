import type { ZeldaTheme } from '../../../zelda-themes';
import { EarthboundScene } from './EarthboundScene';

/**
 * EarthBound franchise theme entries. Spread into the `THEMES` array in
 * zelda-themes.ts. A single 'earthbound' match (themeFor returns the first
 * substring hit).
 */
export const earthboundThemes: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'earthbound',
    theme: {
      label: 'EarthBound',
      bgFrom: '#6a4f9e',
      bgTo: '#f2b07a',
      primary: '#ffd76a',
      secondary: '#7a5c8e',
      tertiary: '#3a6e64',
      glow: 'rgba(255, 215, 106, 0.55)',
      scenes: [EarthboundScene],
    },
  },
];

import type { ZeldaTheme } from '../../../zelda-themes';
import { ChronoCrossScene } from './ChronoCrossScene';
import { ChronoTriggerScene } from './ChronoTriggerScene';

/**
 * Chrono franchise theme entries. Spread into the `THEMES` array in
 * zelda-themes.ts. Most-specific `match` substrings come FIRST (themeFor
 * returns the first substring hit); 'chrono cross' precedes 'chrono trigger'
 * so neither shadows the other.
 */
export const chronoThemes: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'chrono cross',
    theme: {
      label: 'Chrono Cross',
      bgFrom: '#f0b85a',
      bgTo: '#1f7a76',
      primary: '#2fa6a0',
      secondary: '#f6d98a',
      tertiary: '#3f9a72',
      glow: 'rgba(47, 166, 160, 0.7)',
      scenes: [ChronoCrossScene],
    },
  },
  {
    match: 'chrono trigger',
    theme: {
      label: 'Chrono Trigger',
      bgFrom: '#b8543a',
      bgTo: '#f6d28a',
      primary: '#3a5fb0',
      secondary: '#f0a24a',
      tertiary: '#7fd4ff',
      glow: 'rgba(240, 162, 74, 0.7)',
      scenes: [ChronoTriggerScene],
    },
  },
];

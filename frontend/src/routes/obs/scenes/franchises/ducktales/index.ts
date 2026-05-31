import type { ZeldaTheme } from '../../../zelda-themes';
import { DuckTalesScene } from './DuckTalesScene';

/**
 * Franchise theme entries for the audio-countdown visualiser. Spread into the
 * `THEMES` array in zelda-themes.ts. Within a franchise, list the most-specific
 * `match` substrings first (themeFor returns the first substring hit); avoid a
 * literal `&` since some stored game labels carry the HTML entity `&amp;`.
 */
export const ducktalesThemes: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'ducktales',
    theme: {
      label: 'DuckTales',
      bgFrom: '#1c1147',
      bgTo: '#0a0620',
      primary: '#7af0ff',
      secondary: '#5a3fb0',
      tertiary: '#f0a830',
      glow: 'rgba(122, 240, 255, 0.7)',
      scenes: [DuckTalesScene],
    },
  },
];

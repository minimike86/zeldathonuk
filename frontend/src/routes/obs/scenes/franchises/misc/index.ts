import type { GameTheme } from '../../../game-themes';
import { KirbyScene } from './KirbyScene';
import { PokemonScene } from './PokemonScene';
import { MetalGearScene } from './MetalGearScene';
import { StarFoxScene } from './StarFoxScene';
import { SmashBrosScene } from './SmashBrosScene';

/**
 * Misc-franchise theme entries for the audio-countdown visualiser. Spread into
 * the `THEMES` array in game-themes.ts. Within a franchise, list the most-
 * specific `match` substrings first (themeFor returns the first substring hit);
 * avoid a literal `&` since some stored game labels carry the HTML entity
 * `&amp;`.
 */

/* Pokémon shares ONE theme object across two match strings — the accented
 * "pokémon" (matching stored labels) and the ASCII "pokemon" fallback. */
const pokemonTheme: GameTheme = {
  label: 'Pokémon',
  bgFrom: '#aee3ff',
  bgTo: '#bfe6a8',
  primary: '#4f9e44',
  secondary: '#ee3b3b',
  tertiary: '#f4d35e',
  glow: 'rgba(79, 158, 68, 0.6)',
  scenes: [PokemonScene],
};

export const miscThemes: Array<{ match: string; theme: GameTheme }> = [
  {
    match: 'kirby',
    theme: {
      label: 'Kirby',
      bgFrom: '#ffd6ea',
      bgTo: '#bfeffb',
      primary: '#ff8fbf',
      secondary: '#4fb158',
      tertiary: '#ffd94a',
      glow: 'rgba(255, 143, 191, 0.7)',
      scenes: [KirbyScene],
    },
  },
  { match: 'pokémon', theme: pokemonTheme },
  { match: 'pokemon', theme: pokemonTheme },
  {
    match: 'metal gear',
    theme: {
      label: 'Metal Gear',
      bgFrom: '#0d1c34',
      bgTo: '#16314e',
      primary: '#50f0a0',
      secondary: '#ff2a2a',
      tertiary: '#aecbe2',
      glow: 'rgba(80, 240, 160, 0.6)',
      scenes: [MetalGearScene],
    },
  },
  {
    match: 'star fox',
    theme: {
      label: 'Star Fox',
      bgFrom: '#11205e',
      bgTo: '#1c2f6e',
      primary: '#7af0ff',
      secondary: '#5468c8',
      tertiary: '#8aa0ec',
      glow: 'rgba(122, 240, 255, 0.7)',
      scenes: [StarFoxScene],
    },
  },
  {
    match: 'smash bros',
    theme: {
      label: 'Super Smash Bros.',
      bgFrom: '#1d3a78',
      bgTo: '#050b22',
      primary: '#dff0ff',
      secondary: '#3c82e6',
      tertiary: '#9fc6ff',
      glow: 'rgba(150, 200, 255, 0.8)',
      scenes: [SmashBrosScene],
    },
  },
];

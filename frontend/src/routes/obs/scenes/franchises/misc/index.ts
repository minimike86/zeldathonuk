import type { GameTheme } from '../../../game-themes';
import { KirbyScene } from './KirbyScene';
import { KirbyAdventureScene } from './KirbyAdventureScene';
import { KirbySuperStarScene } from './KirbySuperStarScene';
import { PokemonScene } from './PokemonScene';
import { PokemonJohtoScene } from './PokemonJohtoScene';
import { PokemonSinnohScene } from './PokemonSinnohScene';
import { MysteryDungeonScene } from './MysteryDungeonScene';
import { PokemonKalosScene } from './PokemonKalosScene';
import { MetalGearScene } from './MetalGearScene';
import { MetalGearSolid2Scene } from './MetalGearSolid2Scene';
import { MetalGearSolid3Scene } from './MetalGearSolid3Scene';
import { StarFoxScene } from './StarFoxScene';
import { StarFox64Scene } from './StarFox64Scene';
import { StarFoxAdventuresScene } from './StarFoxAdventuresScene';
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

/* Johto gens (Gold / Silver / Crystal) share ONE theme across three matches. */
const pokemonJohtoTheme: GameTheme = {
  label: 'Pokémon (Johto)',
  bgFrom: '#6e3a4a',
  bgTo: '#f0c060',
  primary: '#b14633',
  secondary: '#f4d35e',
  tertiary: '#d98b3a',
  glow: 'rgba(244, 211, 94, 0.6)',
  scenes: [PokemonJohtoScene],
};

/* Sinnoh gens (Diamond / Pearl / Platinum) share ONE theme across three matches. */
const pokemonSinnohTheme: GameTheme = {
  label: 'Pokémon (Sinnoh)',
  bgFrom: '#46587a',
  bgTo: '#c7d8ec',
  primary: '#7d90ad',
  secondary: '#9fd0ff',
  tertiary: '#dde9f6',
  glow: 'rgba(159, 208, 255, 0.6)',
  scenes: [PokemonSinnohScene],
};

/* Kalos gens (X / Y) share ONE theme across two matches. */
const pokemonKalosTheme: GameTheme = {
  label: 'Pokémon (Kalos)',
  bgFrom: '#0a1535',
  bgTo: '#233a66',
  primary: '#3a64ad',
  secondary: '#f4d35e',
  tertiary: '#7fc4ff',
  glow: 'rgba(244, 211, 94, 0.6)',
  scenes: [PokemonKalosScene],
};

export const miscThemes: Array<{ match: string; theme: GameTheme }> = [
  /* ── KIRBY ── specific titles before the bare 'kirby' fallback ── */
  {
    match: "kirby's adventure",
    theme: {
      label: "Kirby's Adventure",
      bgFrom: '#ffd0e6',
      bgTo: '#aee6fb',
      primary: '#ff8fbf',
      secondary: '#4fc05a',
      tertiary: '#ffd94a',
      glow: 'rgba(255, 143, 191, 0.7)',
      scenes: [KirbyAdventureScene],
    },
  },
  {
    match: 'kirby super star',
    theme: {
      label: 'Kirby Super Star',
      bgFrom: '#4aa3ec',
      bgTo: '#d4f0ff',
      primary: '#8b6fb0',
      secondary: '#ffd94a',
      tertiary: '#7ed07f',
      glow: 'rgba(139, 111, 176, 0.7)',
      scenes: [KirbySuperStarScene],
    },
  },
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

  /* ── POKÉMON ── gen-specific matches before the generic Kanto fallbacks ── */
  { match: 'pokémon gold', theme: pokemonJohtoTheme },
  { match: 'pokémon silver', theme: pokemonJohtoTheme },
  { match: 'pokémon crystal', theme: pokemonJohtoTheme },
  { match: 'pokémon diamond', theme: pokemonSinnohTheme },
  { match: 'pokémon pearl', theme: pokemonSinnohTheme },
  { match: 'pokémon platinum', theme: pokemonSinnohTheme },
  { match: 'pokémon x', theme: pokemonKalosTheme },
  { match: 'pokémon y', theme: pokemonKalosTheme },
  {
    match: 'mystery dungeon',
    theme: {
      label: 'Pokémon Mystery Dungeon',
      bgFrom: '#d8b6e6',
      bgTo: '#f0cdb6',
      primary: '#b890c9',
      secondary: '#ffb14a',
      tertiary: '#ffe39a',
      glow: 'rgba(255, 177, 74, 0.6)',
      scenes: [MysteryDungeonScene],
    },
  },
  /* Generic Kanto fallback — accented label + ASCII fallback, shared theme. */
  { match: 'pokémon', theme: pokemonTheme },
  { match: 'pokemon', theme: pokemonTheme },

  /* ── METAL GEAR ── numbered titles before the bare 'metal gear' fallback ── */
  {
    match: 'metal gear solid 2',
    theme: {
      label: 'Metal Gear Solid 2',
      bgFrom: '#050d1a',
      bgTo: '#0c2030',
      primary: '#50f0a0',
      secondary: '#ff2a2a',
      tertiary: '#aecbe2',
      glow: 'rgba(80, 240, 160, 0.6)',
      scenes: [MetalGearSolid2Scene],
    },
  },
  {
    match: 'metal gear solid 3',
    theme: {
      label: 'Metal Gear Solid 3',
      bgFrom: '#1d3315',
      bgTo: '#5c7a3d',
      primary: '#7da34a',
      secondary: '#ff2a2a',
      tertiary: '#e8f0a0',
      glow: 'rgba(125, 163, 74, 0.6)',
      scenes: [MetalGearSolid3Scene],
    },
  },
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

  /* ── STAR FOX ── specific titles before the bare 'star fox' fallback ── */
  {
    match: 'star fox 64',
    theme: {
      label: 'Star Fox 64',
      bgFrom: '#1a1f50',
      bgTo: '#d8743a',
      primary: '#7af0ff',
      secondary: '#5468c8',
      tertiary: '#ffc878',
      glow: 'rgba(122, 240, 255, 0.7)',
      scenes: [StarFox64Scene],
    },
  },
  {
    match: 'star fox adventures',
    theme: {
      label: 'Star Fox Adventures',
      bgFrom: '#143a1c',
      bgTo: '#6b9a4a',
      primary: '#3f9b46',
      secondary: '#e8c45a',
      tertiary: '#7af0c0',
      glow: 'rgba(232, 196, 90, 0.6)',
      scenes: [StarFoxAdventuresScene],
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

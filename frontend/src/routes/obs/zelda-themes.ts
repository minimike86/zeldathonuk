/**
 * Per-game visual themes for the /obs/audio-countdown overlay.
 *
 * Each theme has CSS variables (background, primary, secondary, glow) plus an
 * optional `scenes` array of React components — one is picked at random when
 * the theme activates, so games with more than one canonical setting can show
 * variety (Breath of the Wild has both Hyrule-at-sunset and Death Mountain;
 * future games can add forests, dungeons, etc).
 *
 * Match is fuzzy — longest substring matched first.
 */
import type { ComponentType, CSSProperties } from 'react';
import { WindWakerScene } from './scenes/WindWakerScene';
import { OcarinaScene } from './scenes/OcarinaScene';
import { MajorasMaskScene } from './scenes/MajorasMaskScene';
import { BotwScene } from './scenes/BotwScene';
import { BotwDeathMountainScene } from './scenes/BotwDeathMountainScene';
import { TotkScene } from './scenes/TotkScene';
import { TotkDepthsScene } from './scenes/TotkDepthsScene';
import { SkywardScene } from './scenes/SkywardScene';
import { TwilightScene } from './scenes/TwilightScene';
import { TwilightCastleScene } from './scenes/TwilightCastleScene';
import { TwilightWolfMidnaScene } from './scenes/TwilightWolfMidnaScene';
import { AlttpScene } from './scenes/AlttpScene';
import { NesScene } from './scenes/NesScene';
import { Zelda2Scene } from './scenes/Zelda2Scene';
import { OracleAgesScene } from './scenes/OracleAgesScene';
import { OracleSeasonsScene } from './scenes/OracleSeasonsScene';
import { AlbwScene } from './scenes/AlbwScene';
import { PhantomHourglassScene } from './scenes/PhantomHourglassScene';
import { FourSwordsAdventuresScene } from './scenes/FourSwordsAdventuresScene';
import { SpiritTracksScene } from './scenes/SpiritTracksScene';
import { MinishCapScene } from './scenes/MinishCapScene';
import { LinksAwakeningScene } from './scenes/LinksAwakeningScene';
import './scenes/scenes.css';

export interface ZeldaTheme {
  /** Display label, used by the now-playing card. */
  label: string;
  bgFrom: string;
  bgTo: string;
  primary: string;
  secondary: string;
  tertiary?: string;
  glow: string;
  /** One or more scene components — one picked at random when this theme activates. */
  scenes?: ComponentType[];
}

export const DEFAULT_THEME: ZeldaTheme = {
  label: 'Bloodmoon',
  bgFrom: '#4c1324',
  bgTo: '#1a0a10',
  primary: '#e71347',
  secondary: '#62182f',
  tertiary: '#da4471',
  glow: 'rgba(231, 19, 71, 0.8)',
};

const THEMES: Array<{ match: string; theme: ZeldaTheme }> = [
  {
    match: 'tears of the kingdom',
    theme: {
      label: 'Tears of the Kingdom',
      bgFrom: '#1f3540',
      bgTo: '#070d12',
      primary: '#5ad6c6',
      secondary: '#0b1f2a',
      tertiary: '#a17042',
      glow: 'rgba(90, 214, 198, 0.7)',
      scenes: [TotkScene, TotkDepthsScene],
    },
  },
  {
    match: 'breath of the wild',
    theme: {
      label: 'Breath of the Wild',
      bgFrom: '#1a3a4a',
      bgTo: '#08141c',
      primary: '#f56b1a',
      secondary: '#0d2533',
      tertiary: '#a8e3ff',
      glow: 'rgba(245, 107, 26, 0.7)',
      scenes: [BotwScene, BotwDeathMountainScene],
    },
  },
  {
    match: 'a link between worlds',
    theme: {
      label: 'A Link Between Worlds',
      bgFrom: '#2a1f4a',
      bgTo: '#0a0418',
      primary: '#ffc83d',
      secondary: '#3d2a6e',
      tertiary: '#a07cff',
      glow: 'rgba(255, 200, 61, 0.7)',
      scenes: [AlbwScene],
    },
  },
  {
    match: 'skyward sword',
    theme: {
      label: 'Skyward Sword',
      bgFrom: '#243d6e',
      bgTo: '#0a1a3a',
      primary: '#ffd24a',
      secondary: '#1d4d80',
      tertiary: '#7ec7ff',
      glow: 'rgba(255, 210, 74, 0.7)',
      scenes: [SkywardScene],
    },
  },
  {
    match: 'spirit tracks',
    theme: {
      label: 'Spirit Tracks',
      bgFrom: '#2c3a1c',
      bgTo: '#0d1208',
      primary: '#8bc34a',
      secondary: '#3e5223',
      tertiary: '#c89c5a',
      glow: 'rgba(139, 195, 74, 0.7)',
      scenes: [SpiritTracksScene],
    },
  },
  {
    match: 'phantom hourglass',
    theme: {
      label: 'Phantom Hourglass',
      bgFrom: '#103850',
      bgTo: '#04111c',
      primary: '#26b3d3',
      secondary: '#0a3146',
      tertiary: '#f0c54a',
      glow: 'rgba(38, 179, 211, 0.7)',
      scenes: [PhantomHourglassScene],
    },
  },
  {
    match: 'twilight princess',
    theme: {
      label: 'Twilight Princess',
      bgFrom: '#2a1130',
      bgTo: '#0c0418',
      primary: '#ffaa3a',
      secondary: '#3a1a44',
      tertiary: '#7e2d8e',
      glow: 'rgba(255, 170, 58, 0.7)',
      scenes: [TwilightScene, TwilightCastleScene, TwilightWolfMidnaScene],
    },
  },
  {
    match: 'the wind waker',
    theme: {
      label: 'The Wind Waker',
      bgFrom: '#0e3a52',
      bgTo: '#04121c',
      primary: '#3fd0e8',
      secondary: '#0a2f44',
      tertiary: '#ffe04a',
      glow: 'rgba(63, 208, 232, 0.7)',
      scenes: [WindWakerScene],
    },
  },
  {
    match: 'four swords adventures',
    theme: {
      label: 'Four Swords Adventures',
      bgFrom: '#1c2a52',
      bgTo: '#080c1c',
      primary: '#ff5566',
      secondary: '#162045',
      tertiary: '#5dd5ff',
      glow: 'rgba(255, 85, 102, 0.7)',
      scenes: [FourSwordsAdventuresScene],
    },
  },
  {
    match: "majora's mask",
    theme: {
      label: "Majora's Mask",
      bgFrom: '#2e1735',
      bgTo: '#0d0418',
      primary: '#bdda50',
      secondary: '#3b1d4a',
      tertiary: '#ee5b8a',
      glow: 'rgba(189, 218, 80, 0.7)',
      scenes: [MajorasMaskScene],
    },
  },
  {
    match: 'ocarina of time',
    theme: {
      label: 'Ocarina of Time',
      bgFrom: '#143f28',
      bgTo: '#061a10',
      primary: '#ffd23a',
      secondary: '#0e3320',
      tertiary: '#2a7adf',
      glow: 'rgba(255, 210, 58, 0.7)',
      scenes: [OcarinaScene],
    },
  },
  {
    match: 'oracle of ages',
    theme: {
      label: 'Oracle of Ages',
      // GBC palette: ocean blue, cyan, a touch of gold (Harp of Ages).
      bgFrom: '#1a548c',
      bgTo: '#0a2a4a',
      primary: '#7ad4ff',
      secondary: '#0a4a6e',
      tertiary: '#ffd23a',
      glow: 'rgba(122, 212, 255, 0.7)',
      scenes: [OracleAgesScene],
    },
  },
  {
    match: 'oracle of seasons',
    theme: {
      label: 'Oracle of Seasons',
      bgFrom: '#4a1f10',
      bgTo: '#180704',
      primary: '#f57a2a',
      secondary: '#5a2410',
      tertiary: '#ffc960',
      glow: 'rgba(245, 122, 42, 0.75)',
      scenes: [OracleSeasonsScene],
    },
  },
  {
    match: 'minish cap',
    theme: {
      label: 'The Minish Cap',
      bgFrom: '#1f4a1c',
      bgTo: '#081608',
      primary: '#7ce04a',
      secondary: '#225228',
      tertiary: '#ffe566',
      glow: 'rgba(124, 224, 74, 0.7)',
      scenes: [MinishCapScene],
    },
  },
  {
    match: "link's awakening",
    theme: {
      label: "Link's Awakening",
      bgFrom: '#1e3a5e',
      bgTo: '#070f1c',
      primary: '#ffb5c5',
      secondary: '#1a2d4a',
      tertiary: '#9bd6ff',
      glow: 'rgba(255, 181, 197, 0.7)',
      scenes: [LinksAwakeningScene],
    },
  },
  {
    match: 'a link to the past',
    theme: {
      label: 'A Link to the Past',
      bgFrom: '#3a2a08',
      bgTo: '#140e02',
      primary: '#ffd23a',
      secondary: '#4a3408',
      tertiary: '#a8e055',
      glow: 'rgba(255, 210, 58, 0.75)',
      scenes: [AlttpScene],
    },
  },
  {
    match: 'wand of gamelon',
    theme: {
      label: 'Wand of Gamelon',
      bgFrom: '#3a0a1a',
      bgTo: '#150307',
      primary: '#ff3855',
      secondary: '#4a0a1c',
      tertiary: '#ffa05a',
      glow: 'rgba(255, 56, 85, 0.7)',
    },
  },
  {
    match: 'zelda ii',
    theme: {
      label: 'Zelda II',
      bgFrom: '#3a1a4a',
      bgTo: '#0c0418',
      primary: '#ffd23a',
      secondary: '#3a1a4a',
      tertiary: '#ff5a3a',
      glow: 'rgba(255, 210, 58, 0.75)',
      scenes: [Zelda2Scene],
    },
  },
  {
    match: 'adventure of link',
    theme: {
      label: 'Zelda II',
      bgFrom: '#3a1a4a',
      bgTo: '#0c0418',
      primary: '#ffd23a',
      secondary: '#3a1a4a',
      tertiary: '#ff5a3a',
      glow: 'rgba(255, 210, 58, 0.75)',
      scenes: [Zelda2Scene],
    },
  },
  {
    match: 'the legend of zelda',
    theme: {
      label: 'The Legend of Zelda',
      bgFrom: '#1a3a1c',
      bgTo: '#061008',
      primary: '#ff8a3a',
      secondary: '#0e2210',
      tertiary: '#ffd83a',
      glow: 'rgba(255, 138, 58, 0.75)',
      scenes: [NesScene],
    },
  },
];

export function themeFor(gameName: string | undefined | null): ZeldaTheme {
  if (!gameName) return DEFAULT_THEME;
  const normalised = gameName.toLowerCase();
  for (const { match, theme } of THEMES) {
    if (normalised.includes(match)) return theme;
  }
  return DEFAULT_THEME;
}

export function themeToCssVars(theme: ZeldaTheme): CSSProperties {
  return {
    ['--ac-bg-from' as string]: theme.bgFrom,
    ['--ac-bg-to' as string]: theme.bgTo,
    ['--ac-primary' as string]: theme.primary,
    ['--ac-secondary' as string]: theme.secondary,
    ['--ac-tertiary' as string]: theme.tertiary ?? theme.primary,
    ['--ac-glow' as string]: theme.glow,
  };
}

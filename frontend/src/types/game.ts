// Ported from legacy/src/app/models/{game-item,prize-incentives,video-game}.ts

import type { HowLongToBeatGameDetail } from '@/types/howlongtobeat';

export interface GameItem {
  name: string;
  imgUrl: string;
  collected: boolean;
}

export interface DonationIncentive {
  name: string;
  type: string;
  typeColour: string;
  constraint: string;
  constraintColour: string;
  imageSrcUrl: string;
  imageHrefUrl: string;
  description: string;
  donationAmount: number;
}

export interface Prize {
  name: string;
  imageUrl: string;
  description: string;
  quantity: number;
  won: boolean;
}

export interface VideoGame {
  gameDetail: HowLongToBeatGameDetail;
  gameProgressKey: string;
  category: string;
  active: boolean;
  order: number;
}

export interface GameBadge {
  name: string;
  type: string;
  tooltip: string;
  url: string;
}

export interface GameRunner {
  name: string;
  streamer: boolean;
  channelUrl: string;
}

export interface ScheduledVideoGame extends VideoGame {
  platform: string;
  runners: GameRunner[];
  badges: GameBadge[];
  isLive: boolean;
  isCompleted: boolean;
}

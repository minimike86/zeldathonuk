import {HowLongToBeatGameDetail} from '../services/howlongtobeat-service/howlongtobeat-models';

export class VideoGame {
  public gameDetail: HowLongToBeatGameDetail;
  public gameProgressKey: string;
  public category: string;
  public active: boolean;
  public order: number;

  constructor(gameDetail: HowLongToBeatGameDetail, gameProgressKey: string,
              category: string, timeline: string, active: boolean, order: number) {
    this.gameDetail = gameDetail;
    this.gameProgressKey = gameProgressKey;
    this.category = category;
    this.active = active;
    this.order = order;
  }

}

export class ScheduledVideoGame extends VideoGame {
  public platform: string;
  public runners: GameRunner[];
  public badges: GameBadge[];
  public isLive: boolean;
  public isCompleted: boolean;
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

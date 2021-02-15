import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;

export class ZeldaGame {
  public coverArt: string;
  public gameName: string;
  public gameType: string;
  public gamePlatform: string;
  public gameRelYear: string;
  public gameEstimate: string;
  public timeline: string;
  public gameProgressKey: string;
  public active: boolean;
  public order: number;
  public extraBadges: GameBadge[];
  public runners: Runner[];
  public startDate: Timestamp;
  public endDate: Timestamp;
  public twitchGameId: string;

  constructor(coverArt: string, gameName: string, gameType: string, gamePlatform: string,
              gameRelYear: string, gameEstimate: string, timeline: string, gameProgressKey: string,
              active: boolean, order: number, extraBadges: GameBadge[], runners: Runner[],
              startDate: Timestamp, endDate: Timestamp, twitchGameId: string) {
    this.coverArt = coverArt;
    this.gameName = gameName;
    this.gameType = gameType;
    this.gamePlatform = gamePlatform;
    this.gameRelYear = gameRelYear;
    this.gameEstimate = gameEstimate;
    this.timeline = timeline;
    this.gameProgressKey = gameProgressKey;
    this.active = active;
    this.order = order;
    this.extraBadges = extraBadges;
    this.runners = runners;
    this.startDate = startDate;
    this.endDate = endDate;
    this.twitchGameId = twitchGameId;
  }

}

export interface GameBadge {
  type: string;
  text: string;
  url?: string;
}

export interface Runner {
  name: string;
  channelUrl: string;
}

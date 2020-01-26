export class ZeldaGame {
  public coverArt: string;
  public gameName: string;
  public gameType: string;
  public gamePlatform: string;
  public gameRelYear: string;
  public gameEstimate: string;
  public gameProgressKey: string;
  public active: boolean;

  constructor(coverArt: string, gameName: string, gameType: string, gamePlatform: string,
              gameRelYear: string, gameEstimate: string, gameProgressKey: string, active: boolean) {
    this.coverArt = coverArt;
    this.gameName = gameName;
    this.gameType = gameType;
    this.gamePlatform = gamePlatform;
    this.gameRelYear = gameRelYear;
    this.gameEstimate = gameEstimate;
    this.gameProgressKey = gameProgressKey;
    this.active = active;
  }

}

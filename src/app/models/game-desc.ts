export class GameDesc {
  public coverArt: string;
  public gameName: string;
  public gameType: string;
  public gamePlatform: string;
  public gameRelYear: string;
  public gameEstimate: string;

  constructor(coverArt: string, gameName: string, gameType: string, gamePlatform: string, gameRelYear: string, gameEstimate: string) {
    this.coverArt = coverArt;
    this.gameName = gameName;
    this.gameType = gameType;
    this.gamePlatform = gamePlatform;
    this.gameRelYear = gameRelYear;
    this.gameEstimate = gameEstimate;
  }

}

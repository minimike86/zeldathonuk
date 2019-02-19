export interface CurrentlyPlayingId extends CurrentlyPlaying {
  id: string;
}

export interface CurrentlyPlaying {
  coverArt: string;
  gameName: string;
  gameType: string;
  gamePlatform: string;
  gameRelYear: string;
  gameEstimate: string;
}

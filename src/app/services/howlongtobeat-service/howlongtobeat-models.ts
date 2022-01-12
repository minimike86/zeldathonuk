export interface HowLongToBeatSearchResult {
  id: string;
  title: string;
  boxArt: string;
  timeLabels: string[];
  gameplayMain: string;
  gameplayMainExtra: string;
  gameplayCompletionist: string;
  similarity: number;
  searchTerm: string;
}

export interface HowLongToBeatGameDetail {
  id: string|null;
  title: string|null;
  boxArt: string|null;
  titleGameTimes: TimeLabel[];
  detail: HowLongToBeatGameDetailInfo;
  additionalContent: HowLongToBeatGameAdditionalContent[];
  gameTimes: string|null;
  speedRunTimes: string|null;
  platformTimes: string|null;
}

export interface HowLongToBeatGameAdditionalContent {
  id: string|null;
  title: string|null;
  polled: string|number|null;
  rated: string|number|null;
  main: string|null;
  mainPlus: string|null;
  hundredPercent: string|null;
  all: string|null;
}

export interface TimeLabel {
  label: string;
  time: string;
}

export interface HowLongToBeatGameDetailInfo {
  description1: string|null;
  description2: string|null;
  platforms: string|null;
  genres: string|null;
  developer: string|null;
  publisher: string|null;
  releases: {
    NA: string|null;
    EU: string|null;
    JP: string|null;
  };
  updated: string|null;
}

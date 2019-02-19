
export interface CountUpTimerId extends CountUpTimer {
  id: string;
}

export interface CountUpTimer {
  hasPaused: boolean,
  isStarted: boolean,
  isStopped: boolean,
  startDate: Date,
  stopDate: Date
}

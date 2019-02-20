
export interface RunnerNameId extends RunnerName {
  id: string;
}

export interface RunnerName {
  runnerName: string;
  runnerHasTwitchAccount: boolean,
}

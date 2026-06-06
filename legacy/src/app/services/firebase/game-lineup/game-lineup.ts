import {ScheduledVideoGame, VideoGame} from '../../../models/video-game';
import {Timestamp} from '@firebase/firestore';

export interface GameLineUpId extends GameLineUp {
  id: string;
}

export interface GameLineUp {
  availableGames?: VideoGame[];
  activeSchedule?: ScheduledVideoGame[];
  startTimestamp?: Timestamp;
}

import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;

export interface CountUpTimerId extends CountUpTimer {
  id: string;
}

export interface CountUpTimer {
  hasPaused: boolean;
  isStarted: boolean;
  isStopped: boolean;
  startDate: Timestamp;
  stopDate: Timestamp;
}

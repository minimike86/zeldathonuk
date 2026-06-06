import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subscription } from 'rxjs';
import { FirebaseTimerService } from '../firebase/firebase-timer/firebase-timer.service';
import { CountUpTimerId } from '../firebase/firebase-timer/count-up-timer';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;


@Injectable({
  providedIn: 'root'
})
export class CountUpService {
  public subscription: Subscription;
  private secondsCounter$: Observable<any>;
  private countUpData: CountUpTimerId[];
  public includeMillisecs: boolean;
  public nowDate: Date;
  public hours: number;
  public minutes: number;
  public seconds: number;
  public milliseconds: number;
  public timer$: BehaviorSubject<string> = new BehaviorSubject<string>('00:00:00');

  constructor(private firebaseTimerService: FirebaseTimerService) {
    this.firebaseTimerService.getCountUpTimer().subscribe(data => {
      this.countUpData = data;
    });
    this.secondsCounter$ = interval(1);
    this.subscription = this.secondsCounter$.subscribe(n => {
      this.updateTimer();
    });
    this.includeMillisecs = false;
  }

  updateTimer(): void {
    if (this.countUpData !== undefined
      && this.countUpData[0] !== undefined
      && this.countUpData[0].startDate !== undefined) {
      if (this.getIsStarted()) {
        const startDateSeconds: number = this.countUpData[0].startDate.seconds * 1000;
        this.nowDate = new Date(new Date().getTime() - new Date(startDateSeconds).getTime());
        this.hours = this.nowDate.getUTCHours();
        this.minutes = this.nowDate.getUTCMinutes();
        this.seconds = this.nowDate.getUTCSeconds();
        if (this.includeMillisecs) {
          this.milliseconds = this.nowDate.getUTCMilliseconds();
          this.timer$.next(this.zeroPad(this.hours, 2) + ':' +
            this.zeroPad(this.minutes, 2) + ':' +
            this.zeroPad(this.seconds, 2) + '.' +
            this.zeroPad(this.milliseconds, 3));
        } else {
          this.timer$.next(this.zeroPad(this.hours, 2) + ':' +
            this.zeroPad(this.minutes, 2) + ':' +
            this.zeroPad(this.seconds, 2));
        }
      } else if (this.getHasPaused() && this.countUpData[0].stopDate !== null) {
        this.nowDate = new Date(
          new Date(this.countUpData[0].stopDate.seconds * 1000).getTime() -
          new Date(this.countUpData[0].startDate.seconds * 1000).getTime());
        this.hours = this.nowDate.getUTCHours();
        this.minutes = this.nowDate.getUTCMinutes();
        this.seconds = this.nowDate.getUTCSeconds();
        if (this.includeMillisecs) {
          this.milliseconds = this.nowDate.getUTCMilliseconds();
          this.timer$.next(this.zeroPad(this.hours, 2) + ':' +
            this.zeroPad(this.minutes, 2) + ':' +
            this.zeroPad(this.seconds, 2) + '.' +
            this.zeroPad(this.milliseconds, 3));
        } else {
          this.timer$.next(this.zeroPad(this.hours, 2) + ':' +
            this.zeroPad(this.minutes, 2) + ':' +
            this.zeroPad(this.seconds, 2));
        }
      } else if (this.getIsStopped()) {
        this.timer$.next('00:00:00');
      }
    }
  }

  getTimer(): Observable<string> {
    return this.timer$.asObservable();
  }

  getIsStarted(): boolean {
    return this.countUpData[0].isStarted;
  }

  getHasPaused(): boolean {
    return this.countUpData[0].hasPaused;
  }

  getIsStopped(): boolean {
    return this.countUpData[0].isStopped;
  }

  setIncludeMillisecs(value: boolean): void {
    this.includeMillisecs = value;
  }

  startNewTimer(timestamp: Timestamp) {
    this.firebaseTimerService.setCountUpTimerStartDate(timestamp);
    this.firebaseTimerService.setCountUpTimerStopDate(null);
    this.firebaseTimerService.setCountUpTimerIsStarted(true);
    this.firebaseTimerService.setCountUpTimerHasPaused(false);
    this.firebaseTimerService.setCountUpTimerIsStopped(false);
  }

  continueExistingTimer() {
    this.firebaseTimerService.setCountUpTimerIsStarted(true);
    this.firebaseTimerService.setCountUpTimerHasPaused(false);
  }

  resetStoppedTimer() {
    this.firebaseTimerService.setCountUpTimerStartDate(Timestamp.now());
    this.firebaseTimerService.setCountUpTimerStopDate(null);
    this.firebaseTimerService.setCountUpTimerIsStopped(true);
    this.firebaseTimerService.setCountUpTimerIsStarted(false);
    this.firebaseTimerService.setCountUpTimerHasPaused(false);
  }

  resetCurrentTimer() {
    this.firebaseTimerService.setCountUpTimerStartDate(Timestamp.now());
    this.firebaseTimerService.setCountUpTimerStopDate(null);
    this.firebaseTimerService.setCountUpTimerIsStarted(true);
    this.firebaseTimerService.setCountUpTimerHasPaused(false);
  }

  pauseTimer() {
    this.firebaseTimerService.setCountUpTimerIsStarted(false);
    this.firebaseTimerService.setCountUpTimerHasPaused(true);
  }

  stopTimer() {
    this.firebaseTimerService.setCountUpTimerStopDate(Timestamp.now());
    this.firebaseTimerService.setCountUpTimerIsStopped(true);
    this.firebaseTimerService.setCountUpTimerIsStarted(false);
    this.firebaseTimerService.setCountUpTimerHasPaused(false);
  }

  zeroPad(num: number, maxLen: number): string {
    if (maxLen > 2) {
      if (num < 10) {
        return ('00' + num);
      } else if (num < 100) {
        return ('0' + num);
      } else {
        return ('' + num);
      }
    } else if (maxLen <= 2) {
      if (num < 10) {
        return ('0' + num);
      } else {
        return ('' + num);
      }
    }
  }

}

import { Injectable } from '@angular/core';
import {BehaviorSubject, interval, Observable, Subscription} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CountupService {
  public subscription: Subscription;
  private secondsCounter$: Observable<any>;
  public isStarted: boolean;
  public hasPaused: boolean;
  public startDate: Date;
  public stopDate: Date;
  public nowDate: Date;
  public hours: number;
  public minutes: number;
  public seconds: number;
  public milliseconds: number;
  public timer$ = new BehaviorSubject<string>('00:00:00.000');

  constructor() {
    this.secondsCounter$ = interval(1);
    this.isStarted = false;
    this.hasPaused = false;
  }

  start(): void {
    console.log('start');
    if (!this.isStarted || this.hasPaused) {
      if (!this.hasPaused) {
        this.startDate = new Date();
      }
      this.isStarted = true;
      this.hasPaused = false;
      this.subscription = this.secondsCounter$.subscribe(n => {
        this.updateTimer();
      });
    }
  }

  reset(): void {
    console.log('reset');
    if (this.hasPaused) {
      this.isStarted = false;
      this.hasPaused = false;
    }
    this.startDate = new Date();
    this.updateTimer();
  }

  stop(): void {
    if (this.subscription !== undefined) {
      if (this.subscription.closed) {
        console.log('fully stop timer');
        // fully reset timer if pressed while subscription is closed
        this.isStarted = false;
        this.hasPaused = false;
        // console.log(this.timer$);
        // console.log(this.stopDate);
      } else {
        console.log('psuedo stop timer');
        // partially reset timer if pressed while subscription is active
        this.hasPaused = true;
        this.stopDate = new Date();
        this.subscription.unsubscribe();
      }
    }
  }

  updateTimer(): void {
    this.nowDate = new Date(new Date().getTime() - this.startDate.getTime());
    this.hours = this.nowDate.getUTCHours();
    this.minutes = this.nowDate.getUTCMinutes();
    this.seconds = this.nowDate.getUTCSeconds();
    this.milliseconds = this.nowDate.getUTCMilliseconds();
    this.timer$.next(this.zeroPad(this.hours, 2) + ':' +
      this.zeroPad(this.minutes, 2) + ':' +
      this.zeroPad(this.seconds, 2) + '.' +
      this.zeroPad(this.milliseconds, 3));
  }

  getTimer(): Observable<string> {
    return this.timer$.asObservable();
  }

  getIsStarted(): boolean {
    return this.isStarted;
  }

  getHasPaused(): boolean {
    return this.hasPaused;
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

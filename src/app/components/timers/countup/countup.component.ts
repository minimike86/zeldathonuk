import {Component, Input, OnInit} from '@angular/core';
import {interval, Observable, Subscription} from 'rxjs';
import {ActivatedRoute} from "@angular/router";


@Component({
  selector: 'app-countup',
  templateUrl: './countup.component.html',
  styleUrls: ['./countup.component.css']
})
export class CountupComponent implements OnInit {
  @Input() autoStart: boolean;
  private routeSub: any;

  public subscription: Subscription;
  private secondsCounter$: Observable<any>;
  public isStarted: boolean;
  public hasPaused: boolean;
  public stopDate: Date;
  public startDate: Date;
  public nowDate: Date;
  public hours: number;
  public minutes: number;
  public seconds: number;
  public milliseconds: number;
  public activityName: string;
  public timer: string;

  constructor(private route: ActivatedRoute) {
    this.secondsCounter$ = interval(1);
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.autoStart = parseInt(params.get('autoStart')) === 1;
      this.activityName = params.get('activityName');
    });
  }

  ngOnInit() {
    this.isStarted = false;
    this.hasPaused = false;
    if (this.autoStart) {
      this.start();
    }
  }

  start(): void {
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
        // fully reset timer if pressed while subscription is closed
        this.isStarted = false;
        this.hasPaused = false;
        console.log(this.timer);
        console.log(this.stopDate);
      } else {
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
    this.timer =  this.zeroPad(this.hours, 2) + ':' +
      this.zeroPad(this.minutes, 2) + ':' +
      this.zeroPad(this.seconds, 2) + '.' +
      this.zeroPad(this.milliseconds, 3);
  }

  getTimer(): string {
    return this.timer !== undefined ? this.timer : '00:00:00.000';
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

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
  public started: boolean;
  public stopDate: Date;
  public startDate: Date;
  public nowDate: Date;
  public hours: number;
  public minutes: number;
  public seconds: number;
  public milliseconds: number;
  public timer: string;

  constructor(private route: ActivatedRoute) {
    this.secondsCounter$ = interval(1);
    this.routeSub = this.route.params.subscribe(params => {
      this.autoStart = params['autoStart'];
    });
  }

  ngOnInit() {
    this.started = false;
    if (this.autoStart) {
      this.start();
    }
  }

  start(): void {
    console.log('timer started');
    if (!this.started) {
      this.startDate = new Date();
      this.started = true;
    }
    this.subscription = this.secondsCounter$.subscribe(n => {
      this.updateTimer();
    });
  }

  reset(): void {
    this.startDate = new Date();
    this.updateTimer();
    console.log('timer reset');
  }

  stop(): void {
    if (this.subscription !== undefined) {
      if (this.subscription.closed) {
        // fully reset timer if pressed while subscription is closed
        this.started = false;
        console.log('timer fully stopped');
        console.log(this.timer);
        console.log(this.stopDate);
      } else {
        // partially reset timer if pressed while subscription is active
        this.stopDate = new Date();
        this.subscription.unsubscribe();
        console.log('timer stopped');
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

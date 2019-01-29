import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {interval, Observable, Subscription} from "rxjs";

@Component({
  selector: 'app-count-date',
  templateUrl: './count-date.component.html',
  styleUrls: ['./count-date.component.css']
})
export class CountDateComponent implements OnInit {
  @Input() autoStart: boolean;
  private routeSub: any;

  public subscription: Subscription;
  private secondsCounter$: Observable<any>;
  public started: boolean;
  public stopDate: Date;
  public startDate: Date;
  public futureDate: Date;
  public timer: TimerToDate;

  constructor(private route: ActivatedRoute) {
    this.secondsCounter$ = interval(1000);
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.autoStart = parseInt(params.get('autoStart')) === 1;
      this.futureDate = new Date(parseInt(params.get('futureDate')));
    });
  }

  ngOnInit() {
    this.started = false;
    if (this.autoStart) {
      this.start();
    }
  }

  start(): void {
    if (!this.started) {
      this.started = true;
      this.subscription = this.secondsCounter$.subscribe(n => {
        console.log(n);
        this.updateTimer();
      });
      console.log('timer started');
    }
  }

  stop(): void {
    this.subscription.unsubscribe();
    console.log('timer stopped');
  }

  updateTimer(): void {
    const now = new Date();
    const milliseconds = this.futureDate.getTime() - now.getTime();
    const days = Math.floor(milliseconds / (1000*60*60*24));
    const hours = Math.floor(((milliseconds / (1000*60*60)) % 24));
    const minutes = Math.floor(((milliseconds / (1000*60)) % 60));
    const seconds = Math.floor((milliseconds / 1000) % 60);
    this.timer = {
        days: this.zeroPad(days, 2),
        hours: this.zeroPad(hours, 2),
        minutes: this.zeroPad(minutes, 2),
        seconds: this.zeroPad(seconds, 2),
    }
  }

  getTimer(): TimerToDate {
    return this.timer !== undefined ? this.timer : {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    };
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

  getMonthName(int: number): string {
    switch (int) {
      case 0: return 'January';
      case 1: return 'February';
      case 2: return 'March';
      case 3: return 'April';
      case 4: return 'May';
      case 5: return 'June';
      case 6: return 'July';
      case 7: return 'August';
      case 8: return 'September';
      case 9: return 'October';
      case 10: return 'November';
      case 11: return 'December';
    }
  }

}

export interface TimerToDate {
  days: string,
  hours: string,
  minutes: string,
  seconds: string
}

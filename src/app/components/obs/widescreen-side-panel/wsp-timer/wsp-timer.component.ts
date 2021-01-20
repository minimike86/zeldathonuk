import { Component, OnInit } from '@angular/core';
import { CountUpService } from '../../../../services/countup-service/countup.service';
import { map } from 'rxjs/operators';
import {Observable, of} from 'rxjs';

@Component({
  selector: 'app-wsp-timer',
  templateUrl: './wsp-timer.component.html',
  styleUrls: ['./wsp-timer.component.css']
})
export class WspTimerComponent implements OnInit {
  public countUpTimer$: Observable<string>;
  public countUpTimer: string;
  public timeToShow = 'local';
  public count = 0;

  constructor( private countUpService: CountUpService ) {
  }

  ngOnInit() {
    this.countUpTimer$ = this.countUpService.getTimer().pipe(map(countUpTimer => {
      return this.countUpTimer = countUpTimer;
    }));

    setInterval(() => {
      this.count++;
      if (this.count === 1) {
        this.timeToShow = 'total';    // after 15 seconds
      } else if (this.count === 2) {
        this.timeToShow = 'count-up'; // after 30 seconds
      } else if (this.count === 4 * 30) {
        this.timeToShow = 'local';    // after 30 minutes
        this.count = 0;
      }
    }, 15 * 1000);

  }

  getLocalTime(): Observable<string> {
    const localDate = new Date();
    const ampm = localDate.getUTCHours() >= 12 ? 'pm' : 'am';
    return of(this.prefixZero(localDate.getUTCHours()) + ':' +
           this.prefixZero(localDate.getUTCMinutes()) + ':' +
           this.prefixZero(localDate.getUTCSeconds()) + ' ' + ampm);
  }

  getTotalTime(): Observable<string> {
    const startDate = new Date(2021, 1, 20, 9, 0 , 0, 0);
    const endDate = new Date();
    const totalTimeInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
    const hours = Math.floor(totalTimeInSeconds / 3600);
    const minutes = Math.floor((totalTimeInSeconds - (hours * 3600)) / 60);
    const seconds = Math.floor((totalTimeInSeconds - (hours * 3600) - (minutes * 60)));
    return of(this.prefixZero(hours) + ':' + this.prefixZero(minutes) + ':' + this.prefixZero(seconds));
  }

  prefixZero(number: number): string {
    return number < 10 && number > 0 ? '0' + number  : number.toString();
  }

}

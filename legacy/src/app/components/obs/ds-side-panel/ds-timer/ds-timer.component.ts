import { Component, OnInit } from '@angular/core';
import { CountUpService } from '../../../../services/countup-service/countup.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-ds-timer',
  templateUrl: './ds-timer.component.html',
  styleUrls: ['./ds-timer.component.css']
})
export class DsTimerComponent implements OnInit {
  public countUpTimer$: Observable<string>;
  public countUpTimer: string;
  public timeToShow = 'local';
  public count = 0;

  public localTime$: Observable<string>;
  public totalTime$: Observable<string>;

  constructor( private countUpService: CountUpService ) {
  }

  ngOnInit() {
    this.countUpTimer$ = this.countUpService.getTimer().pipe(map(countUpTimer => {
      return this.countUpTimer = countUpTimer;
    }));

    setInterval(() => {
      if (this.count >= 0 && this.count < 30) {
        this.timeToShow = 'total';
        this.count++;
      } else if (this.count >= 30 && this.count < 60) {
        this.timeToShow = 'local';
        this.count++;
      } else {
        this.count = 0;
      }
    }, 1000);

  }

  getLocalTime(): Observable<string> {
    const localDate = new Date();
    const ampm = localDate.getUTCHours() >= 12 ? 'pm' : 'am';
    return of(this.prefixZero(localDate.getUTCHours()) + ':' +
      this.prefixZero(localDate.getUTCMinutes()) + ':' +
      this.prefixZero(localDate.getUTCSeconds()) + ampm);
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
    return number >= 0 && number < 10 ? '0' + number : number.toString();
  }

}

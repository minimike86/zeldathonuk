import {AfterViewInit, Component, OnInit} from '@angular/core';
import {TimeRemaining} from '../../audio-visualizer/audio-visualizer.component';
import {BreakCountdownService} from '../../../services/firebase/break-countdown/break-countdown.service';
import {map} from 'rxjs/operators';
import {interval, Observable, of} from 'rxjs';

@Component({
  selector: 'app-break-brb',
  templateUrl: './break-brb.component.html',
  styleUrls: ['./break-brb.component.css']
})
export class BreakBrbComponent implements OnInit, AfterViewInit {

  public timeRemaining: TimeRemaining = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  public breakCountdownDate: Date;
  public milliseconds: number;
  public timer: string;

  constructor(private breakCountdownService: BreakCountdownService) {
  }

  ngOnInit(): void {
    this.breakCountdownService.getBreakCountdown().pipe(map(data => {
      this.breakCountdownDate = data[0].timestamp.toDate();
    })).subscribe();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calcTimeRemaining();
    }, 1000);
  }

  calcTimeRemaining() {
    setInterval(() => {
      this.milliseconds = this.breakCountdownDate.getTime() - new Date().getTime();
      const days = Math.floor(this.milliseconds / (1000 * 60 * 60 * 24));
      const hours = Math.floor(((this.milliseconds / (1000 * 60 * 60)) % 24));
      const minutes = Math.floor(((this.milliseconds / (1000 * 60)) % 60));
      const seconds = Math.floor((this.milliseconds / 1000) % 60);
      this.timeRemaining = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
      };
      // console.log('calcTimeRemaining', this.milliseconds );
      this.updateTimer();
    }, 1000);
  }

  updateTimer(): void {
    this.timer = this.zeroPad(this.timeRemaining.hours, 2) + ':' +
                 this.zeroPad(this.timeRemaining.minutes, 2) + ':' +
                 this.zeroPad(this.timeRemaining.seconds, 2);
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

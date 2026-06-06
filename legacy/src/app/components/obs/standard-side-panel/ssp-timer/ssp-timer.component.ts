import { AfterContentInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CountUpService } from '../../../../services/countup-service/countup.service';
import { GameLineupService } from '../../../../services/firebase/game-lineup/game-lineup.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-ssp-timer',
  templateUrl: './ssp-timer.component.html',
  styleUrls: ['./ssp-timer.component.css']
})
export class SspTimerComponent implements OnInit, AfterContentInit {
  public countUpTimer$: Observable<string>;
  public countUpTimer: string;
  public timeToShow = 'local';
  public count = 0;

  public startTimestamp: Date;

  public localTime = '';
  public totalTime = '';

  constructor( private gameLineupService: GameLineupService,
               private countUpService: CountUpService,
               private cdRef: ChangeDetectorRef ) {
  }

  ngOnInit() {
    this.countUpTimer$ = this.countUpService.getTimer().pipe(map(countUpTimer => {
      return this.countUpTimer = countUpTimer;
    }));
    this.startTimestamp = new Date();
    this.gameLineupService.getGameLineUp().subscribe(startTimestamp => {
      return this.startTimestamp = startTimestamp[0].startTimestamp.toDate();
    });
  }

  ngAfterContentInit(): void {
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

      this.getLocalTime().pipe(map(time => {
        this.localTime = time;
        this.cdRef.detectChanges();
      })).subscribe();

      this.getTotalTime().pipe(map(time => {
        this.totalTime = time;
        this.cdRef.detectChanges();
      })).subscribe();

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
    const startDate = this.startTimestamp;
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

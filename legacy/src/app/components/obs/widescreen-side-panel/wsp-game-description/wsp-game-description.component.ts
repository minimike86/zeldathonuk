import { Component, OnInit } from '@angular/core';
import {ScheduledVideoGame, VideoGame} from '../../../../models/video-game';
import {interval, Observable, of, Subscription, switchMap} from 'rxjs';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {map} from 'rxjs/operators';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {HowLongToBeatGameDetail} from '../../../../services/howlongtobeat-service/howlongtobeat-models';

@Component({
  selector: 'app-wsp-game-description',
  templateUrl: './wsp-game-description.component.html',
  styleUrls: ['./wsp-game-description.component.css']
})
export class WspGameDescriptionComponent implements OnInit {
  public currentGame$: Observable<string>;
  public currentGame: string;
  public gameLineUp: ScheduledVideoGame[];
  public zeldaGame: ScheduledVideoGame;

  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;

  constructor( private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
  }

  ngOnInit() {
    this.pos = 0;
    this.direction = true;
    this.secondsCounter$ = interval(75);
    this.subscription = this.secondsCounter$.pipe(map(n => {
      this.updatePos(n);
    })).subscribe();

    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data.find(x => x.id === 'ACTIVE-SCHEDULE').activeSchedule;
      this.zeldaGame = this.gameLineUp?.find(x => x.gameProgressKey === this.currentGame);
    })).subscribe();

    this.currentGame$ = this.currentlyPlayingService.getCurrentlyPlaying().pipe(switchMap(data => {
      this.currentGame = data[0].index;
      this.zeldaGame = this.gameLineUp?.find(x => x.gameProgressKey === this.currentGame);
      return of(this.currentGame);
    }));
  }

  getTimeToBeatMainStory(howLongToBeatGameDetail: HowLongToBeatGameDetail) {
    return howLongToBeatGameDetail?.titleGameTimes?.find(x => x.label === 'Main Story')?.time;
  }

  updatePos(n: number) {
    const maxCount = 100;
    if (n % maxCount === 0) {
      this.direction = !this.direction;
    }
    if (this.direction) {
      // move image down
      this.pos = this.pos + 1;
    } else {
      // move image up
      this.pos = this.pos - 1;
    }
  }

}

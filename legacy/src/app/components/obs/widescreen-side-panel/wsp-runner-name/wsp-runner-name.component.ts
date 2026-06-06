import { Component, OnInit } from '@angular/core';
import { faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { GameLineupService } from '../../../../services/firebase/game-lineup/game-lineup.service';
import { CurrentlyPlayingService } from '../../../../services/firebase/currently-playing/currently-playing.service';
import { map } from 'rxjs/operators';
import { ScheduledVideoGame } from '../../../../models/video-game';
import {BehaviorSubject, Observable, of, switchMap} from 'rxjs';


@Component({
  selector: 'app-wsp-runner-name',
  templateUrl: './wsp-runner-name.component.html',
  styleUrls: ['./wsp-runner-name.component.css']
})
export class WspRunnerNameComponent implements OnInit {
  public currentGame$: Observable<string>;
  public currentGame: string;

  public gameLineUp$: Observable<ScheduledVideoGame[]>;
  public gameLineUp: ScheduledVideoGame[];

  public zeldaGame$: BehaviorSubject<ScheduledVideoGame> = new BehaviorSubject<ScheduledVideoGame>(null);

  public faTwitch = faTwitch;
  public faYoutube = faYoutube;

  constructor( private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
  }

  ngOnInit() {
    this.currentGame$ = this.currentlyPlayingService.getCurrentlyPlaying().pipe(switchMap(data => {
      this.currentGame = data[0].index;
      this.updateZeldaGame();
      console.log('currentGame update:', this.currentGame);
      return of(this.currentGame);
    }));

    this.gameLineUp$ = this.gameLineupService.getGameLineUp().pipe(switchMap(data => {
      this.gameLineUp = data.find(x => x.id === 'ACTIVE-SCHEDULE').activeSchedule;
      this.updateZeldaGame();
      console.log('gameLineUp update:', this.gameLineUp);
      return of(this.gameLineUp);
    }));
  }

  updateZeldaGame() {
    this.zeldaGame$.next(this.gameLineUp?.find(x => x.gameProgressKey === this.currentGame));
  }

  getRunnersCharLength(game: ScheduledVideoGame): number {
    let charLen = 0;
    for (const runner of game.runners) {
      charLen += runner.name.length;
    }
    return charLen;
  }

}

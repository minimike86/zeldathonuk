import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {ScheduledVideoGame, VideoGame} from '../../../../models/video-game';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';
import {CountUpService} from '../../../../services/countup-service/countup.service';
import {GameLineUp} from '../../../../services/firebase/game-lineup/game-lineup';

@Component({
  selector: 'app-up-next-game',
  templateUrl: './up-next-game.component.html',
  styleUrls: ['./up-next-game.component.css']
})
export class UpNextGameComponent implements OnInit {
  public showUpNextGame = true;
  public slideIn = true;
  public countUpTimer: string;
  public currentlyPlayingId: CurrentlyPlayingId;
  public gameLineUp: ScheduledVideoGame[];

  public currentOmnibarContentId$: Observable<number>;

  constructor( private omnibarContentService: OmnibarContentService,
               private countUpService: CountUpService,
               private currentlyPlayingService: CurrentlyPlayingService,
               private gameLineupService: GameLineupService ) {
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.countUpService.getTimer().pipe(map(countUpTimer => {
      return this.countUpTimer = countUpTimer;
    })).subscribe();
    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlayingId = data[0];
    })).subscribe();
    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data.find(x => x.id === 'ACTIVE-SCHEDULE').activeSchedule;
    })).subscribe();
    setTimeout(() => {
      this.slideIn = !this.slideIn;
      this.omnibarContentService.setCurrentOmnibarContentId(2, 2 * 1000);
    }, 15 * 1000); // 30
  }

  getNextGame(): string {
    if (this.gameLineUp && this.currentlyPlayingId) {
      const nextGame: ScheduledVideoGame =
        this.gameLineUp[this.gameLineUp.findIndex(x => x.gameProgressKey === this.currentlyPlayingId.index) + 1];
      return `${nextGame.gameDetail.title} (${nextGame.badges.find(x => x.type === 'bg-success')?.name})`;
    } else {
      return '';
    }
  }

}

import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {VideoGame} from '../../../../models/video-game';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';
import {CountUpService} from '../../../../services/countup-service/countup.service';

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
  public gameLineUp: VideoGame[];

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
      this.gameLineUp = data.find(x => x.id === 'AVAILABLE-GAMES').availableGames;
    })).subscribe();
    setTimeout(() => {
      this.slideIn = !this.slideIn;
      this.omnibarContentService.setCurrentOmnibarContentId(2, 1000 * 5);
    }, 1000 * 10); // 30
  }

  getNextGame(): VideoGame {
    return {
      gameDetail: null,
      gameProgressKey: null,
      category: null,
      active: null,
      order: 0
    };
  }

}

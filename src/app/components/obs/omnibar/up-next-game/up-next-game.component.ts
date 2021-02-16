import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {ZeldaGame} from '../../../../models/zelda-game';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';
import {CountUpService} from '../../../../services/countup-service/countup.service';
import {GameLineUpId} from '../../../../services/firebase/game-lineup/game-lineup';

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
  public gameLineUp: Map<string, ZeldaGame>;

  public currentOmnibarContentId$: Observable<number>;

  constructor( private omnibarContentService: OmnibarContentService,
               private countUpService: CountUpService,
               private currentlyPlayingService: CurrentlyPlayingService,
               private gameLineUpService: GameLineupService ) {
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {

    this.countUpService.getTimer().pipe(map(countUpTimer => {
      return this.countUpTimer = countUpTimer;
    })).subscribe();

    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlayingId = data[0];
    })).subscribe();

    this.gameLineUpService.getGameLineUp().pipe(
      map((data: GameLineUpId[]) => {
        this.gameLineUp = data.find(x => x.id === 'GAME-LINEUP').gameLineUp;
        return Object.values(this.gameLineUp)
          .filter((x: ZeldaGame) => x.active === true)
          .sort((a: ZeldaGame, b: ZeldaGame) => a.order - b.order);
      }),
    ).subscribe();

    setTimeout(() => {
      this.slideIn = !this.slideIn;
      this.omnibarContentService.setCurrentOmnibarContentId(2, 1000 * 5);
    }, 1000 * 10); // 30

  }

  getNextGame(): ZeldaGame {
    if (this.gameLineUp) {
      const currGame: ZeldaGame = this.gameLineUp[this.currentlyPlayingId.index];

      if (currGame.order + 1 === Object.values(this.gameLineUp).length) {
        return {
          active: true,
          coverArt: '',
          gameEstimate: '',
          gameName: 'The End... of ZeldathonUK 2021!',
          gamePlatform: '',
          timeline: '',
          gameProgressKey: '',
          gameRelYear: '',
          gameType: '',
          order: 0,
          extraBadges: [],
          runners: [],
          startDate: null,
          endDate: null,
          twitchGameId: null
        };
      }

      const nextGame: ZeldaGame = Object.values(this.gameLineUp)
                                        .find((x: ZeldaGame) => x.order === currGame.order + 1);

      if (this.countUpTimer === '00:00:00') {
        return currGame;
      } else {
        return nextGame;
      }

    } else {

      return {
        active: true,
        coverArt: '',
        gameEstimate: '',
        gameName: 'Loading...',
        gamePlatform: '',
        timeline: '',
        gameProgressKey: '',
        gameRelYear: '',
        gameType: '',
        order: 0,
        extraBadges: [],
        runners: [],
        startDate: null,
        endDate: null,
        twitchGameId: null
      };

    }
  }

}

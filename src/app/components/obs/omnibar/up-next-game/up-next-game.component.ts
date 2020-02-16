import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {ZeldaGame} from '../../../../models/zelda-game';
import {Observable} from 'rxjs';
import {GameLineUp} from '../../../../services/firebase/game-lineup/game-lineup';
import {map} from 'rxjs/operators';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';

@Component({
  selector: 'app-up-next-game',
  templateUrl: './up-next-game.component.html',
  styleUrls: ['./up-next-game.component.css']
})
export class UpNextGameComponent implements OnInit {
  public showUpNextGame = true;
  public currentlyPlayingId: CurrentlyPlayingId;
  public gameLineUp: Map<string, ZeldaGame>;

  public currentOmnibarContentId$: Observable<number>;

  constructor( private omnibarContentService: OmnibarContentService,
               private currentlyPlayingService: CurrentlyPlayingService,
               private gameLineupService: GameLineupService ) {
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlayingId = data[0];
    })).subscribe();
    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data[0].gameLineUp;
    })).subscribe();
    this.omnibarContentService.setCurrentOmnibarContentId(2, 1000 * 15 * 2);
  }

  getNextGame(): ZeldaGame {
    if (this.gameLineUp) {
      switch (this.currentlyPlayingId.index) {
        case 'WWHD':
          return this.gameLineUp['SS'];
        case 'SS':
          return this.gameLineUp['LASR'];
        case 'LASR':
          return this.gameLineUp['OOT'];
        case 'OOT':
          return this.gameLineUp['LTTP'];
        case 'LTTP':
          return this.gameLineUp['BOTW'];
        case 'BOTW':
          return {
            active: true,
            coverArt: '',
            gameEstimate: '',
            gameName: 'The End',
            gamePlatform: '',
            gameProgressKey: '',
            gameRelYear: '',
            gameType: ''
          };
        default:
          break;
      }
    } else {
      return {
        active: true,
        coverArt: '',
        gameEstimate: '',
        gameName: 'Loading...',
        gamePlatform: '',
        gameProgressKey: '',
        gameRelYear: '',
        gameType: ''
      };
    }
  }

}

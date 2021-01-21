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
        case 'SKYWARD-SWORD':
          return this.gameLineUp['MINISH-CAP'];
        case 'MINISH-CAP':
          return this.gameLineUp['FOUR-SWORDS'];
        case 'FOUR-SWORDS':
          return this.gameLineUp['OOTO'];
        case 'OOTO':
          return this.gameLineUp['MMO'];
        case 'MMO':
          return this.gameLineUp['TPHD'];
        case 'TPHD':
          return this.gameLineUp['FSA'];
        case 'FSA':
          return this.gameLineUp['WWHD'];
        case 'WWHD':
          return this.gameLineUp['PH'];
        case 'PH':
          return this.gameLineUp['ST'];
        case 'ST':
          return this.gameLineUp['ALTTP'];
        case 'ALTTP':
          return this.gameLineUp['LASR'];
        case 'LASR':
          return this.gameLineUp['ALBTW'];
        case 'ALBTW':
          return this.gameLineUp['LOZ'];
        case 'LOZ':
          return this.gameLineUp['AOL'];
        case 'AOL':
          return this.gameLineUp['HWAOC'];
        case 'HWAOC':
          return this.gameLineUp['BOTW'];
        case 'BOTW':
          return this.gameLineUp['SMALTTP'];
        case 'SMALTTP':
          return {
            active: true,
            coverArt: '',
            gameEstimate: '',
            gameName: 'The End',
            gamePlatform: '',
            gameProgressKey: '',
            gameRelYear: '',
            gameType: '',
            order: 0
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
        gameType: '',
        order: 0
      };
    }
  }

}

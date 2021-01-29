import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {ZeldaGame} from '../../../../models/zelda-game';
import {Observable} from 'rxjs';
import {GameLineUp} from '../../../../services/firebase/game-lineup/game-lineup';
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
  public gameLineUp: Map<string, ZeldaGame>;

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
      this.gameLineUp = data[0].gameLineUp;
    })).subscribe();
    setTimeout(() => {
      this.slideIn = !this.slideIn;
      this.omnibarContentService.setCurrentOmnibarContentId(2, 1000 * 5);
    }, 1000 * 10); // 30
  }

  getNextGame(): ZeldaGame {
    if (this.gameLineUp) {
      if (this.currentlyPlayingId.index === 'SKYWARD-SWORD' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['SKYWARD-SWORD'];
      } else if (this.currentlyPlayingId.index === 'SKYWARD-SWORD') {
        return this.gameLineUp['MINISH-CAP'];
      } else if (this.currentlyPlayingId.index === 'MINISH-CAP' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['MINISH-CAP'];
      } else if (this.currentlyPlayingId.index === 'MINISH-CAP') {
        return this.gameLineUp['FOUR-SWORDS'];
      } else if (this.currentlyPlayingId.index === 'FOUR-SWORDS' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['FOUR-SWORDS'];
      } else if (this.currentlyPlayingId.index === 'FOUR-SWORDS') {
        return this.gameLineUp['OCARINA-OF-TIME'];
      } else if (this.currentlyPlayingId.index === 'OCARINA-OF-TIME' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['OCARINA-OF-TIME'];
      } else if (this.currentlyPlayingId.index === 'OCARINA-OF-TIME') {
        return this.gameLineUp['MAJORAS-MASK'];
      } else if (this.currentlyPlayingId.index === 'MAJORAS-MASK' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['MAJORAS-MASK'];
      } else if (this.currentlyPlayingId.index === 'MAJORAS-MASK') {
        return this.gameLineUp['TWILIGHT-PRINCESS-HD'];
      } else if (this.currentlyPlayingId.index === 'TWILIGHT-PRINCESS-HD' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['TWILIGHT-PRINCESS-HD'];
      } else if (this.currentlyPlayingId.index === 'TWILIGHT-PRINCESS-HD') {
        return this.gameLineUp['FOUR-SWORDS-ADVENTURES'];
      } else if (this.currentlyPlayingId.index === 'FOUR-SWORDS-ADVENTURES' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['FOUR-SWORDS-ADVENTURES'];
      } else if (this.currentlyPlayingId.index === 'FOUR-SWORDS-ADVENTURES') {
        return this.gameLineUp['WIND-WAKER-HD'];
      } else if (this.currentlyPlayingId.index === 'WIND-WAKER-HD' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['WIND-WAKER-HD'];
      } else if (this.currentlyPlayingId.index === 'WIND-WAKER-HD') {
        return this.gameLineUp['PHANTOM-HOURGLASS'];
      } else if (this.currentlyPlayingId.index === 'PHANTOM-HOURGLASS' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['PHANTOM-HOURGLASS'];
      } else if (this.currentlyPlayingId.index === 'PHANTOM-HOURGLASS') {
        return this.gameLineUp['SPIRIT-TRACKS'];
      } else if (this.currentlyPlayingId.index === 'SPIRIT-TRACKS' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['SPIRIT-TRACKS'];
      } else if (this.currentlyPlayingId.index === 'SPIRIT-TRACKS') {
        return this.gameLineUp['LINK-TO-THE-PAST'];
      } else if (this.currentlyPlayingId.index === 'LINK-TO-THE-PAST' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['LINK-TO-THE-PAST'];
      } else if (this.currentlyPlayingId.index === 'LINK-TO-THE-PAST') {
        return this.gameLineUp['LINKS-AWAKENING-SWITCH'];
      } else if (this.currentlyPlayingId.index === 'LINKS-AWAKENING-SWITCH' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['LINKS-AWAKENING-SWITCH'];
      } else if (this.currentlyPlayingId.index === 'LINKS-AWAKENING-SWITCH') {
        return this.gameLineUp['LINK-BETWEEN-WORLD'];
      } else if (this.currentlyPlayingId.index === 'LINK-BETWEEN-WORLD' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['LINK-BETWEEN-WORLD'];
      } else if (this.currentlyPlayingId.index === 'LINK-BETWEEN-WORLD') {
        return this.gameLineUp['LEGEND-OF-ZELDA'];
      } else if (this.currentlyPlayingId.index === 'LEGEND-OF-ZELDA' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['LEGEND-OF-ZELDA'];
      } else if (this.currentlyPlayingId.index === 'LEGEND-OF-ZELDA') {
        return this.gameLineUp['ADVENTURE-OF-LINK'];
      } else if (this.currentlyPlayingId.index === 'ADVENTURE-OF-LINK' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['ADVENTURE-OF-LINK'];
      } else if (this.currentlyPlayingId.index === 'ADVENTURE-OF-LINK') {
        return this.gameLineUp['AGE-OF-CALAMITY'];
      } else if (this.currentlyPlayingId.index === 'AGE-OF-CALAMITY' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['AGE-OF-CALAMITY'];
      } else if (this.currentlyPlayingId.index === 'AGE-OF-CALAMITY') {
        return this.gameLineUp['BREATH-OF-THE-WILD'];
      } else if (this.currentlyPlayingId.index === 'BREATH-OF-THE-WILD' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['BREATH-OF-THE-WILD'];
      } else if (this.currentlyPlayingId.index === 'BREATH-OF-THE-WILD') {
        return this.gameLineUp['SUPER-METROID-LINK-TO-THE-PAST'];
      } else if (this.currentlyPlayingId.index === 'SUPER-METROID-LINK-TO-THE-PAST' && this.countUpTimer === '00:00:00') {
        return this.gameLineUp['SUPER-METROID-LINK-TO-THE-PAST'];
      } else if (this.currentlyPlayingId.index === 'SUPER-METROID-LINK-TO-THE-PAST') {
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

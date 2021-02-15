import { Component, OnInit } from '@angular/core';
import { ZeldaGame} from '../../../../models/zelda-game';
import { interval, Observable, Subscription } from 'rxjs';
import { CurrentlyPlayingService } from '../../../../services/firebase/currently-playing/currently-playing.service';
import { CurrentlyPlayingId } from '../../../../services/firebase/currently-playing/currently-playing';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {map} from 'rxjs/operators';
import {GameLineUpId} from '../../../../services/firebase/game-lineup/game-lineup';

@Component({
  selector: 'app-ds-game-description',
  templateUrl: './ds-game-description.component.html',
  styleUrls: ['./ds-game-description.component.css']
})
export class DsGameDescriptionComponent implements OnInit {
  public gameId: CurrentlyPlayingId;
  public gameDesc: ZeldaGame = new ZeldaGame('', '', '', '', '', '',
                                             '', '', false, 0, [], [],
                                             null, null, null);
  public gameLineUp: Map<string, ZeldaGame>;

  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;

  constructor( private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {

    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.gameId = data[0];
      if (this.gameLineUp) {
        this.gameDesc = this.gameLineUp[this.gameId.index];
      }
      // console.log('this.gameId', this.gameId);
    })).subscribe();

    this.gameLineupService.getGameLineUp().pipe(map((data: GameLineUpId[]) => {
      this.gameLineUp = data.find(x => x.id === 'GAME-LINEUP').gameLineUp;
      this.gameDesc = this.gameLineUp[this.gameId.index];
      // console.log('gameLineUp', this.gameLineUp);
    })).subscribe();

  }

  ngOnInit() {
    this.pos = 0;
    this.direction = true;
    this.secondsCounter$ = interval(75);
    this.subscription = this.secondsCounter$.pipe(map(n => {
      this.updatePos(n);
    })).subscribe();
  }

  updatePos(n: number) {
    const maxCount = 750 - 175;
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

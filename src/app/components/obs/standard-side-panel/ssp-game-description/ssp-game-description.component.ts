import { Component, OnInit } from '@angular/core';
import { interval, Observable, Subscription } from 'rxjs';
import { ZeldaGame } from '../../../../models/zelda-game';
import { CurrentlyPlayingService } from '../../../../services/firebase/currently-playing/currently-playing.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-ssp-game-description',
  templateUrl: './ssp-game-description.component.html',
  styleUrls: ['./ssp-game-description.component.css']
})
export class SspGameDescriptionComponent implements OnInit {
  public gameId: CurrentlyPlayingId;
  public gameDesc: ZeldaGame = new ZeldaGame('', '', '', '', '', '', '', false, 0);
  public gameLineUp: Map<string, ZeldaGame>;

  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;

  constructor( private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
    currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.gameId = data[0];
      console.log('this.gameId', this.gameId);
    })).subscribe();
    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data[0].gameLineUp;
      this.gameDesc = this.gameLineUp[this.gameId.index];
      console.log('gameLineUp', this.gameLineUp);
    })).subscribe();
  }

  ngOnInit() {
    this.pos = 0;
    this.direction = true;
    this.secondsCounter$ = interval(75);
    this.subscription = this.secondsCounter$.subscribe(n => {
      this.updatePos(n);
    });
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

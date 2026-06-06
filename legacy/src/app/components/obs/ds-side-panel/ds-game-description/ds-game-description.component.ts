import { Component, OnInit } from '@angular/core';
import { VideoGame} from '../../../../models/video-game';
import { interval, Observable, Subscription } from 'rxjs';
import { CurrentlyPlayingService } from '../../../../services/firebase/currently-playing/currently-playing.service';
import { CurrentlyPlayingId } from '../../../../services/firebase/currently-playing/currently-playing';
import {GameLineupService} from '../../../../services/firebase/game-lineup/game-lineup.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-ds-game-description',
  templateUrl: './ds-game-description.component.html',
  styleUrls: ['./ds-game-description.component.css']
})
export class DsGameDescriptionComponent implements OnInit {
  public gameId: CurrentlyPlayingId;
  public zeldaGame: VideoGame = new VideoGame(null, null, null, null, null, 0);
  public gameLineUp: VideoGame[];

  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;

  constructor( private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {

    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.gameId = data[0];
      if (this.gameLineUp) {
        this.zeldaGame = this.gameLineUp[this.gameId.index];
      }
      // console.log('this.gameId', this.gameId);
    })).subscribe();

    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data.find(x => x.id === 'AVAILABLE-GAMES').availableGames;
      this.zeldaGame = this.gameLineUp[this.gameId.index];
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

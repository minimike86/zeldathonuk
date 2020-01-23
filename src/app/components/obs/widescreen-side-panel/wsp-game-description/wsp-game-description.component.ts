import { Component, OnInit } from '@angular/core';
import {ZeldaGame} from '../../../../models/zelda-game';
import {interval, Observable, Subscription} from 'rxjs';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';

@Component({
  selector: 'app-wsp-game-description',
  templateUrl: './wsp-game-description.component.html',
  styleUrls: ['./wsp-game-description.component.css']
})
export class WspGameDescriptionComponent implements OnInit {
  public gameId: CurrentlyPlayingId;
  public gameDesc: ZeldaGame = new ZeldaGame('', '', '', '', '', '');

  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;

  constructor(private currentlyPlayingService: CurrentlyPlayingService) {
    currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.gameId = data[0];
    });
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

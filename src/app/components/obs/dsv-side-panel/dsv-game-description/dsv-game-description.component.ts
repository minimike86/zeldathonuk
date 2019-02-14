import { Component, OnInit } from '@angular/core';
import {GameDesc} from "../../../../models/game-desc";
import {interval, Observable, Subscription} from "rxjs";
import {CurrentlyPlayingService} from "../../../../services/firebase/currently-playing/currently-playing.service";

@Component({
  selector: 'app-dsv-game-description',
  templateUrl: './dsv-game-description.component.html',
  styleUrls: ['./dsv-game-description.component.css']
})
export class DsvGameDescriptionComponent implements OnInit {
  public gameDesc: GameDesc = new GameDesc('','','','','','');

  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;

  constructor(private currentlyPlayingService: CurrentlyPlayingService) {
    currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.gameDesc = new GameDesc('','','','','','');
      this.gameDesc = data[0];
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

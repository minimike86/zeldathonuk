import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from '../../../../services/firebase/currently-playing/currently-playing.service';
import {CurrentlyPlayingId} from '../../../../services/firebase/currently-playing/currently-playing';
import {ZeldaGame} from '../../../../models/zelda-game';

@Component({
  selector: 'app-up-next-game',
  templateUrl: './up-next-game.component.html',
  styleUrls: ['./up-next-game.component.css']
})
export class UpNextGameComponent implements OnInit {
  public showUpNextGame = true;
  public currentlyPlaying: CurrentlyPlayingId;
  public upNextGame: ZeldaGame;
  public upNextGames: ZeldaGame[] = [];

  constructor(private currentlyPlayingService: CurrentlyPlayingService) {
    currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.currentlyPlaying = data[0];
      this.setNextGame(this.getGameIndex(this.currentlyPlaying.id));
    });
  }

  ngOnInit() {
  }

  getGameIndex(gameName: string): number {
    return 0;
  }

  setNextGame(gameIndex: number): void {
    this.upNextGame = this.upNextGames[gameIndex];
  }

}

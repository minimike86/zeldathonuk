import { Component, OnInit } from '@angular/core';
import {CurrentlyPlayingService} from "../../../../services/firebase/currently-playing/currently-playing.service";
import {CurrentlyPlayingId} from "../../../../services/firebase/currently-playing/currently-playing";

@Component({
  selector: 'app-up-next-game',
  templateUrl: './up-next-game.component.html',
  styleUrls: ['./up-next-game.component.css']
})
export class UpNextGameComponent implements OnInit {
  public upNextGame = true;
  public currentlyPlaying: CurrentlyPlayingId;
  public upNextGameName: string;

  constructor(private currentlyPlayingService: CurrentlyPlayingService) {
    currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.currentlyPlaying = data[0];
      this.getNextGameName(this.currentlyPlaying.gameName);
    });
  }

  ngOnInit() {
  }

  getNextGameName(currentGame: string): void {
    if (currentGame === 'The Legend of Zelda: The Minish Cap') {
      this.upNextGameName = 'The Legend of Zelda: Majora\'s Mask 3D (3DS)';
    } else if (currentGame === 'The Legend of Zelda: Majora\'s Mask 3D') {
      this.upNextGameName = 'The Legend of Zelda: Spirit Tracks (DS)';
    } else if (currentGame === 'The Legend of Zelda: Spirit Tracks') {
      this.upNextGameName = 'Zelda II: The Adventure of Link (NES)';
    } else if (currentGame === 'Zelda II: The Adventure of Link') {
      this.upNextGameName = 'The Legend of Zelda: Twilight Princess HD (WiiU)';
    } else if (currentGame === 'The Legend of Zelda: Twilight Princess HD') {
      this.upNextGameName = 'The Legend of Zelda: Link\'s Awakening DX (GBC)';
    } else if (currentGame === 'The Legend of Zelda: Link\'s Awakening DX') {
      this.upNextGameName = 'That\'s All Folks! Please consider donating via www.zeldathon.co.uk';
    } else {
      this.upNextGameName = '';
    }
  }

}

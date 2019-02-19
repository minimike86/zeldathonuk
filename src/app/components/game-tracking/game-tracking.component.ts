import { Component, OnInit } from '@angular/core';
import { GameDesc } from "../../models/game-desc";
import { GameItem } from "../../models/game-item";
import { CurrentlyPlayingService } from "../../services/firebase/currently-playing/currently-playing.service";
import { GameItemService } from "../../services/game-item/game-item.service";

@Component({
  selector: 'app-game-tracking',
  templateUrl: './game-tracking.component.html',
  styleUrls: ['./game-tracking.component.css']
})
export class GameTrackingComponent implements OnInit {
  public gameDesc: GameDesc = new GameDesc('','','','','','');
  public gameItems: GameItem[] = [];

  constructor(private currentlyPlayingService: CurrentlyPlayingService,
              private gameItemService: GameItemService) {
    this.currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.gameDesc = data[0];
      if (this.gameDesc.gameName === 'The Legend of Zelda: The Minish Cap') { this.gameItemService.loadMinishCap() }
      else if (this.gameDesc.gameName === 'The Legend of Zelda: Majora\'s Mask 3D') { this.gameItemService.loadMajorasMask() }
      else { this.gameItemService.unload() }
    });
    this.gameItemService.getGameItems().subscribe(data => {
      this.gameItems = data;
    });
  }

  ngOnInit() {
  }

  collectItem(name: string) {
    this.gameItemService.collectItem(name);
  }

}

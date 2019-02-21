import { Component, OnInit } from '@angular/core';
import { GameItemService } from "../../services/firebase/game-item/game-item.service";
import {GameItem, GameItemsId} from "../../services/firebase/game-item/game-item";
import {CurrentlyPlayingService} from "../../services/firebase/currently-playing/currently-playing.service";
import {GameDesc} from "../../models/game-desc";

@Component({
  selector: 'app-game-tracking',
  templateUrl: './game-tracking.component.html',
  styleUrls: ['./game-tracking.component.css']
})
export class GameTrackingComponent implements OnInit {
  private gameDesc: GameDesc;
  public gameItemsId: GameItemsId[] = [];
  public gameItems: GameItem[] = [];
  private firestorePath: string;

  constructor(private gameItemService: GameItemService,
              private currentlyPlayingService: CurrentlyPlayingService) {
    this.currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.gameDesc = data[0];
      this.getGameItems();
    });
    this.gameItemService.getGameItems().subscribe(data => {
      this.gameItemsId = data;
      this.getGameItems();
    });
  }

  ngOnInit() {
  }

  getGameItems() {
    if ( this.gameItemsId.find(i => i.id === 'MINISH-CAP') !== undefined
      && this.gameItemsId.find(i => i.id === 'MAJORAS-MASK') !== undefined
      && this.gameItemsId.find(i => i.id === 'SPIRIT-TRACKS') !== undefined
      && this.gameItemsId.find(i => i.id === 'ADVENTURE-OF-LINK') !== undefined ) {

      if (this.gameDesc.gameName === 'The Legend of Zelda: The Minish Cap') {

        this.firestorePath = 'MINISH-CAP';
        this.gameItems = this.gameItemsId.find(i => i.id === 'MINISH-CAP').items;

      } else if (this.gameDesc.gameName === 'The Legend of Zelda: Majora\'s Mask 3D') {

        this.firestorePath = 'MAJORAS-MASK';
        this.gameItems = this.gameItemsId.find(i => i.id === 'MAJORAS-MASK').items;

      } else if (this.gameDesc.gameName === 'The Legend of Zelda: Spirit Tracks') {

        this.firestorePath = 'SPIRIT-TRACKS';
        this.gameItems = this.gameItemsId.find(i => i.id === 'SPIRIT-TRACKS').items;

      } else if (this.gameDesc.gameName === 'Zelda II: The Adventure of Link') {

        this.firestorePath = 'ADVENTURE-OF-LINK';
        this.gameItems = this.gameItemsId.find(i => i.id === 'ADVENTURE-OF-LINK').items;

      } else {

        // do fuck all

      }

    }
  }

  collectItem(gameItem: string, collected: boolean) {
    this.gameItems.find(item => item.name === gameItem).collected = !collected;
    this.gameItemService.collectItem(this.firestorePath, this.gameItems);
  }

  addData() {
    this.gameItemService.addAdventureOfLinkData();
  }

}

import { Component, OnInit } from '@angular/core';
import {map} from 'rxjs/operators';
import { GameItemService } from '../../services/firebase/game-item/game-item.service';
import {GameItem, GameItemsId} from '../../services/firebase/game-item/game-item';
import {CurrentlyPlayingService} from '../../services/firebase/currently-playing/currently-playing.service';
import {ZeldaGame} from '../../models/zelda-game';
import {CurrentlyPlayingId} from '../../services/firebase/currently-playing/currently-playing';
import {GameLineupService} from '../../services/firebase/game-lineup/game-lineup.service';
import {GameLineUp} from '../../services/firebase/game-lineup/game-lineup';

@Component({
  selector: 'app-game-tracking',
  templateUrl: './game-tracking.component.html',
  styleUrls: ['./game-tracking.component.css']
})
export class GameTrackingComponent implements OnInit {
  public currentlyPlayingId: CurrentlyPlayingId;
  private gameLineUp: Map<string, ZeldaGame>;
  public gameItemsId: GameItemsId[] = [];
  public gameItems: GameItem[] = [];
  private firestorePath: string;

  constructor(private gameItemService: GameItemService,
              private gameLineUpService: GameLineupService,
              private currentlyPlayingService: CurrentlyPlayingService) {
  }

  ngOnInit() {
    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlayingId = data[0];
    })).subscribe();
    this.gameLineUpService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data[0].gameLineUp;
      console.log('gameLineUp', this.gameLineUp);
    })).subscribe();
    this.gameItemService.getGameItems().pipe(map(data => {
      this.gameItemsId = data;
      this.getZeldaGameItems();
    })).subscribe();
  }

  getZeldaGameItems() {
    console.log('getZeldaGameItems', this.gameLineUp);
  }

  collectItem(gameItem: string, collected: boolean) {
    this.gameItems.find(item => item.name === gameItem).collected = !collected;
    this.gameItemService.collectItem(this.firestorePath, this.gameItems);
  }

  addData() {
    // this.gameItemService.addLegendOfZeldaData();        // 1986
    // this.gameItemService.addAdventureOfLinkData();      // 1987
    // this.gameItemService.addOcarinaOfTimeData();        // 1998
    // this.gameItemService.addMajorasMaskData();          // 2000
    // this.gameItemService.addMinishCapData();            // 2004
    // this.gameItemService.addFourSwordsAdventuresData(); // 2004
    // this.gameItemService.addSpiritTracksData();         // 2009
    // this.gameItemService.addSkywardSwordData();         // 2011
    // this.gameItemService.addWindWakerHdData();          // 2013
    // this.gameItemService.addBreathOfTheWildData();      // 2017
    // this.gameItemService.addLinksAwakeningRemakeData(); // 2017
    alert('Importing game data...');
  }

}

import {Component, OnInit} from '@angular/core';
import {map} from 'rxjs/operators';
import {GameItemService} from '../../services/firebase/game-item/game-item.service';
import {GameItem, GameItemsId} from '../../services/firebase/game-item/game-item';
import {CurrentlyPlayingService} from '../../services/firebase/currently-playing/currently-playing.service';
import {ZeldaGame} from '../../models/zelda-game';
import {CurrentlyPlayingId} from '../../services/firebase/currently-playing/currently-playing';
import {GameLineupService} from '../../services/firebase/game-lineup/game-lineup.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-game-tracking',
  templateUrl: './game-tracking.component.html',
  styleUrls: ['./game-tracking.component.css']
})
export class GameTrackingComponent implements OnInit {
  public currentlyPlayingId: CurrentlyPlayingId;
  public currentlyPlayingId$: Observable<CurrentlyPlayingId>;
  private gameLineUp: Map<string, ZeldaGame>;
  public gameLineUp$: Observable<Map<string, ZeldaGame>>;
  public gameItemsId: GameItemsId[] = [];
  public gameItemsId$: Observable<GameItemsId[]>;
  public gameProgressKey: string;

  constructor(private gameItemService: GameItemService,
              private gameLineUpService: GameLineupService,
              private currentlyPlayingService: CurrentlyPlayingService) {
  }

  ngOnInit() {

    this.currentlyPlayingId$ = this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      return this.currentlyPlayingId = data[0];
    }));

    this.gameLineUp$ = this.gameLineUpService.getGameLineUp().pipe(map(data => {
      return this.gameLineUp = data[0].gameLineUp;
    }));

    this.gameItemsId$ = this.gameItemService.getGameItemsIds().pipe(map(data => {
      return this.gameItemsId = data;
    }));

  }

  collectItem(gameItem: GameItem, gameItems: GameItem[]) {
    gameItems.find(item => item.name === gameItem.name).collected = !gameItem.collected;
    this.gameItemService.collectItem(this.gameLineUp[this.currentlyPlayingId.index].gameProgressKey, gameItems);
  }

  resetItemCollection(gameItems: GameItem[]) {
    gameItems.forEach(x => x.collected = false);
    this.gameItemService.collectItem(this.gameLineUp[this.currentlyPlayingId.index].gameProgressKey, gameItems);
  }

  addData() {
    // this.gameItemService.addLegendOfZeldaData();        // 1986
    // this.gameItemService.addAdventureOfLinkData();      // 1987
    // this.gameItemService.addLinkToThePastData();        // 1992
    // this.gameItemService.addOcarinaOfTimeData();        // 1998
    // this.gameItemService.addMajorasMaskData();          // 2000
    // this.gameItemService.addMinishCapData();            // 2004
    // this.gameItemService.addFourSwordsAdventuresData(); // 2004
    // this.gameItemService.addSpiritTracksData();         // 2009
    // this.gameItemService.addSkywardSwordData();         // 2011
    // this.gameItemService.addWindWakerHdData();          // 2013
    // this.gameItemService.addBreathOfTheWildData();      // 2017
    // this.gameItemService.addLinksAwakeningRemakeData(); // 2019
    alert('Importing game data...');
  }

}

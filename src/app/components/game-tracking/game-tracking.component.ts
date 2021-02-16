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
      return this.gameLineUp = data.find(x => x.id === 'GAME-LINEUP').gameLineUp;
    }));

    this.gameItemsId$ = this.gameItemService.getGameItemsIds().pipe(map(data => {
      return this.gameItemsId = data;
    }));

  }

  collectItem(gameItem: GameItem, gameItems: GameItem[]) {
    gameItems.find(item => item.name === gameItem.name).collected = !gameItem.collected;
    this.gameItemService.collectItem(this.gameLineUp[this.currentlyPlayingId.index].gameProgressKey, gameItems);
  }

}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { GameDesc } from "../../models/game-desc";
import { GameItem } from "../../models/game-item";
import { CurrentlyPlayingService } from "../../services/firebase/currently-playing/currently-playing.service";

@Component({
  selector: 'app-game-tracking',
  templateUrl: './game-tracking.component.html',
  styleUrls: ['./game-tracking.component.css']
})
export class GameTrackingComponent implements OnInit {
  private gameString: string;
  public gameDesc: GameDesc = new GameDesc('','','','','','');
  public gameItems: GameItem[] = [];

  constructor(private route: ActivatedRoute,
              private currentlyPlayingService: CurrentlyPlayingService) {
    this.route.paramMap.subscribe(params => {
      this.gameString = params.get('game');
    });
    this.currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      console.log('currentlyPlayingService: ', data);
      this.gameDesc = data[0];
    });
  }

  ngOnInit() {
  }

  collectItem(name: string) {
    // this.gameItemService.collectItem(name);
  }

}

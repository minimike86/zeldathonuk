import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from "@angular/router";
import { GameService } from "../../services/game/game.service";
import { GameDesc } from "../../models/game-desc";
import { GameItem } from "../../models/game-item";

@Component({
  selector: 'app-game-tracking',
  templateUrl: './game-tracking.component.html',
  styleUrls: ['./game-tracking.component.css']
})
export class GameTrackingComponent implements OnInit {
  private gameString: string;

  public gameDesc: GameDesc;
  public gameItems: GameItem[];

  constructor(private route: ActivatedRoute,
              private gameService: GameService) {
    this.route.paramMap.subscribe(params => {
      this.gameString = params.get('game');
    });
    gameService.observeGameDesc().subscribe(data => {
      this.gameDesc = data;
    });
    gameService.observeGameItems().subscribe(data => {
      this.gameItems = data;
    });
  }

  ngOnInit() {
    if (this.gameString === 'mm') {
      this.gameService.loadMajorasMask();
    }
  }

  collectItem(name: string) {
    this.gameService.collectItem(name);
  }

}

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
    // Static Data
    const minishCapDesc = {
      'coverArt': '../../../../../assets/img/cover-art/Minish_Cap_cover.jpg',
      'gameName': 'The Legend of Zelda: The Minish Cap',
      'gameType': 'Casual Any%',
      'gamePlatform': 'GBA',
      'gameRelYear': '2004',
      'gameEstimate': '11:00:00'
    };
    const majorasMaskDesc = {
      'coverArt': '../../../../../assets/img/cover-art/Majoras_Mask_3D_cover.jpg',
      'gameName': 'The Legend of Zelda: Majora\'s Mask 3D',
      'gameType': 'Casual Any%',
      'gamePlatform': '3DS',
      'gameRelYear': '2009',
      'gameEstimate': '16:45:00'
    };
    const spiritTracksDesc = {
      'coverArt': '../../../../../assets/img/cover-art/Spirit_Tracks_cover.jpg',
      'gameName': 'The Legend of Zelda: Spirit Tracks',
      'gameType': 'Casual Any%',
      'gamePlatform': 'DS',
      'gameRelYear': '2004',
      'gameEstimate': '14:49:00'
    };
    const adventureOfLinkDesc = {
      'coverArt': '../../../../../assets/img/cover-art/Adventure_of_Link_cover.jpg',
      'gameName': 'Zelda II: The Adventure of Link',
      'gameType': 'Casual Any%',
      'gamePlatform': 'NES',
      'gameRelYear': '1987',
      'gameEstimate': '14:49:00'
    };
    const twilightPrincessDesc = {
      'coverArt': '../../../../../assets/img/cover-art/Twilight_Princess_HD_cover.jpg',
      'gameName': 'The Legend of Zelda: Twilight Princess HD',
      'gameType': 'Casual Any%',
      'gamePlatform': 'WiiU',
      'gameRelYear': '2006',
      'gameEstimate': '21:42:00'
    };
    const linksAwakeningDesc = {
      'coverArt': '../../../../../assets/img/cover-art/Links_Awakening_cover.jpg',
      'gameName': 'The Legend of Zelda: Link\'s Awakening DX',
      'gameType': 'Casual Any%',
      'gamePlatform': 'GBC',
      'gameRelYear': '1993',
      'gameEstimate': '10:32:00'
    };
    // Router Toggle
    switch (this.gameString) {
      case 'mm': { this.currentlyPlayingService.setCurrentlyPlaying(majorasMaskDesc); break; }
      case 'mc': { this.currentlyPlayingService.setCurrentlyPlaying(minishCapDesc); break; }
      case 'st': { this.currentlyPlayingService.setCurrentlyPlaying(spiritTracksDesc); break; }
      case 'aol': { this.currentlyPlayingService.setCurrentlyPlaying(adventureOfLinkDesc); break; }
      case 'tp': { this.currentlyPlayingService.setCurrentlyPlaying(twilightPrincessDesc); break; }
      case 'la': { this.currentlyPlayingService.setCurrentlyPlaying(linksAwakeningDesc); break; }
    }
  }

  collectItem(name: string) {
    // this.gameItemService.collectItem(name);
  }

}

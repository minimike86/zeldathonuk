import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-game-description',
  templateUrl: './game-description.component.html',
  styleUrls: ['./game-description.component.css']
})
export class GameDescriptionComponent implements OnInit {
  public yPos: string;
  public gameName: string;
  public gameType: string;
  public gamePlatform: string;
  public gameRelYear: string;
  public gameEstimate: string;

  constructor() { }

  ngOnInit() {
    this.yPos = 'center center';
    this.gameName = 'The Legend of Zelda: Majora\'s Mask 3D';
    this.gameType = 'Casual Any%';
    this.gamePlatform = '3DS';
    this.gameRelYear = '2015';
    this.gameEstimate = '16:45:00';
  }



}

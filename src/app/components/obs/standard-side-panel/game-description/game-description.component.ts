import {Component, Input, OnInit} from '@angular/core';
import {interval, Observable, Subscription} from "rxjs";

@Component({
  selector: 'app-game-description',
  templateUrl: './game-description.component.html',
  styleUrls: ['./game-description.component.css']
})
export class GameDescriptionComponent implements OnInit {
  @Input() public coverArt: string;
  public pos: number;
  public direction: boolean;
  private subscription: Subscription;
  private secondsCounter$: Observable<any>;
  @Input() public gameName: string;
  @Input() public gameType: string;
  @Input() public gamePlatform: string;
  @Input() public gameRelYear: string;
  @Input() public gameEstimate: string;

  constructor() {
    this.pos = 0;
    this.direction = true;
    this.secondsCounter$ = interval(75);
    this.subscription = this.secondsCounter$.subscribe(n => {
      this.updatePos(n);
    });
  }

  ngOnInit() {
    this.coverArt = '../../../../../assets/img/cover-art/Majoras_Mask_3D_cover.jpg';
    this.gameName = 'The Legend of Zelda: Majora\'s Mask 3D';
    this.gameType = 'Casual Any%';
    this.gamePlatform = '3DS';
    this.gameRelYear = '2015';
    this.gameEstimate = '16:45:00';
  }

  updatePos(n: number) {
    const maxCount = 800 - 175;
    if (n % maxCount === 0) {
      this.direction = !this.direction;
    }
    if (this.direction) {
      // move image down
      this.pos = this.pos + 1;
    } else {
      // move image up
      this.pos = this.pos - 1;
    }
  }

}

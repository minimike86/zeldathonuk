import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {GameDescriptionComponent} from "./game-description/game-description.component";

@Component({
  selector: 'app-standard-side-panel',
  templateUrl: './standard-side-panel.component.html',
  styleUrls: ['./standard-side-panel.component.css']
})
export class StandardSidePanelComponent implements OnInit {

  @Input() gameData: any;

  @ViewChild(GameDescriptionComponent)
  private gameDescriptionComponent: GameDescriptionComponent

  constructor() { }

  ngOnInit() {
  }

}

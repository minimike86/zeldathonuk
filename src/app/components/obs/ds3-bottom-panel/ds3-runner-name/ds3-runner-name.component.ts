import { Component, OnInit } from '@angular/core';
import {faTwitch} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-ds3-runner-name',
  templateUrl: './ds3-runner-name.component.html',
  styleUrls: ['./ds3-runner-name.component.css']
})
export class Ds3RunnerNameComponent implements OnInit {
  public runnerName: string;
  public hasTwitchAccount: boolean;
  public faTwitch = faTwitch;

  constructor() {
  }

  ngOnInit() {
    this.runnerName = 'Miikkkeeee_';
    this.hasTwitchAccount = true;
  }

}

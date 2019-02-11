import { Component, OnInit } from '@angular/core';
import {faTwitch} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-wsp-runner-name',
  templateUrl: './wsp-runner-name.component.html',
  styleUrls: ['./wsp-runner-name.component.css']
})
export class WspRunnerNameComponent implements OnInit {
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

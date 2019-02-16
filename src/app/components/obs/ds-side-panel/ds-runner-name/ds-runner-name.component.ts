import { Component, OnInit } from '@angular/core';
import {faTwitch} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-ds-runner-name',
  templateUrl: './ds-runner-name.component.html',
  styleUrls: ['./ds-runner-name.component.css']
})
export class DsRunnerNameComponent implements OnInit {
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

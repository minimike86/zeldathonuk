import { Component, OnInit } from '@angular/core';
import {faTwitch} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-dsv-runner-name',
  templateUrl: './dsv-runner-name.component.html',
  styleUrls: ['./dsv-runner-name.component.css']
})
export class DsvRunnerNameComponent implements OnInit {
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

import { Component, OnInit } from '@angular/core';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-ssp-runner-name',
  templateUrl: './ssp-runner-name.component.html',
  styleUrls: ['./ssp-runner-name.component.css']
})
export class SspRunnerNameComponent implements OnInit {
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

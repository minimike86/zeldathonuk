import { Component, OnInit } from '@angular/core';
import {faTwitch} from "@fortawesome/free-brands-svg-icons";
import {RunnerNameService} from "../../../../services/firebase/runner-name/runner-name.service";
import {RunnerNameId} from "../../../../services/firebase/runner-name/runner-name";

@Component({
  selector: 'app-ds3-runner-name',
  templateUrl: './ds3-runner-name.component.html',
  styleUrls: ['./ds3-runner-name.component.css']
})
export class Ds3RunnerNameComponent implements OnInit {
  public runnerName: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};
  public faTwitch = faTwitch;

  constructor(private runnerNameService: RunnerNameService) {
    this.runnerNameService.getRunnerName().subscribe(data => {
      this.runnerName = data[0];
    });
  }

  ngOnInit() {
  }

}

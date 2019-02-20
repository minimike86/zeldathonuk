import { Component, OnInit } from '@angular/core';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';
import {RunnerNameId} from "../../../../services/firebase/runner-name/runner-name";
import {RunnerNameService} from "../../../../services/firebase/runner-name/runner-name.service";

@Component({
  selector: 'app-ssp-runner-name',
  templateUrl: './ssp-runner-name.component.html',
  styleUrls: ['./ssp-runner-name.component.css']
})
export class SspRunnerNameComponent implements OnInit {
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

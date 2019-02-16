import { Component, OnInit } from '@angular/core';
import {CountupService} from "../../../../services/countup-service/countup.service";

@Component({
  selector: 'app-ds-timer',
  templateUrl: './ds-timer.component.html',
  styleUrls: ['./ds-timer.component.css']
})
export class DsTimerComponent implements OnInit {
  public timer: string;

  constructor(private countupService: CountupService) {
    countupService.getTimer().subscribe(data => {
      this.timer = data;
    });
    countupService.start();
  }

  ngOnInit() {
  }

}

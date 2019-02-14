import { Component, OnInit } from '@angular/core';
import {CountupService} from "../../../../services/countup-service/countup.service";

@Component({
  selector: 'app-dsv-timer',
  templateUrl: './dsv-timer.component.html',
  styleUrls: ['./dsv-timer.component.css']
})
export class DsvTimerComponent implements OnInit {
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

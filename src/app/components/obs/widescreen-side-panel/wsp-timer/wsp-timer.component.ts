import { Component, OnInit } from '@angular/core';
import {CountupService} from "../../../../services/countup-service/countup.service";

@Component({
  selector: 'app-wsp-timer',
  templateUrl: './wsp-timer.component.html',
  styleUrls: ['./wsp-timer.component.css']
})
export class WspTimerComponent implements OnInit {
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

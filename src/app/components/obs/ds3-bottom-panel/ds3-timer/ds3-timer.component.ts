import { Component, OnInit } from '@angular/core';
import { CountUpService } from "../../../../services/countup-service/countup.service";

@Component({
  selector: 'app-ds3-timer',
  templateUrl: './ds3-timer.component.html',
  styleUrls: ['./ds3-timer.component.css']
})
export class Ds3TimerComponent implements OnInit {
  public timer: string;

  constructor(private countUpService: CountUpService) {
    countUpService.getTimer().subscribe(data => {
      this.timer = data;
    });
  }

  ngOnInit() {
  }

}

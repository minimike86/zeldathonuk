import { Component, OnInit } from '@angular/core';
import { CountUpService } from "../../../../services/countup-service/countup.service";

@Component({
  selector: 'app-ds-timer',
  templateUrl: './ds-timer.component.html',
  styleUrls: ['./ds-timer.component.css']
})
export class DsTimerComponent implements OnInit {
  public timer: string;

  constructor(private countUpService: CountUpService) {
    countUpService.getTimer().subscribe(data => {
      this.timer = data;
    });
  }

  ngOnInit() {
  }

}

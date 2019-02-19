import { Component, OnInit } from '@angular/core';
import { CountupService } from "../../../../services/countup-service/countup.service";

@Component({
  selector: 'app-ssp-timer',
  templateUrl: './ssp-timer.component.html',
  styleUrls: ['./ssp-timer.component.css']
})
export class SspTimerComponent implements OnInit {
  public timer: string;

  constructor(private countupService: CountupService) {
    countupService.getTimer().subscribe(data => {
      this.timer = data;
    });
  }

  ngOnInit() {
  }

}

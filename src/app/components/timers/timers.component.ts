import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.css']
})
export class TimersComponent implements OnInit {

  public countdownDuration: number;
  public countToDate: Date;

  constructor() {
  }

  ngOnInit() {
    this.countdownDuration = 3600;
  }

}

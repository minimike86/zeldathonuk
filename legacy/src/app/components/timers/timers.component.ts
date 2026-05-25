import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.css']
})
export class TimersComponent implements OnInit {
  public activityName: string;
  public countToDate: Date;

  constructor() {
    this.countToDate = new Date();
  }

  ngOnInit() {
    this.activityName = '';
  }

  setDate(input: any): void {
    this.countToDate = new Date(input);
  }

  getFutureDate(): number {
    return this.countToDate.getTime();
  }

  isFutureDate(): boolean {
    const now = new Date();
    return this.countToDate.getTime() > now.getTime();
  }

}

import {Component, OnInit, ViewChild} from '@angular/core';
import {CountdownComponent} from "ngx-countdown";

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.css']
})
export class TimersComponent implements OnInit {

  public cdConfig: any;
  public today: Date;
  public countdownDate: Date;

  @ViewChild(CountdownComponent) counter: CountdownComponent;

  constructor() {
  }

  ngOnInit() {
    this.today = new Date();
    this.countdownDate = new Date('2019-02-22T08:00:00.000');
  }

  onStart() {
    //
  }

  onFinished() {
    //
  }

  onNotify(event: any) {
    //
  }

  resetTimer(){
    this.counter.restart();
    this.counter.stop();
    this.counter.pause();
    this.counter.resume();
  }

}

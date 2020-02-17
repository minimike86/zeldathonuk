import { Component, OnInit } from '@angular/core';
import {CountupService} from '../../../../services/countup-service/countup.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {FirebaseTimerService} from '../../../../services/firebase/firebase-timer/firebase-timer.service';
import {CountUpTimerId} from '../../../../services/firebase/firebase-timer/count-up-timer';

@Component({
  selector: 'app-wsp-timer',
  templateUrl: './wsp-timer.component.html',
  styleUrls: ['./wsp-timer.component.css']
})
export class WspTimerComponent implements OnInit {
  public timer$: Observable<string>;
  public timer: string;

  constructor( private countupService: CountupService ) {
  }

  ngOnInit() {
    this.timer$ = this.countupService.getTimer().pipe(map(timer => {
      return this.timer = timer;
    }));
  }

}

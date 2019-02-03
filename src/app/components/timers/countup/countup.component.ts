import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {CountupService} from "../../../services/countup-service/countup.service";
import {Observable} from "rxjs";


@Component({
  selector: 'app-countup',
  templateUrl: './countup.component.html',
  styleUrls: ['./countup.component.css']
})
export class CountupComponent implements OnInit {
  @Input() autoStart: boolean;
  private routeSub: any;
  public activityName: string;
  public timer$: Observable<string>;

  constructor(private route: ActivatedRoute,
              public ts: CountupService) {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.autoStart = parseInt(params.get('autoStart')) === 1;
      this.activityName = params.get('activityName');
    });
    this.timer$ = this.ts.getTimer();
  }

  ngOnInit() {
    if (this.autoStart) {
      this.start();
    }
  }

  start(): void {
    this.ts.start();
  }

  reset(): void {
    this.ts.reset();
  }

  stop(): void {
    this.ts.stop();
  }

}

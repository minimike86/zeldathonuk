import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.css']
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input() countdownDuration: number;
  private routeSub: any;
  public cdConfig: any;
  public finished: boolean;

  constructor(private route: ActivatedRoute) {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.countdownDuration = parseInt(params.get('duration'));
    });
  }

  ngOnInit() {
    this.cdConfig = {
      leftTime: this.countdownDuration
    };
    this.finished = false;
    console.log('ngOnInit', this.countdownDuration);
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
  }

  onStart() {
    this.finished = false;
    console.log('timer started');
  }

  onFinished() {
    this.finished = true;
    console.log('timer finished');
  }

  onNotify(event: any) {
    console.log('timer notify');
  }

}

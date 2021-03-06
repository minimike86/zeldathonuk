import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CountUpService} from '../../../services/countup-service/countup.service';
import {Observable} from 'rxjs';


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
              public ts: CountUpService) {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.activityName = params.get('activityName');
    });
    this.timer$ = this.ts.getTimer();
  }

  ngOnInit() {
  }

}

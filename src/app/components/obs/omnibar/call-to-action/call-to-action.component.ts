import { Component, OnInit } from '@angular/core';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-call-to-action',
  templateUrl: './call-to-action.component.html',
  styleUrls: ['./call-to-action.component.css']
})
export class CallToActionComponent implements OnInit {
  public callToAction = true;
  public currentDate: number = Date.now();

  public currentOmnibarContentId$: Observable<number>;

  constructor( private omnibarContentService: OmnibarContentService ) {
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.omnibarContentService.setCurrentOmnibarContentId(3, 1000 * 15 * 5);
  }

}

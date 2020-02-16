import { Component, OnInit } from '@angular/core';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-omnibar-donation-plea',
  templateUrl: './omnibar-donation-plea.component.html',
  styleUrls: ['./omnibar-donation-plea.component.css']
})
export class OmnibarDonationPleaComponent implements OnInit {
  public callToAction = true;
  public currentDate: number = Date.now();

  public currentOmnibarContentId$: Observable<number>;

  constructor( private omnibarContentService: OmnibarContentService ) {
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.omnibarContentService.setCurrentOmnibarContentId(1, 1000 * 15 * 5);
  }

}

import { Component, OnInit } from '@angular/core';
import {interval, Observable} from "rxjs";

@Component({
  selector: 'app-wsp-ad-panel',
  templateUrl: './wsp-ad-panel.component.html',
  styleUrls: ['./wsp-ad-panel.component.css']
})
export class WspAdPanelComponent implements OnInit {

  public charityLogoUrl: string;
  public charityLogoSwap: boolean;
  private secondsCounter$: Observable<any>;

  constructor() {
    this.charityLogoSwap = true;
    this.updateCharityLogoUrl();
    this.secondsCounter$ = interval(1000 * 15);
  }

  ngOnInit() {
    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
    });
  }

  updateCharityLogoUrl(): void {
    if (this.charityLogoSwap) {
      this.charityLogoUrl = '../../../../assets/img/logo-specialeffect.png';
    } else {
      this.charityLogoUrl = '../../../../assets/img/GB19_logo_for_website2.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

}

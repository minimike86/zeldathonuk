import { Component, OnInit } from '@angular/core';
import {interval, Observable} from "rxjs";

@Component({
  selector: 'app-dsv-ad-panel',
  templateUrl: './dsv-ad-panel.component.html',
  styleUrls: ['./dsv-ad-panel.component.css']
})
export class DsvAdPanelComponent implements OnInit {

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
      this.charityLogoUrl = '../../../../assets/img/GB_Background_nologo.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

}

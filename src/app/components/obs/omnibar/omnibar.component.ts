import { Component, OnInit } from '@angular/core';
import { interval, Observable } from "rxjs";
import {JgServiceService} from "../../../services/jg-service/jg-service.service";

@Component({
  selector: 'app-omnibar',
  templateUrl: './omnibar.component.html',
  styleUrls: ['./omnibar.component.css']
})
export class OmnibarComponent implements OnInit {
  public fundraisingPageDetails: any;
  public charityLogoUrl: string
  public charityLogoSwap: boolean;
  private secondsCounter$: Observable<any>;

  constructor(private jgServiceService: JgServiceService) {
    this.charityLogoSwap = true;
    this.updateCharityLogoUrl();
    this.secondsCounter$ = interval(1000 * 15);
    jgServiceService.getFundraisingPageDetails(1000*5).subscribe(data => {
      this.fundraisingPageDetails = data;
    });
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

  getCharityLogoUrl(): string {
    return this.charityLogoUrl;
  }

}

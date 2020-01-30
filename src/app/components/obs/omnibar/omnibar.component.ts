import { Component, OnInit } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { JgServiceService } from '../../../services/jg-service/jg-service.service';

@Component({
  selector: 'app-omnibar',
  templateUrl: './omnibar.component.html',
  styleUrls: ['./omnibar.component.css']
})
export class OmnibarComponent implements OnInit {
  public fundraisingPageDetails: Observable<FundraisingPageDetails>;
  public charityLogoUrl: string;
  public charityLogoSwap: boolean;
  private secondsCounter$: Observable<any>;
  public showOmnibarContent1 = false;
  public showOmnibarContent2 = false;
  public showOmnibarContent3 = false;
  public showOmnibarContent4 = false;

  constructor(private jgServiceService: JgServiceService) {
    this.charityLogoSwap = true;
    this.updateCharityLogoUrl();
    this.secondsCounter$ = interval(1000 * 15);
    this.fundraisingPageDetails = jgServiceService.getFundraisingPageDetails();
  }

  ngOnInit() {
    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
      if ( n % 5 === 0 ) {
        this.changeOmnibarContent();
      }
    });
  }

  changeOmnibarContent(): void {
    console.log('changeOmnibarContent: ',
      this.showOmnibarContent1, this.showOmnibarContent2,
      this.showOmnibarContent3, this.showOmnibarContent4);
    if (!this.showOmnibarContent1 && !this.showOmnibarContent2 && !this.showOmnibarContent3 && !this.showOmnibarContent4) {
      this.showOmnibarContent1 = true;
    } else if (this.showOmnibarContent1) {
      this.showOmnibarContent1 = false;
      this.showOmnibarContent2 = true;
    } else if (this.showOmnibarContent2) {
      this.showOmnibarContent2 = false;
      this.showOmnibarContent3 = true;
    } else if (this.showOmnibarContent3) {
      this.showOmnibarContent3 = false;
      this.showOmnibarContent4 = true;
    } else if (this.showOmnibarContent4) {
      this.showOmnibarContent1 = false;
      this.showOmnibarContent2 = false;
      this.showOmnibarContent3 = false;
      this.showOmnibarContent4 = false;
    }
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

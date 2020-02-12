import { Component, OnInit } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { JgServiceService } from '../../../services/jg-service/jg-service.service';
import { Donation, FundraisingPageDonations } from '../../../services/jg-service/fundraising-page';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-omnibar',
  templateUrl: './omnibar.component.html',
  styleUrls: ['./omnibar.component.css']
})
export class OmnibarComponent implements OnInit {
  public fundraisingPageDonations: Observable<FundraisingPageDonations>;
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
  }

  ngOnInit() {
    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
      if ( n % 5 === 0 ) {
        this.changeOmnibarContent();
      }
    });

    this.fundraisingPageDonations = this.jgServiceService.getFundraisingPageDonations().pipe(map(fpd => {
      console.log('jgServiceService.getFundraisingPageDonations:', fpd);
      return fpd;
    }));

  }

  /**
   * ADDING THIS METHOD BECAUSE JUSTGIVING ARE A BUNCH OF USELESS CUNTS AND DONT DISPLAY THIS
   * DATA ON THE GetFundraisingPageDetails API ENDPOINT ANYMORE....... WHYYYYYYYYYYYYYYYYY?
   * https://api.justgiving.com/docs/resources/v1/Fundraising/GetFundraisingPageDetails
   */
  getDonationTotal(donations: Donation[]): number {
    let total = 0;
    for (const donation of donations) {
      total = total + parseInt(donation.amount, 0);
    }
    return total;
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
      this.charityLogoUrl = '../../../../assets/img/GB20_logo_for_website.png';
    } else {
      this.charityLogoUrl = '../../../../assets/img/logo-specialeffect.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

  getCharityLogoUrl(): string {
    return this.charityLogoUrl;
  }

}

import { Component, Injectable, OnInit } from '@angular/core';
import { combineLatest, interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JgServiceService } from '../../../services/jg-service/jg-service.service';
import { FbServiceService } from '../../../services/fb-service/fb-service.service';
import { FundraisingPageDetails } from '../../../services/jg-service/fundraising-page';
import { FacebookFundraisingPage } from '../../../services/fb-service/facebook-fundraising-page';

@Component({
  selector: 'app-omnibar',
  templateUrl: './omnibar.component.html',
  styleUrls: ['./omnibar.component.css']
})
@Injectable({
  providedIn: 'root',
})
export class OmnibarComponent implements OnInit {
  public fundraisingPageDetails$: Observable<FundraisingPageDetails>;
  public facebookFundraisingPage$: Observable<FacebookFundraisingPage>;
  private secondsCounter$: Observable<any>;
  public donationTotal$: Observable<number>;
  public currentDonationTotal = 0.00;
  public loadedDonationTotal: boolean;

  public charityLogoUrl: string;
  public charityLogoSwap = true;

  public showOmnibarContent1 = false;
  public showOmnibarContent2 = false;
  public showOmnibarContent3 = false;
  public showOmnibarContent4 = false;

  constructor(private fbServiceService: FbServiceService,
              private jgServiceService: JgServiceService) {
    this.secondsCounter$ = interval(1000 * 15);
  }

  ngOnInit() {
    this.updateCharityLogoUrl();
    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
    });
    this.facebookFundraisingPage$ = this.fbServiceService.getFacebookFundraisingPage().pipe(map(fbDonations => {
      return fbDonations[0];
    }));
    this.fundraisingPageDetails$ = this.jgServiceService.getFundraisingPageDetails().pipe(map(fpd => {
      return fpd;
    }));
    this.loadedDonationTotal = false;
    this.donationTotal$ = combineLatest([this.facebookFundraisingPage$, this.fundraisingPageDetails$]).pipe(map(combinedDonations => {
      console.log('combinedDonations:', combinedDonations);
      this.loadedDonationTotal = true;
      return this.getCombinedDonationTotal(combinedDonations[0], combinedDonations[1]);
    }));
  }

  getCombinedDonationTotal(facebookFundraisingPage: FacebookFundraisingPage, fundraisingPageDetails: FundraisingPageDetails): number {
    const totalRaisedOnline = (fundraisingPageDetails && fundraisingPageDetails.totalRaisedOnline ) !== null
      ? fundraisingPageDetails.totalRaisedOnline : '0';
    const totalRaisedOffline = (fundraisingPageDetails && fundraisingPageDetails.totalRaisedOffline ) !== null
      ? fundraisingPageDetails.totalRaisedOffline : '0';
    const newDonationTotal = parseFloat(totalRaisedOnline) +
                             parseFloat(totalRaisedOffline) +
                             facebookFundraisingPage.amountRaised;
    this.transitionCurrentDonationTotal(newDonationTotal);
    return (newDonationTotal);
  }

  transitionCurrentDonationTotal(newDonationTotal: number): void {
    console.log('transitionCurrentDonationTotal:', this.currentDonationTotal, newDonationTotal);
    this.currentDonationTotal = newDonationTotal;
  }

  testDonation() {
    const randomAmount = Math.random() * 100;
    this.transitionCurrentDonationTotal(this.currentDonationTotal + randomAmount);
  }

  countDecimals(value: number): number {
    if (Math.floor(value) === value) { return 0; }
    const decimals = value.toString().split('.')[1];
    const secondIsZero = parseInt(decimals[1], 0) === 0;
    const thirdRoundDown = parseInt(decimals[2], 0) < 5;
    return (secondIsZero && thirdRoundDown) ? 1 : 2;
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

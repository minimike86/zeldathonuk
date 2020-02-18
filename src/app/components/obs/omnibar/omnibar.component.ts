import { AfterViewInit, Component, Injectable, OnInit } from '@angular/core';
import {combineLatest, interval, Observable, of, timer} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import { OmnibarContentService } from '../../../services/omnibar-content-service/omnibar-content-service.service';
import { JgService } from '../../../services/jg-service/jg-service.service';
import { FbService } from '../../../services/fb-service/fb-service.service';
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
export class OmnibarComponent implements OnInit, AfterViewInit {
  public fundraisingPageDetails$: Observable<FundraisingPageDetails>;
  public facebookFundraisingPage$: Observable<FacebookFundraisingPage>;
  private secondsCounter$: Observable<any>;
  public donationTotal$: Observable<number>;
  public currentDonationTotal = 0.00;

  public currentOmnibarContentId$: Observable<number>;
  public charityLogoUrl: string;
  public charityLogoSwap = true;

  constructor( private omnibarContentService: OmnibarContentService,
               private fbService: FbService,
               private jgService: JgService ) {
    this.secondsCounter$ = interval(1000 * 15);
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.updateCharityLogoUrl();
    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
    });

    this.omnibarContentService.setCurrentOmnibarContentId(1, 500);

    this.facebookFundraisingPage$ = this.fbService.getFacebookFundraisingPage().pipe(take(1), map(fbDonations => {
      // console.log('facebook donation updated');
      return fbDonations[0];
    }));
    this.facebookFundraisingPage$.subscribe();

    this.fundraisingPageDetails$ = this.jgService.getFundraisingPageDetails().pipe(take(1), map(fpd => {
      // console.log('justgiving donation updated');
      return fpd;
    }));
    this.fundraisingPageDetails$.subscribe();

    this.donationTotal$ = combineLatest([this.facebookFundraisingPage$, this.fundraisingPageDetails$]).pipe(map(combinedDonations => {
      // console.log('combinedDonations:', combinedDonations);
      return this.getCombinedDonationTotal(combinedDonations[0], combinedDonations[1]);
    }));
    this.donationTotal$.subscribe();
    setInterval(() => {
      // console.log('omnibar setInterval fired');
      this.facebookFundraisingPage$.subscribe();
      this.fundraisingPageDetails$.subscribe();
      this.donationTotal$.subscribe();
    }, 0.5 * 60 * 1000);

  }

  ngAfterViewInit(): void {
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
    if (newDonationTotal > this.currentDonationTotal + 1) {
      console.log('transitionCurrentDonationTotal:', this.currentDonationTotal, newDonationTotal);
      this.playDonationGetAudio();
      this.currentDonationTotal = newDonationTotal;
    }
  }

  playDonationGetAudio() {
    const donationAlert = new Audio();
    donationAlert.src = '../../../assets/audio/BOTW_Fanfare_Item.wav';
    donationAlert.load();
    if ( !this.isPlaying(donationAlert) && this.currentDonationTotal !== 0.00 ) { donationAlert.play(); }
  }

  isPlaying(audio: HTMLAudioElement): boolean {
    return audio
      && audio.currentTime > 0
      && !audio.paused
      && !audio.ended
      && audio.readyState > 2;
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

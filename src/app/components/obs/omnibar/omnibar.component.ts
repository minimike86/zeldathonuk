import { AfterViewInit, Component, Injectable, OnInit } from '@angular/core';
import {empty, from, interval, Observable, of, pipe} from 'rxjs';
import { OmnibarContentService } from '../../../services/omnibar-content-service/omnibar-content-service.service';
import { JgService } from '../../../services/jg-service/jg-service.service';
import { FundraisingPageDetails, FundraisingPageDonations, JustGivingDonation } from '../../../services/jg-service/fundraising-page';
import { FacebookFundraisingPage } from '../../../services/fb-service/facebook-fundraising-page';
import { TrackedDonation } from '../../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../../services/firebase/donation-tracking/donation-tracking.service';
import {concatMap, delay, delayWhen, finalize, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;

@Component({
  selector: 'app-omnibar',
  templateUrl: './omnibar.component.html',
  styleUrls: ['./omnibar.component.css']
})
@Injectable({
  providedIn: 'root',
})
export class OmnibarComponent implements OnInit, AfterViewInit {
  public trackedDonations: TrackedDonation[];
  public fundraisingPageDonations$: Observable<FundraisingPageDonations>;
  public justGivingDonations: JustGivingDonation[]; // JustGiving donations

  private secondsCounter$: Observable<any>;
  public donationTotal$: Observable<number>;
  public currentDonationTotal = 0.00;

  public currentOmnibarContentId$: Observable<number>;
  public charityLogoUrl: string;
  public charityLogoSwap = true;

  constructor( private omnibarContentService: OmnibarContentService,
               private donationTrackingService: DonationTrackingService,
               private jgService: JgService ) {
    this.secondsCounter$ = interval(1000 * 15);
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.updateCharityLogoUrl();
    this.secondsCounter$.subscribe(() => {
      this.updateCharityLogoUrl();
    });

    this.donationTrackingService.getTrackedDonationArray().subscribe(data => {
      this.trackedDonations = data[0].donations;
      const trackedDonationsTotal = this.trackedDonations.reduce((a, b) => a + b.donationAmount, 0);
      this.transitionCurrentDonationTotal(trackedDonationsTotal);
      console.log('set initial trackedDonationsTotal:', trackedDonationsTotal);
    });

    this.fundraisingPageDonations$ = this.jgService.getFundraisingPageDonations().pipe(
      map((jgfpds: FundraisingPageDonations) => {
        from(jgfpds.donations).pipe(
          map((donation: JustGivingDonation) => this.convertJustGivingDonationToTrackedDonation(donation)),
          concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
            delay(5 * 1000),
            map((donation: TrackedDonation) => {
              const donationExists = this.trackedDonationExists(donation);
              // console.log('trackedDonationExists', trackedDonation, donationExists);
              if (!donationExists) {
                this.donationTrackingService.addTrackedDonation([donation]);
                this.playDonationGetAudio();
              }
            }),
          )),
        ).subscribe();
        // console.log('getFundraisingPageDonations:', jgfpds.donations);
        return jgfpds;
      }
    ));

    this.omnibarContentService.setCurrentOmnibarContentId(1, 1000 * 5);

    // this.facebookFundraisingPage$ = this.fbService.getFacebookFundraisingPage().pipe(take(1), map(fbDonations => {
    //   // console.log('facebook donation updated');
    //   return fbDonations !== null ? fbDonations[0] : null;
    // }));
    // this.facebookFundraisingPage$.subscribe();

    // this.fundraisingPageDetails$ = this.jgService.getFundraisingPageDetails().pipe(take(1), map(fpd => {
    //   console.log('justgiving donation updated', fpd);
    //   return fpd;
    // }));
    // this.fundraisingPageDetails$.subscribe();

    // this.donationTotal$ = combineLatest([this.facebookFundraisingPage$, this.fundraisingPageDetails$]).pipe(map(combinedDonations => {
    // this.donationTotal$ = this.fundraisingPageDetails$.pipe(map(combinedDonations => {
    //   // console.log('combinedDonations:', combinedDonations);
    //   const newDonationTotal = parseFloat(combinedDonations.totalRaisedOnline) + parseFloat(combinedDonations.totalRaisedOffline);
    //   this.transitionCurrentDonationTotal(newDonationTotal);
    //   return newDonationTotal;
    // }));
    // this.donationTotal$.subscribe();

  }

  ngAfterViewInit(): void {
    this.fundraisingPageDonations$.subscribe();
    setInterval(() => {
      this.fundraisingPageDonations$.subscribe();
    }, 1 * 60 * 1000);
  }

  trackedDonationExists(donation: TrackedDonation): boolean {
    return this.trackedDonations?.filter(x => x.name === donation.name
                                              && x.imgUrl === donation.imgUrl
                                              && x.currency === donation.currency
                                              && x.donationAmount === donation.donationAmount
                                              && x.message === donation.message
                                              && x.donationSource === donation.donationSource
                                              && x.donationDate === x.donationDate).length >= 1;
  }

  convertJustGivingDonationToTrackedDonation(donation: JustGivingDonation): TrackedDonation {
    return {
      name: (donation.donorDisplayName !== null && donation.donorDisplayName !== undefined)
        ? donation.donorDisplayName : donation.donorRealName,
      imgUrl: donation.image !== undefined ? donation.image : 'undefined',
      message: donation.message,
      currency: donation.currencyCode,
      donationAmount: typeof(donation.amount) === 'string'
        ? parseFloat(donation.amount) : donation.amount,
      giftAidAmount: typeof(donation.estimatedTaxReclaim) === 'string'
        ? parseFloat(donation.estimatedTaxReclaim) : 0,
      donationSource: 'JustGiving',
      donationDate: Timestamp.fromDate(this.parseJustGivingDateString(donation.donationDate))
    };
  }

  // "/Date(1610767455000+0000)/"
  parseJustGivingDateString(donationDate: string): Date {
    return new Date(parseInt(donationDate.slice(6, donationDate.length - 5), 10));
  }

  transitionCurrentDonationTotal(newDonationTotal: number): void {
    if (newDonationTotal > this.currentDonationTotal + 1) {
      console.log('transitionCurrentDonationTotal:', this.currentDonationTotal, newDonationTotal);
      this.currentDonationTotal = newDonationTotal;
    }
  }

  playDonationGetAudio() {
    const donationAlert = new Audio();
    donationAlert.src = '../../../assets/audio/BOTW_Fanfare_Item.wav';
    donationAlert.load();
    if ( !this.isPlaying(donationAlert) && this.currentDonationTotal !== 0.00 ) { donationAlert.play().then(); }
  }

  isPlaying(audio: HTMLAudioElement): boolean {
    return audio
      && audio.currentTime > 0
      && !audio.paused
      && !audio.ended
      && audio.readyState > 2;
  }

  testDonation() {
    const randomAmount = Math.floor(((Math.random() * 50) + 1) * 100) / 100;
    const randomTrackedDonation: TrackedDonation = {
      currency: 'GBP',
      donationAmount: randomAmount,
      donationDate: Timestamp.now(),
      donationSource: 'Test',
      giftAidAmount: (Math.random() < 0.5) ? randomAmount * 0.25 : 0,
      imgUrl: 'https://via.placeholder.com/150',
      message: 'This is a random test donation',
      name: 'Joe Bloggs (Test)'
    };
    this.donationTrackingService.addTrackedDonation([randomTrackedDonation]);
  }

  updateCharityLogoUrl(): void {
    if (this.charityLogoSwap) {
      this.charityLogoUrl = '../../../../assets/img/GB21_logo_for_website.png';
    } else {
      this.charityLogoUrl = '../../../../assets/img/logo-specialeffect.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

  getCharityLogoUrl(): string {
    return this.charityLogoUrl;
  }

}

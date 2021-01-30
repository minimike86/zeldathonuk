import { AfterViewInit, Component, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, from, interval, Observable, of } from 'rxjs';
import { OmnibarContentService } from '../../../services/omnibar-content-service/omnibar-content-service.service';
import { JgService } from '../../../services/jg-service/jg-service.service';
import { FundraisingPageDonations, JustGivingDonation } from '../../../services/jg-service/fundraising-page';
import { TrackedDonation } from '../../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../../services/firebase/donation-tracking/donation-tracking.service';
import {concatMap, delay, map} from 'rxjs/operators';
import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;
import {
  FacebookDonation,
  FacebookFundraisingDetails,
  ZeldathonBackendService
} from '../../../services/zeldathon-backend-service/zeldathon-backend-service.service';
import {sha256} from 'js-sha256';

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
  public justGivingFundraisingPageDonations$: Observable<JustGivingDonation[]>;
  public facebookFundraisingPageDonations$: Observable<FacebookDonation[]>;

  private secondsCounter$: Observable<any>;
  public currentDonationTotal$: BehaviorSubject<number> = new BehaviorSubject(0.00);

  public currentOmnibarContentId$: Observable<number>;
  public charityLogoUrl: string;
  public charityLogoSwap = true;

  constructor( private omnibarContentService: OmnibarContentService,
               private donationTrackingService: DonationTrackingService,
               private zeldathonBackendService: ZeldathonBackendService,
               private jgService: JgService ) {
    this.secondsCounter$ = interval(1000 * 15);
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    this.updateCharityLogoUrl();
    this.secondsCounter$.subscribe(() => {
      this.updateCharityLogoUrl();
    });

    // TRACKED DONATIONS
    this.donationTrackingService.getTrackedDonationArray().subscribe(data => {
      this.trackedDonations = data[0].donations;
      const trackedDonationsTotal = this.trackedDonations.reduce((a, b) => a + b.donationAmount, 0);
      this.transitionCurrentDonationTotal(trackedDonationsTotal);
      // console.log('set initial trackedDonationsTotal:', trackedDonationsTotal);
    });

    // JUSTGIVING DONATIONS
    this.justGivingFundraisingPageDonations$ = this.jgService.getAllJustGivingDonations().pipe(
      map((donations: JustGivingDonation[]) => {
        from(donations).pipe(
          map((donation: JustGivingDonation) => this.donationTrackingService.convertJustGivingDonationToTrackedDonation(donation)),
          concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
            delay(5 * 1000),
            map((donation: TrackedDonation) => {
              const donationExists = this.donationTrackingService.trackedDonationExists(donation);
              // console.log('trackedDonationExists', trackedDonation, donationExists);
              if (!donationExists) {
                this.donationTrackingService.addTrackedDonation([donation]);
                this.playDonationGetAudio();
              }
            }),
          )),
        ).subscribe();
        console.log('getAllJustGivingDonations:', donations);
        return donations;
      }
    ));

    // FACEBOOK DONATIONS
    this.facebookFundraisingPageDonations$ = this.zeldathonBackendService.scrapeFacebookFundraiser(855003971855785).pipe(
      map((facebookFundraisingDetails: FacebookFundraisingDetails) => {
        from(facebookFundraisingDetails.donations).pipe(
          map((donation: FacebookDonation) => this.donationTrackingService.convertFacebookDonationToTrackedDonation(donation)),
          concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
            delay(5 * 1000),
            map((donation: TrackedDonation) => {
              const donationExists = this.donationTrackingService.trackedDonationExists(donation);
              // console.log('trackedDonationExists', trackedDonation, donationExists);
              if (!donationExists) {
                this.donationTrackingService.addTrackedDonation([donation]);
                this.playDonationGetAudio();
              }
            }),
          )),
        ).subscribe();
        // console.log('getFundraisingPageDonations:', jgfpds.donations);
        return facebookFundraisingDetails.donations;
      })
    );

    this.omnibarContentService.setCurrentOmnibarContentId(1, 1000 * 5);

  }

  ngAfterViewInit(): void {
    // this.justGivingFundraisingPageDonations$.subscribe();
    // setInterval(() => {
    //   this.justGivingFundraisingPageDonations$.subscribe();
    // }, 5 * 60 * 1000);

    // this.facebookFundraisingPageDonations$.subscribe();
    // setInterval(() => {
    //   this.facebookFundraisingPageDonations$.subscribe();
    // }, 5 * 60 * 1000);
  }

  transitionCurrentDonationTotal(newDonationTotal: number): void {
    if (newDonationTotal > this.currentDonationTotal$.getValue() + 1) {
      console.log('transitionCurrentDonationTotal:', this.currentDonationTotal$.getValue(), newDonationTotal);
      this.currentDonationTotal$.next(newDonationTotal);
    }
  }

  playDonationGetAudio() {
    const donationAlert = new Audio();
    donationAlert.src = '../../../assets/audio/BOTW_Fanfare_Item.wav';
    donationAlert.load();
    if ( !this.isPlaying(donationAlert) && this.currentDonationTotal$.getValue() !== 0.00 ) { donationAlert.play().then(); }
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
      id: sha256(new Date().toDateString()),
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

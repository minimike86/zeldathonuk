import {AfterViewInit, Component, Injectable, OnInit } from '@angular/core';
import {BehaviorSubject, filter, from, interval, Observable, of, switchMap} from 'rxjs';
import { OmnibarContentService } from '../../../services/omnibar-content-service/omnibar-content-service.service';
import { JgService } from '../../../services/jg-service/jg-service.service';
import { JustGivingDonation } from '../../../services/jg-service/fundraising-page';
import { TrackedDonation } from '../../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../../services/firebase/donation-tracking/donation-tracking.service';
import { concatMap, delay, finalize, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;
import {
  FacebookDonation,
  FacebookFundraisingDetails,
  ZeldathonBackendService
} from '../../../services/zeldathon-backend-service/zeldathon-backend-service.service';
import { sha256 } from 'js-sha256';
import { DonationHighlightService } from '../../../services/firebase/donation-highlight-service/donation-highlight-service.service';
import {FundraisingPage, FundraisingPagesService} from '../../../services/firebase/fundraising-pages/fundraising-pages.service';
import moment from 'moment';
import {TiltifyCampaignDonation, TiltifyService} from '../../../services/tiltify-service/tiltify.service';

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
  public trackedDonationsTotal$: Observable<number>;
  public currentDonationTotal$: BehaviorSubject<number> = new BehaviorSubject(0.00);

  public justGivingFundraisingPageDonations$: Observable<JustGivingDonation[]>;
  public facebookFundraisingPageDonations$: Observable<FacebookDonation[]>;
  public tiltifyFundraisingPageDonations$: Observable<TiltifyCampaignDonation[]>;

  private secondsCounter$: Observable<any>;

  public currentOmnibarContentId$: Observable<number>;
  public charityLogoUrl: string;
  public charityLogoSwap = true;

  public activeJustGivingPageShortName$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public activeFacebookFundraiserId$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public activeTiltifyPageId$: BehaviorSubject<FundraisingPage> = new BehaviorSubject<FundraisingPage>(null);

  public donationAlert: HTMLAudioElement;

constructor( private omnibarContentService: OmnibarContentService,
             private fundraisingPagesService: FundraisingPagesService,
             private donationTrackingService: DonationTrackingService,
             private donationHighlightService: DonationHighlightService,
             private zeldathonBackendService: ZeldathonBackendService,
             private tiltifyService: TiltifyService,
             private jgService: JgService ) {
    this.secondsCounter$ = interval(15 * 1000);
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    // @ts-ignore
    window.odometerOptions = {
      auto: true,
      format: '(,ddd).dd',
      duration: 3000,
      animation: 'slide'
    };
    document.querySelector('.dtotal-odometer-bm').innerHTML = 0.00.toFixed(2);

    // TRACKED DONATIONS
    this.trackedDonationsTotal$ = this.donationTrackingService.getTrackedDonationArray().pipe(map((data) => {
      this.trackedDonations = data.find(x => x.id === 'DONATIONS').donations;
      const trackedDonationsTotal = this.trackedDonations?.reduce((a, b) => a + b.donationAmount, 0);
      this.transitionCurrentDonationTotal(trackedDonationsTotal);
      console.log('trackedDonationsTotal$', trackedDonationsTotal);
      return trackedDonationsTotal;
    }));

    this.updateCharityLogoUrl();
    this.secondsCounter$.subscribe(() => {
      this.updateCharityLogoUrl();
    });

    this.donationAlert = new Audio();
    this.donationAlert.src = '/assets/audio/BOTW_Fanfare_Item.wav';
    this.donationAlert.volume =  0.5;
    this.donationAlert.load();

    this.fundraisingPagesService.getFundraisingPagesIdArray().pipe(map((data) => {
      this.activeJustGivingPageShortName$.next(data.find(x => x.id === 'FUNDRAISING-PAGES').fundraisingPages
                                                    .filter(x => x.vendor === 'JustGiving')
                                                    .filter(x => !this.isFundraisingPageExpired(x))[0].pageShortName);
      console.log('activeJustGivingPageShortName$', this.activeJustGivingPageShortName$.getValue());

      this.activeFacebookFundraiserId$.next(parseInt(data.find(x => x.id === 'FUNDRAISING-PAGES').fundraisingPages
                                                    .filter(x => x.vendor === 'Facebook')
                                                    .filter(x => !this.isFundraisingPageExpired(x))[0].pageShortName, 10));
      console.log('activeFacebookFundraiserId$', this.activeFacebookFundraiserId$.getValue());

      this.activeTiltifyPageId$.next(data.find(x => x.id === 'FUNDRAISING-PAGES').fundraisingPages
                                                    .filter(x => x.vendor === 'Tiltify')
                                                    .filter(x => !this.isFundraisingPageExpired(x))[0]);
      console.log('activeTiltifyPageId$', this.activeTiltifyPageId$.getValue().pageId);
    })).subscribe();

    // JUSTGIVING DONATIONS
    this.justGivingFundraisingPageDonations$ = this.activeJustGivingPageShortName$.pipe(
      filter(x => x !== null),
      switchMap((pageShortName: string) => {
        return this.jgService.getAllJustGivingDonations(pageShortName).pipe(
        map((donations: JustGivingDonation[]) =>
          donations.filter(donation => !this.trackedDonations?.some(x => x.id === donation.id))),
        map((newDonations: JustGivingDonation[]) => {
          console.log('getNewJustGivingDonations', newDonations, this.trackedDonations);
          from(newDonations.reverse()).pipe(
            map((donation: JustGivingDonation) => this.donationTrackingService
              .convertJustGivingDonationToTrackedDonation(pageShortName, donation)),
            map((trackedDonation: TrackedDonation) => profanityFilter(trackedDonation)),
            concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
              map((donation: TrackedDonation) => {
                const donationExists = this.donationTrackingService.trackedDonationExists(donation);
                console.log('trackedDonationExists', donation, donationExists);
                if (!donationExists) {
                  this.donationTrackingService.addTrackedDonation([donation]);
                  this.donationHighlightService.setDonationHighlight({donation: donation, show: true});
                  this.playDonationGetAudio();
                }
              }),
              delay(15 * 1000),
              finalize(() => {
                console.log('next donationExists');
              })
            )),
          ).subscribe();
          return newDonations;
        })
      );
    }));

    // FACEBOOK DONATIONS
    this.facebookFundraisingPageDonations$ = this.activeFacebookFundraiserId$.pipe(
      filter(x => x !== null),
      switchMap((activeFacebookFundraiserId: number) => {
        return this.zeldathonBackendService
          .scrapeFacebookFundraiser(activeFacebookFundraiserId).pipe(
          map((facebookFundraisingDetails: FacebookFundraisingDetails) => {
            console.log('scrapeFacebookFundraiser', facebookFundraisingDetails.donations, this.trackedDonations);
            from(facebookFundraisingDetails.donations).pipe(
              map((donation: FacebookDonation) =>
                this.donationTrackingService.convertFacebookDonationToTrackedDonation(
                  facebookFundraisingDetails.fundraiserDetails.title, donation)),
              concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
                map((donation: TrackedDonation) => {
                  const donationExists = this.donationTrackingService.trackedDonationExists(donation);
                  console.log('trackedDonationExists', donation, donationExists);
                  if (!donationExists) {
                    this.donationTrackingService.addTrackedDonation([donation]);
                    this.donationHighlightService.setDonationHighlight({donation: donation, show: true});
                    this.playDonationGetAudio();
                  }
                }),
                delay(15 * 1000),
              )),
            ).subscribe();
            return facebookFundraisingDetails.donations;
          })
        );
      }));

    // TILTIFY DONATIONS
    this.tiltifyFundraisingPageDonations$ = this.activeTiltifyPageId$.pipe(
      filter(x => x !== null),
      switchMap((tiltifyPage: FundraisingPage) => {
        return this.tiltifyService.getCampaignDonationsById(tiltifyPage.pageId).pipe(
          map((tiltifyCampaignDonations) =>
            tiltifyCampaignDonations.data.filter(donation => !this.trackedDonations?.some(x => x.id === donation.id))),
          map((newDonations: TiltifyCampaignDonation[]) => {
            console.log('getNewTiltifyDonations', newDonations, this.trackedDonations);
            from(newDonations.reverse()).pipe(
              map((donation: TiltifyCampaignDonation) => this.donationTrackingService
                .convertTiltifyCampaignDonationToTrackedDonation(tiltifyPage, donation)),
              map((trackedDonation: TrackedDonation) => profanityFilter(trackedDonation)),
              concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
                map((donation: TrackedDonation) => {
                  const donationExists = this.donationTrackingService.trackedDonationExists(donation);
                  console.log('trackedDonationExists', donation, donationExists);
                  if (!donationExists) {
                    this.donationTrackingService.addTrackedDonation([donation]);
                    this.donationHighlightService.setDonationHighlight({donation: donation, show: true});
                    this.playDonationGetAudio();
                  }
                }),
                delay(15 * 1000),
                finalize(() => {
                  console.log('next donationExists');
                })
              )),
            ).subscribe();
            return newDonations;
          })
        );
      }));

    this.omnibarContentService.setCurrentOmnibarContentId(1, 2 * 1000);

  }

  ngAfterViewInit(): void {
    this.justGivingFundraisingPageDonations$.subscribe();
    setInterval(() => {
      this.justGivingFundraisingPageDonations$.subscribe();
    }, 5 * 60 * 1000);

    this.facebookFundraisingPageDonations$.subscribe();
    setInterval(() => {
      this.facebookFundraisingPageDonations$.subscribe();
    }, 5 * 60 * 1000);

    this.tiltifyFundraisingPageDonations$.subscribe();
    setInterval(() => {
      this.tiltifyFundraisingPageDonations$.subscribe();
    }, 5 * 60 * 1000);
  }

  isFundraisingPageExpired(fundraisingPage: FundraisingPage): boolean {
    const date = fundraisingPage.expiryDate.toDate();
    return moment(fundraisingPage.expiryDate.toDate()).isBefore(moment());
  }

  transitionCurrentDonationTotal(newDonationTotal: number): void {
    if (newDonationTotal > this.currentDonationTotal$.getValue() + 1) {
      console.log('transitionCurrentDonationTotal:', this.currentDonationTotal$.getValue(), newDonationTotal);
      this.currentDonationTotal$.next(newDonationTotal);
      document.querySelector('.dtotal-odometer-bm').innerHTML = newDonationTotal.toFixed(2);
    } else {
      document.querySelector('.dtotal-odometer-bm').innerHTML = newDonationTotal.toFixed(2);
    }
  }

  playDonationGetAudio() {
    if ( this.trackedDonations?.length === 0 ) {
      this.donationAlert.play().then();
    } else if ( !this.isPlaying(this.donationAlert) && this.currentDonationTotal$.getValue() !== 0.00 ) {
      this.donationAlert.play().then();
    }
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
      pageShortName: 'Test',
      giftAidAmount: (Math.random() < 0.5) ? randomAmount * 0.25 : 0,
      imgUrl: 'https://via.placeholder.com/150',
      message: 'This is a random test donation',
      name: 'Joe Bloggs (Test)'
    };
    this.donationTrackingService.addTrackedDonation([randomTrackedDonation]);
    this.donationHighlightService.setDonationHighlight({donation: randomTrackedDonation, show: true});
    this.playDonationGetAudio();
  }

  updateCharityLogoUrl(): void {
    if (this.charityLogoSwap) {
      this.charityLogoUrl = '../../../../assets/img/GB22_Logo_Linear_DarkBGs_Small.png';
    } else {
      this.charityLogoUrl = '../../../../assets/img/logo-specialeffect.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

  getCharityLogoUrl(): string {
    return this.charityLogoUrl;
  }

}

export function profanityFilter(trackedDonation: TrackedDonation): TrackedDonation {
  // replace in name
  if (trackedDonation.name !== null && trackedDonation.name !== undefined) {
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])anal(?![a-zA-Z0-9])/gi, 'a***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])anus(?![a-zA-Z0-9])/gi, 'a***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])arses?(?![a-zA-Z0-9])/gi, 'a***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])assholes?(?![a-zA-Z0-9])/gi, 'a******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])ass holes?(?![a-zA-Z0-9])/gi, 'a*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])ass(?![a-zA-Z0-9])/gi, 'a**');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])ballsacks?(?![a-zA-Z0-9])/gi, 'b*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])balls(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bastards?(?![a-zA-Z0-9])/gi, 'b******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bitchs?(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bitches(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])biatchs?(?![a-zA-Z0-9])/gi, 'b*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bloody(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])blowjobs?(?![a-zA-Z0-9])/gi, 'b******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])blow jobs?(?![a-zA-Z0-9])/gi, 'b*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bollock(?![a-zA-Z0-9])/gi, 'b******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bolloks?(?![a-zA-Z0-9])/gi, 'b*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])boners?(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])boobs?(?![a-zA-Z0-9])/gi, 'b***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])buggers?(?![a-zA-Z0-9])/gi, 'b*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])bums?(?![a-zA-Z0-9])/gi, 'b**');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])butts?(?![a-zA-Z0-9])/gi, 'b***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])buttplugs?(?![a-zA-Z0-9])/gi, 'b*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])clitoris(?![a-zA-Z0-9])/gi, 'c*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])cocks?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])coons?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])craps?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])cripples?(?![a-zA-Z0-9])/gi, 'c*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])cunts?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])dicks?(?![a-zA-Z0-9])/gi, 'd***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])dildos?(?![a-zA-Z0-9])/gi, 'd****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])dykes?(?![a-zA-Z0-9])/gi, 'd***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fags?(?![a-zA-Z0-9])/gi, 'f**');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fellates?(?![a-zA-Z0-9])/gi, 'f******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fellatio(?![a-zA-Z0-9])/gi, 'f*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])felching(?![a-zA-Z0-9])/gi, 'f*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fucks?(?![a-zA-Z0-9])/gi, 'f***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])f u c ks?(?![a-zA-Z0-9])/gi, 'f***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fuckers?(?![a-zA-Z0-9])/gi, 'f*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fucking(?![a-zA-Z0-9])/gi, 'f******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fudgepackers?(?![a-zA-Z0-9])/gi, 'f**********');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])fudge packers?(?![a-zA-Z0-9])/gi, 'f***********');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])flange(?![a-zA-Z0-9])/gi, 'f*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])gays?(?![a-zA-Z0-9])/gi, 'g**');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])homos?(?![a-zA-Z0-9])/gi, 'h***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])incels?(?![a-zA-Z0-9])/gi, 'i****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])jizz(?![a-zA-Z0-9])/gi, 'j***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])knobends?(?![a-zA-Z0-9])/gi, 'k******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])knob ends?(?![a-zA-Z0-9])/gi, 'k*******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])labias?(?![a-zA-Z0-9])/gi, 'l****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])minges?(?![a-zA-Z0-9])/gi, 'm****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])mongoloids?(?![a-zA-Z0-9])/gi, 'm********');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])mongs?(?![a-zA-Z0-9])/gi, 'm***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])muffs?(?![a-zA-Z0-9])/gi, 'm***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])niggers?(?![a-zA-Z0-9])/gi, 'n*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])niggas?(?![a-zA-Z0-9])/gi, 'n****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])penis(?![a-zA-Z0-9])/gi, 'p****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])penises(?![a-zA-Z0-9])/gi, 'p******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])piss(?![a-zA-Z0-9])/gi, 'p***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])pricks?(?![a-zA-Z0-9])/gi, 'p****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])pubes?(?![a-zA-Z0-9])/gi, 'p***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])pussy(?![a-zA-Z0-9])/gi, 'p****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])pussies(?![a-zA-Z0-9])/gi, 'p******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])queers?(?![a-zA-Z0-9])/gi, 'q****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])retards?(?![a-zA-Z0-9])/gi, 'r*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])spastics?(?![a-zA-Z0-9])/gi, 's******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])scrotums?(?![a-zA-Z0-9])/gi, 's******');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])sex(?![a-zA-Z0-9])/gi, 's**');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])simps?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])shits?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])s h i ts?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])sh1ts?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])sluts?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])smegma(?![a-zA-Z0-9])/gi, 's*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])spunks?(?![a-zA-Z0-9])/gi, 's****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])tits?(?![a-zA-Z0-9])/gi, 't**');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])tossers?(?![a-zA-Z0-9])/gi, 't*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])turds?(?![a-zA-Z0-9])/gi, 't***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])twats?(?![a-zA-Z0-9])/gi, 't***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])virgins?(?![a-zA-Z0-9])/gi, 'v*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])vaginas?(?![a-zA-Z0-9])/gi, 'v*****');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])wanks?(?![a-zA-Z0-9])/gi, 'w***');
    trackedDonation.name = trackedDonation.name.replace(/(?<![a-zA-Z0-9])whores?(?![a-zA-Z0-9])/gi, 'w****');
  }
  // replace in message
  if (trackedDonation.message !== null && trackedDonation.message !== undefined) {
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])anal(?![a-zA-Z0-9])/gi, 'a***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])anus(?![a-zA-Z0-9])/gi, 'a***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])arses?(?![a-zA-Z0-9])/gi, 'a***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])assholes?(?![a-zA-Z0-9])/gi, 'a******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])ass holes?(?![a-zA-Z0-9])/gi, 'a*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])ass(?![a-zA-Z0-9])/gi, 'a**');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])ballsacks?(?![a-zA-Z0-9])/gi, 'b*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])balls(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bastards?(?![a-zA-Z0-9])/gi, 'b******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bitchs?(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bitches(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])biatchs?(?![a-zA-Z0-9])/gi, 'b*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bloody(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])blowjobs?(?![a-zA-Z0-9])/gi, 'b******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])blow jobs?(?![a-zA-Z0-9])/gi, 'b*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bollock(?![a-zA-Z0-9])/gi, 'b******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bolloks?(?![a-zA-Z0-9])/gi, 'b*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])boners?(?![a-zA-Z0-9])/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])boobs?(?![a-zA-Z0-9])/gi, 'b***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])buggers?(?![a-zA-Z0-9])/gi, 'b*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])bums?(?![a-zA-Z0-9])/gi, 'b**');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])butts?(?![a-zA-Z0-9])/gi, 'b***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])buttplugs?(?![a-zA-Z0-9])/gi, 'b*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])clitoris(?![a-zA-Z0-9])/gi, 'c*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])cocks?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])coons?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])craps?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])cripples?(?![a-zA-Z0-9])/gi, 'c*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])cunts?(?![a-zA-Z0-9])/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])dicks?(?![a-zA-Z0-9])/gi, 'd***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])dildos?(?![a-zA-Z0-9])/gi, 'd****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])dykes?(?![a-zA-Z0-9])/gi, 'd***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fags?(?![a-zA-Z0-9])/gi, 'f**');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fellates?(?![a-zA-Z0-9])/gi, 'f******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fellatio(?![a-zA-Z0-9])/gi, 'f*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])felching(?![a-zA-Z0-9])/gi, 'f*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fucks?(?![a-zA-Z0-9])/gi, 'f***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])f u c ks?(?![a-zA-Z0-9])/gi, 'f***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fuckers?(?![a-zA-Z0-9])/gi, 'f*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fucking(?![a-zA-Z0-9])/gi, 'f******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fudgepackers?(?![a-zA-Z0-9])/gi, 'f**********');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])fudge packers?(?![a-zA-Z0-9])/gi, 'f***********');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])flange(?![a-zA-Z0-9])/gi, 'f*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])gays?(?![a-zA-Z0-9])/gi, 'g**');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])homos?(?![a-zA-Z0-9])/gi, 'h***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])incels?(?![a-zA-Z0-9])/gi, 'i****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])jizz(?![a-zA-Z0-9])/gi, 'j***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])knobends?(?![a-zA-Z0-9])/gi, 'k******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])knob ends?(?![a-zA-Z0-9])/gi, 'k*******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])labias?(?![a-zA-Z0-9])/gi, 'l****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])minges?(?![a-zA-Z0-9])/gi, 'm****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])mongoloids?(?![a-zA-Z0-9])/gi, 'm********');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])mongs?(?![a-zA-Z0-9])/gi, 'm***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])muffs?(?![a-zA-Z0-9])/gi, 'm***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])niggers?(?![a-zA-Z0-9])/gi, 'n*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])niggas?(?![a-zA-Z0-9])/gi, 'n****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])penis(?![a-zA-Z0-9])/gi, 'p****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])penises(?![a-zA-Z0-9])/gi, 'p******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])piss(?![a-zA-Z0-9])/gi, 'p***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])pricks?(?![a-zA-Z0-9])/gi, 'p****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])pubes?(?![a-zA-Z0-9])/gi, 'p***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])pussy(?![a-zA-Z0-9])/gi, 'p****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])pussies(?![a-zA-Z0-9])/gi, 'p******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])queers?(?![a-zA-Z0-9])/gi, 'q****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])retards?(?![a-zA-Z0-9])/gi, 'r*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])spastics?(?![a-zA-Z0-9])/gi, 's******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])scrotums?(?![a-zA-Z0-9])/gi, 's******');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])sex(?![a-zA-Z0-9])/gi, 's**');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])simps?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])shits?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])s h i ts?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])sh1ts?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])sluts?(?![a-zA-Z0-9])/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])smegma(?![a-zA-Z0-9])/gi, 's*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])spunks?(?![a-zA-Z0-9])/gi, 's****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])tits?(?![a-zA-Z0-9])/gi, 't**');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])tossers?(?![a-zA-Z0-9])/gi, 't*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])turds?(?![a-zA-Z0-9])/gi, 't***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])twats?(?![a-zA-Z0-9])/gi, 't***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])virgins?(?![a-zA-Z0-9])/gi, 'v*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])vaginas?(?![a-zA-Z0-9])/gi, 'v*****');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])wanks?(?![a-zA-Z0-9])/gi, 'w***');
    trackedDonation.message = trackedDonation.message.replace(/(?<![a-zA-Z0-9])whores?(?![a-zA-Z0-9])/gi, 'w****');
  }
  return trackedDonation;
}

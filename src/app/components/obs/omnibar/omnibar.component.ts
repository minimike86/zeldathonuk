import {AfterViewInit, Component, Injectable, OnInit} from '@angular/core';
import {BehaviorSubject, forkJoin, from, interval, Observable, of, Subscription, throwError} from 'rxjs';
import {catchError, concatMap, delay, finalize, map, tap} from 'rxjs/operators';
import {OmnibarContentService} from '../../../services/omnibar-content-service/omnibar-content-service.service';
import {DonationTrackingService} from '../../../services/firebase/donation-tracking/donation-tracking.service';
import {
  HighlightedDonation,
  HighlightedDonationId,
  TrackedDonation,
  TrackedDonationId
} from '../../../services/firebase/donation-tracking/tracked-donation';
import {DonationHighlightService} from '../../../services/firebase/donation-highlight-service/donation-highlight-service.service';
import {JgService} from '../../../services/jg-service/jg-service.service';
import {JustGivingDonation} from '../../../services/jg-service/fundraising-page';
import {fbEnvironment} from '../../../../environments/environment';
import {
  FacebookDonation,
  FacebookFundraisingDetails,
  ZeldathonBackendService
} from '../../../services/zeldathon-backend-service/zeldathon-backend-service.service';
import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;
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
  public trackedDonations$: Observable<TrackedDonationId[]>;
  public trackedDonations: TrackedDonation[];
  public justGivingFundraisingPageDonations$: Observable<TrackedDonation[]>;
  public facebookFundraisingPageDonations$: Observable<TrackedDonation[]>;
  public newDonationCheck$: Observable<TrackedDonation[]>;
  public newDonationCheckSubscription: Subscription;

  private secondsCounter$: Observable<any>;
  public currentDonationTotal$: BehaviorSubject<number> = new BehaviorSubject(0.00);

  public currentOmnibarContentId$: Observable<number>;
  public charityLogoUrl: string;
  public charityLogoSwap = true;

  public donationAlert: HTMLAudioElement;
  public donationHighlight: HighlightedDonation = {donation: null, show: false};

  constructor( private omnibarContentService: OmnibarContentService,
               private donationTrackingService: DonationTrackingService,
               private donationHighlightService: DonationHighlightService,
               private zeldathonBackendService: ZeldathonBackendService,
               private jgService: JgService ) {
    this.secondsCounter$ = interval(15 * 1000);
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();

    // TRACKED DONATIONS
    this.trackedDonations$ = this.donationTrackingService.getTrackedDonationArray();
    this.trackedDonations$.subscribe(data => {
      this.trackedDonations = data.find(x => x.id === 'GAMEBLAST21').donations;
      const trackedDonationsTotal = this.trackedDonations?.reduce((a, b) => a + b.donationAmount, 0);
      this.transitionCurrentDonationTotal(trackedDonationsTotal);
    });

  }

  ngOnInit() {
    this.updateCharityLogoUrl();
    this.secondsCounter$.subscribe(() => {
      this.updateCharityLogoUrl();
    });

    this.donationAlert = new Audio();
    this.donationAlert.src = '../../../assets/audio/BOTW_Fanfare_Item.wav';
    this.donationAlert.volume =  0.5;
    this.donationAlert.load();

    // JUSTGIVING DONATIONS
    this.justGivingFundraisingPageDonations$ = this.jgService.getAllJustGivingDonations().pipe(
      map((donations: JustGivingDonation[]) => donations.filter(donation =>
        !this.trackedDonations?.some(x => x.id === donation.id))),
      map((newDonations: JustGivingDonation[]) => newDonations.reverse().map(donation => {
        return this.profanityFilter(this.donationTrackingService.convertJustGivingDonationToTrackedDonation(donation));
      })),
      tap(data => {
        console.log('justGivingFundraisingPageDonations$', data);
      })
    );

    // FACEBOOK DONATIONS
    this.facebookFundraisingPageDonations$ = this.zeldathonBackendService.scrapeFacebookFundraiser(fbEnvironment.fundraisingId).pipe(
      map((facebookFundraisingDetails: FacebookFundraisingDetails) => facebookFundraisingDetails.donations),
      map((donations: FacebookDonation[]) => donations.filter(donation =>
        !this.trackedDonations?.some(x => x.id === sha256(donation.name + donation.amount + donation.date)))),
      map((newDonations: FacebookDonation[]) => newDonations.map(donation => {
        return this.profanityFilter(this.donationTrackingService.convertFacebookDonationToTrackedDonation(donation));
      })),
      tap(data => {
        console.log('facebookFundraisingPageDonations$', data);
      })
    );

    this.newDonationCheck$ = forkJoin([
      this.justGivingFundraisingPageDonations$,
      this.facebookFundraisingPageDonations$
    ]).pipe(
      map(data => data.reduce((result, arr) => [...result, ...arr], []))
    ).pipe(catchError(err => {
      console.error('newDonationCheck$', err);
      return throwError(err);
    }));

    this.donationHighlightService.getHighlightedDonation().pipe(map((data: HighlightedDonationId[]) => {
      this.donationHighlight = data.find(x => x.id === 'HIGHLIGHT-DONATION');
    }));

    this.omnibarContentService.setCurrentOmnibarContentId(1, 1000 * 5);

  }

  ngAfterViewInit(): void {

    console.log('checking for new donations');
    this.subscribeToCombinedTrackedDonations();
    interval(5 * 60 * 1000).subscribe(() => {
      if (this.newDonationCheckSubscription.closed && !this.donationHighlight.show) {
        console.log('checking for new donations');
        this.subscribeToCombinedTrackedDonations();
      } else {
        if (this.newDonationCheckSubscription.closed) {
          console.log('previous donation check is still active - skipping new donation check');
        } else if (this.donationHighlight.show) {
          console.log('donations are being read out on stream - skipping new donation check');
        }
      }
    });

  }

  subscribeToCombinedTrackedDonations() {
    this.newDonationCheckSubscription = this.newDonationCheck$.pipe(
      concatMap((trackedDonations: TrackedDonation[]) => {
        console.log('subscribeToCombinedTrackedDonations', trackedDonations);
        return from(trackedDonations);
      }),
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
      ))
    ).subscribe();
  }

  profanityFilter(trackedDonation: TrackedDonation): TrackedDonation {
    // replace in name
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
    // replace in message
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
    return trackedDonation;
  }

  transitionCurrentDonationTotal(newDonationTotal: number): void {
    if (newDonationTotal > this.currentDonationTotal$.getValue() + 1) {
      // console.log('transitionCurrentDonationTotal:', this.currentDonationTotal$.getValue(), newDonationTotal);
      this.currentDonationTotal$.next(newDonationTotal);
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

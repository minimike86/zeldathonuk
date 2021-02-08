import { AfterViewInit, Component, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, from, interval, Observable, of } from 'rxjs';
import { OmnibarContentService } from '../../../services/omnibar-content-service/omnibar-content-service.service';
import { JgService } from '../../../services/jg-service/jg-service.service';
import { FundraisingPageDonations, JustGivingDonation } from '../../../services/jg-service/fundraising-page';
import {TrackedDonation, TrackedDonationId} from '../../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../../services/firebase/donation-tracking/donation-tracking.service';
import {concatMap, delay, filter, finalize, map, reduce, skipUntil, tap} from 'rxjs/operators';
import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;
import {
  FacebookDonation,
  FacebookFundraisingDetails,
  ZeldathonBackendService
} from '../../../services/zeldathon-backend-service/zeldathon-backend-service.service';
import {sha256} from 'js-sha256';
import {DonationHighlightService} from '../../../services/firebase/donation-highlight-service/donation-highlight-service.service';

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
  public justGivingFundraisingPageDonations$: Observable<JustGivingDonation[]>;
  public facebookFundraisingPageDonations$: Observable<FacebookDonation[]>;

  private secondsCounter$: Observable<any>;
  public currentDonationTotal$: BehaviorSubject<number> = new BehaviorSubject(0.00);

  public currentOmnibarContentId$: Observable<number>;
  public charityLogoUrl: string;
  public charityLogoSwap = true;

  public donationAlert: HTMLAudioElement;

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
      this.trackedDonations = data.find(x => x.id === 'TEST-DONATIONS').donations;
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
      map((donations: JustGivingDonation[]) => donations.filter(donation => !this.trackedDonations?.some(x => x.id === donation.id))),
      map((newDonations: JustGivingDonation[]) => {
        console.log('getNewJustGivingDonations', newDonations, this.trackedDonations);
        from(newDonations.reverse()).pipe(
          map((donation: JustGivingDonation) => this.donationTrackingService.convertJustGivingDonationToTrackedDonation(donation)),
          map((trackedDonation: TrackedDonation) => this.profanityFilter(trackedDonation)),
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
        // console.log('getAllJustGivingDonations:', donations);
        return newDonations;
      }
    ));

    // FACEBOOK DONATIONS
    this.facebookFundraisingPageDonations$ = this.zeldathonBackendService.scrapeFacebookFundraiser(855003971855785).pipe(
      map((facebookFundraisingDetails: FacebookFundraisingDetails) => {
        from(facebookFundraisingDetails.donations).pipe(
          map((donation: FacebookDonation) => this.donationTrackingService.convertFacebookDonationToTrackedDonation(donation)),
          concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
            // tap((donation: TrackedDonation) => {
            //   this.donationHighlightService.setDonationHighlight({donation: null, show: false});
            // }),
            map((donation: TrackedDonation) => {
              const donationExists = this.donationTrackingService.trackedDonationExists(donation);
              // console.log('trackedDonationExists', trackedDonation, donationExists);
              if (!donationExists) {
                this.donationTrackingService.addTrackedDonation([donation]);
                this.playDonationGetAudio();
              }
            }),
            delay(30 * 1000),
          )),
        ).subscribe();
        // console.log('getFundraisingPageDonations:', jgfpds.donations);
        return facebookFundraisingDetails.donations;
      })
    );

    this.omnibarContentService.setCurrentOmnibarContentId(1, 1000 * 5);

  }

  ngAfterViewInit(): void {

    setTimeout(() => {
      this.justGivingFundraisingPageDonations$.subscribe();
      setInterval(() => {
        this.justGivingFundraisingPageDonations$.subscribe();
      }, 5 * 60 * 1000);
    }, 5 * 1000);

    // this.facebookFundraisingPageDonations$.subscribe();
    // setInterval(() => {
    //   this.facebookFundraisingPageDonations$.subscribe();
    // }, 5 * 60 * 1000);
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

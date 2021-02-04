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
            delay(20 * 1000),
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
    trackedDonation.name = trackedDonation.name.replace(/anal/gi, 'a***');
    trackedDonation.name = trackedDonation.name.replace(/anus/gi, 'a***');
    trackedDonation.name = trackedDonation.name.replace(/arse/gi, 'a***');
    trackedDonation.name = trackedDonation.name.replace(/asshole/gi, 'a******');
    trackedDonation.name = trackedDonation.name.replace(/ass hole/gi, 'a*******');
    trackedDonation.name = trackedDonation.name.replace(/ass/gi, 'a**');
    trackedDonation.name = trackedDonation.name.replace(/ballsack/gi, 'b*******');
    trackedDonation.name = trackedDonation.name.replace(/balls/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/bastard/gi, 'b******');
    trackedDonation.name = trackedDonation.name.replace(/bitch/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/biatch/gi, 'b*****');
    trackedDonation.name = trackedDonation.name.replace(/bloody/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/blowjob/gi, 'b******');
    trackedDonation.name = trackedDonation.name.replace(/blow job/gi, 'b*******');
    trackedDonation.name = trackedDonation.name.replace(/bollock/gi, 'b******');
    trackedDonation.name = trackedDonation.name.replace(/bollok/gi, 'b*****');
    trackedDonation.name = trackedDonation.name.replace(/boner/gi, 'b****');
    trackedDonation.name = trackedDonation.name.replace(/boob/gi, 'b***');
    trackedDonation.name = trackedDonation.name.replace(/bugger/gi, 'b*****');
    trackedDonation.name = trackedDonation.name.replace(/bum/gi, 'b**');
    trackedDonation.name = trackedDonation.name.replace(/butt/gi, 'b***');
    trackedDonation.name = trackedDonation.name.replace(/buttplug/gi, 'b*******');
    trackedDonation.name = trackedDonation.name.replace(/clitoris/gi, 'c*******');
    trackedDonation.name = trackedDonation.name.replace(/cock/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/coon/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/crap/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/cripple/gi, 'c*****');
    trackedDonation.name = trackedDonation.name.replace(/cunt/gi, 'c***');
    trackedDonation.name = trackedDonation.name.replace(/dick/gi, 'd***');
    trackedDonation.name = trackedDonation.name.replace(/dildo/gi, 'd****');
    trackedDonation.name = trackedDonation.name.replace(/dyke/gi, 'd***');
    trackedDonation.name = trackedDonation.name.replace(/fag/gi, 'f**');
    trackedDonation.name = trackedDonation.name.replace(/fellate/gi, 'f******');
    trackedDonation.name = trackedDonation.name.replace(/fellatio/gi, 'f*******');
    trackedDonation.name = trackedDonation.name.replace(/felching/gi, 'f*******');
    trackedDonation.name = trackedDonation.name.replace(/fuck/gi, 'f***');
    trackedDonation.name = trackedDonation.name.replace(/f u c k/gi, 'f***');
    trackedDonation.name = trackedDonation.name.replace(/fudgepacker/gi, 'f**********');
    trackedDonation.name = trackedDonation.name.replace(/fudge packer/gi, 'f***********');
    trackedDonation.name = trackedDonation.name.replace(/flange/gi, 'f*****');
    trackedDonation.name = trackedDonation.name.replace(/gay/gi, 'g**');
    trackedDonation.name = trackedDonation.name.replace(/homo/gi, 'h***');
    trackedDonation.name = trackedDonation.name.replace(/jizz/gi, 'j***');
    trackedDonation.name = trackedDonation.name.replace(/knobend/gi, 'k******');
    trackedDonation.name = trackedDonation.name.replace(/knob end/gi, 'k*******');
    trackedDonation.name = trackedDonation.name.replace(/labia/gi, 'l****');
    trackedDonation.name = trackedDonation.name.replace(/minge/gi, 'm****');
    trackedDonation.name = trackedDonation.name.replace(/mongoloid/gi, 'm********');
    trackedDonation.name = trackedDonation.name.replace(/mong/gi, 'm***');
    trackedDonation.name = trackedDonation.name.replace(/muff/gi, 'm***');
    trackedDonation.name = trackedDonation.name.replace(/nigger/gi, 'n*****');
    trackedDonation.name = trackedDonation.name.replace(/nigga/gi, 'n****');
    trackedDonation.name = trackedDonation.name.replace(/penis/gi, 'p****');
    trackedDonation.name = trackedDonation.name.replace(/piss/gi, 'p***');
    trackedDonation.name = trackedDonation.name.replace(/prick/gi, 'p****');
    trackedDonation.name = trackedDonation.name.replace(/pube/gi, 'p***');
    trackedDonation.name = trackedDonation.name.replace(/pussy/gi, 'p****');
    trackedDonation.name = trackedDonation.name.replace(/queer/gi, 'q****');
    trackedDonation.name = trackedDonation.name.replace(/retard/gi, 'r*****');
    trackedDonation.name = trackedDonation.name.replace(/spastic/gi, 's******');
    trackedDonation.name = trackedDonation.name.replace(/scrotum/gi, 's******');
    trackedDonation.name = trackedDonation.name.replace(/sex/gi, 's**');
    trackedDonation.name = trackedDonation.name.replace(/simp/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/shit/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/sh1t/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/slut/gi, 's***');
    trackedDonation.name = trackedDonation.name.replace(/smegma/gi, 's*****');
    trackedDonation.name = trackedDonation.name.replace(/spunk/gi, 's****');
    trackedDonation.name = trackedDonation.name.replace(/tit/gi, 't**');
    trackedDonation.name = trackedDonation.name.replace(/tosser/gi, 't*****');
    trackedDonation.name = trackedDonation.name.replace(/turd/gi, 't***');
    trackedDonation.name = trackedDonation.name.replace(/twat/gi, 't***');
    trackedDonation.name = trackedDonation.name.replace(/vagina/gi, 'v*****');
    trackedDonation.name = trackedDonation.name.replace(/wank/gi, 'w***');
    trackedDonation.name = trackedDonation.name.replace(/whore/gi, 'w****');
    // replace in message
    trackedDonation.message = trackedDonation.message.replace(/anal/gi, 'a***');
    trackedDonation.message = trackedDonation.message.replace(/anus/gi, 'a***');
    trackedDonation.message = trackedDonation.message.replace(/arse/gi, 'a***');
    trackedDonation.message = trackedDonation.message.replace(/asshole/gi, 'a******');
    trackedDonation.message = trackedDonation.message.replace(/ass hole/gi, 'a*******');
    trackedDonation.message = trackedDonation.message.replace(/ass/gi, 'a**');
    trackedDonation.message = trackedDonation.message.replace(/ballsack/gi, 'b*******');
    trackedDonation.message = trackedDonation.message.replace(/balls/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/bastard/gi, 'b******');
    trackedDonation.message = trackedDonation.message.replace(/bitch/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/biatch/gi, 'b*****');
    trackedDonation.message = trackedDonation.message.replace(/bloody/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/blowjob/gi, 'b******');
    trackedDonation.message = trackedDonation.message.replace(/blow job/gi, 'b*******');
    trackedDonation.message = trackedDonation.message.replace(/bollock/gi, 'b******');
    trackedDonation.message = trackedDonation.message.replace(/bollok/gi, 'b*****');
    trackedDonation.message = trackedDonation.message.replace(/boner/gi, 'b****');
    trackedDonation.message = trackedDonation.message.replace(/boob/gi, 'b***');
    trackedDonation.message = trackedDonation.message.replace(/bugger/gi, 'b*****');
    trackedDonation.message = trackedDonation.message.replace(/bum/gi, 'b**');
    trackedDonation.message = trackedDonation.message.replace(/butt/gi, 'b***');
    trackedDonation.message = trackedDonation.message.replace(/buttplug/gi, 'b*******');
    trackedDonation.message = trackedDonation.message.replace(/clitoris/gi, 'c*******');
    trackedDonation.message = trackedDonation.message.replace(/cock/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/coon/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/crap/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/cripple/gi, 'c*****');
    trackedDonation.message = trackedDonation.message.replace(/cunt/gi, 'c***');
    trackedDonation.message = trackedDonation.message.replace(/dick/gi, 'd***');
    trackedDonation.message = trackedDonation.message.replace(/dildo/gi, 'd****');
    trackedDonation.message = trackedDonation.message.replace(/dyke/gi, 'd***');
    trackedDonation.message = trackedDonation.message.replace(/fag/gi, 'f**');
    trackedDonation.message = trackedDonation.message.replace(/fellate/gi, 'f******');
    trackedDonation.message = trackedDonation.message.replace(/fellatio/gi, 'f*******');
    trackedDonation.message = trackedDonation.message.replace(/felching/gi, 'f*******');
    trackedDonation.message = trackedDonation.message.replace(/fuck/gi, 'f***');
    trackedDonation.message = trackedDonation.message.replace(/f u c k/gi, 'f***');
    trackedDonation.message = trackedDonation.message.replace(/fudgepacker/gi, 'f**********');
    trackedDonation.message = trackedDonation.message.replace(/fudge packer/gi, 'f***********');
    trackedDonation.message = trackedDonation.message.replace(/flange/gi, 'f*****');
    trackedDonation.message = trackedDonation.message.replace(/gay/gi, 'g**');
    trackedDonation.message = trackedDonation.message.replace(/homo/gi, 'h***');
    trackedDonation.message = trackedDonation.message.replace(/jizz/gi, 'j***');
    trackedDonation.message = trackedDonation.message.replace(/knobend/gi, 'k******');
    trackedDonation.message = trackedDonation.message.replace(/knob end/gi, 'k*******');
    trackedDonation.message = trackedDonation.message.replace(/labia/gi, 'l****');
    trackedDonation.message = trackedDonation.message.replace(/minge/gi, 'm****');
    trackedDonation.message = trackedDonation.message.replace(/mongoloid/gi, 'm********');
    trackedDonation.message = trackedDonation.message.replace(/mong/gi, 'm***');
    trackedDonation.message = trackedDonation.message.replace(/muff/gi, 'm***');
    trackedDonation.message = trackedDonation.message.replace(/nigger/gi, 'n*****');
    trackedDonation.message = trackedDonation.message.replace(/nigga/gi, 'n****');
    trackedDonation.message = trackedDonation.message.replace(/penis/gi, 'p****');
    trackedDonation.message = trackedDonation.message.replace(/piss/gi, 'p***');
    trackedDonation.message = trackedDonation.message.replace(/prick/gi, 'p****');
    trackedDonation.message = trackedDonation.message.replace(/pube/gi, 'p***');
    trackedDonation.message = trackedDonation.message.replace(/pussy/gi, 'p****');
    trackedDonation.message = trackedDonation.message.replace(/queer/gi, 'q****');
    trackedDonation.message = trackedDonation.message.replace(/retard/gi, 'r*****');
    trackedDonation.message = trackedDonation.message.replace(/spastic/gi, 's******');
    trackedDonation.message = trackedDonation.message.replace(/scrotum/gi, 's******');
    trackedDonation.message = trackedDonation.message.replace(/sex/gi, 's**');
    trackedDonation.message = trackedDonation.message.replace(/simp/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/shit/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/sh1t/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/slut/gi, 's***');
    trackedDonation.message = trackedDonation.message.replace(/smegma/gi, 's*****');
    trackedDonation.message = trackedDonation.message.replace(/spunk/gi, 's****');
    trackedDonation.message = trackedDonation.message.replace(/tit/gi, 't**');
    trackedDonation.message = trackedDonation.message.replace(/tosser/gi, 't*****');
    trackedDonation.message = trackedDonation.message.replace(/turd/gi, 't***');
    trackedDonation.message = trackedDonation.message.replace(/twat/gi, 't***');
    trackedDonation.message = trackedDonation.message.replace(/vagina/gi, 'v*****');
    trackedDonation.message = trackedDonation.message.replace(/wank/gi, 'w***');
    trackedDonation.message = trackedDonation.message.replace(/whore/gi, 'w****');
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

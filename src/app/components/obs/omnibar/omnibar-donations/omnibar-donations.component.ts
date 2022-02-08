import { AfterViewInit, Component, OnInit } from '@angular/core';
import {from, Observable, of, pipe} from 'rxjs';
import {concatMap, delay, finalize, map, tap} from 'rxjs/operators';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  keyframes,
} from '@angular/animations';
import {OmnibarContentService} from '../../../../services/omnibar-content-service/omnibar-content-service.service';
import {DonationTrackingService} from '../../../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonation, TrackedDonationId} from '../../../../services/firebase/donation-tracking/tracked-donation';

@Component({
  selector: 'app-omnibar-donations',
  templateUrl: './omnibar-donations.component.html',
  styleUrls: ['./omnibar-donations.component.css'],
  animations: [
    trigger('showDonation', [
      state('slideInFromRight', style({
        opacity: 0
      })),
      state('slideOutToLeft', style({
        opacity: 1
      })),
      transition('slideInFromRight => slideOutToLeft', [
        animate('1.0s ease-in', keyframes ([
          style({ animationTimingFunction: 'ease-in', opacity: 0, transform: 'translateX(600px)' }),
          style({ animationTimingFunction: 'ease-out', opacity: 1, transform: 'translateX(0)' }),
          style({ animationTimingFunction: 'ease-in', transform: 'translateX(68px)' }),
          style({ animationTimingFunction: 'ease-out', transform: 'translateX(0)' }),
          style({ animationTimingFunction: 'ease-in', transform: 'translateX(32px)' }),
          style({ animationTimingFunction: 'ease-out', transform: 'translateX(0px)' }),
          style({ animationTimingFunction: 'ease-in', transform: 'translateX(8px)' }),
          style({ animationTimingFunction: 'ease-out', transform: 'translateX(0)' })
        ]))
      ]),
      transition('slideOutToLeft => slideInFromRight', [
        animate('0.5s cubic-bezier(0.550, 0.085, 0.680, 0.530)', keyframes ( [
          style({ opacity: 1, transform: 'translateX(0)' }),
          style({ opacity: 0, transform: 'translateX(-1000px)' })
        ]))
      ]),
    ]),
  ],
})
export class OmnibarDonationsComponent implements OnInit, AfterViewInit {
  public trackedDonationArray$: Observable<TrackedDonation[]>;
  public lastTenDonations: TrackedDonation[] = [];
  public showingDonations = false;
  public highlightedDonation: TrackedDonation;
  public timeAgo: TimeAgo;
  public currentState = 'slideInFromRight';
  public slideIn = true;

  public currentOmnibarContentId$: Observable<number>;

  constructor( private donationTrackingService: DonationTrackingService,
               private omnibarContentService: OmnibarContentService ) {
    this.currentOmnibarContentId$ = this.omnibarContentService.getCurrentOmnibarContentId();
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');

    this.trackedDonationArray$ = this.donationTrackingService.getTrackedDonationArray().pipe(
      map((trackedDonationIds: TrackedDonationId[]) => {
        return trackedDonationIds.find(x => x.id === 'DONATIONS')?.donations;
      }),
      map((trackedDonations: TrackedDonation[]) => {
        trackedDonations.sort((a: TrackedDonation, b: TrackedDonation) => {
          return b.donationDate.toDate().getTime() - a.donationDate.toDate().getTime();
        });
        this.lastTenDonations = trackedDonations.slice(0, 10);
        console.log('lastTenDonations', this.lastTenDonations.map(x => {
          return {
            name: x.name,
            date: x.donationDate.toDate(),
            imgUrl: x.imgUrl,
            message: x.message,
            currency: x.currency,
            donationAmount: x.donationAmount,
            donationSource: x.donationSource
          };
        }));
        if (!this.showingDonations) {
          this.displayDonations();
        }
        return trackedDonations;
      })
    );
  }

  ngAfterViewInit(): void {
  }

  displayDonations() {
    const initialWait: number = 2 * 1000;
    const slideInFromRightDuration: number = 0.5 * 1000;
    const slideOutToLeftDuration: number = 1 * 1000;
    const showDonationDuration: number = 5 * 1000;

    // iterate donations
    if (this.lastTenDonations.length >= 1) {
      this.showingDonations = true;

      from(this.lastTenDonations).pipe(
        // tap(() => console.log('1. delay 2 secs')),
        delay(initialWait),
        // tap(() => console.log('2. concatMap')),
        concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
          // tap(() => console.log('3. delay 1/5 secs')),
          delay(slideInFromRightDuration),
          // tap(() => console.log('4. showDonation')), // dodgy
          tap((donationItem: TrackedDonation) => {
            this.showDonation(donationItem);
          }),
          // tap(() => console.log('5. delay 5 secs')),
          delay(showDonationDuration),
          // tap(() => console.log('6. hideDonation')), // dodgy
          tap(() => {
            this.hideDonation();
          }),
          // tap(() => console.log('7. delay 1 secs')),
          delay(slideOutToLeftDuration)
        )),
        // tap(() => console.log('8. finalize')),
        finalize(() => {
          // console.log('9. donationShown');
          setTimeout(() => {
            this.slideIn = !this.slideIn;
            this.omnibarContentService.setCurrentOmnibarContentId(4, 2 * 1000);
            this.showingDonations = false;
          }, 1 * 1000);
        })
      ).subscribe();

    } else {

      setTimeout(() => {
        this.slideIn = !this.slideIn;
        this.omnibarContentService.setCurrentOmnibarContentId(4, 2 * 1000);
      }, 15 * 1000);

    }

  }

  showDonation(donation: TrackedDonation) {
    this.highlightedDonation = donation;
    this.currentState = 'slideOutToLeft';
    // console.log('showing donation', donation);
  }

  hideDonation() {
    this.currentState = 'slideInFromRight';
    // console.log('hiding donation');
  }

}

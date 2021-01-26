import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
import {TrackedDonationId} from '../../../../services/firebase/donation-tracking/tracked-donation';

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
  public trackedDonationIds$: Observable<TrackedDonationId[]>;
  public lastTenDonations: TrackedDonationId[] = [];
  public highlightedDonation: TrackedDonationId;
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
    this.trackedDonationIds$ = this.donationTrackingService.getTrackedDonationIds().pipe(map(trackedDonationIds => {
      trackedDonationIds.sort((a: TrackedDonationId, b: TrackedDonationId) =>
        b.donationDate.getTime() - a.donationDate.getTime()
      );
      this.lastTenDonations = trackedDonationIds.slice(0, 10);
      return trackedDonationIds;
    }));
    // setTimeout(() => {
    //   this.slideIn = !this.slideIn;
    //   this.omnibarContentService.setCurrentOmnibarContentId(4, 1000 * 5);
    // }, 1000 * 30); // 30
  }

  ngAfterViewInit(): void {
    this.displayDonations();
  }

  changeState() {
    this.currentState = this.currentState === 'slideInFromRight' ? 'slideOutToLeft' : 'slideInFromRight';
  }

  displayDonations() {
    let index = 0;

    const displayDonationsInterval = setInterval(() => {
      this.highlightedDonation = this.lastTenDonations[index];
      setTimeout(() => {
        // console.log('showing donation', index, this.lastTenDonations[index]);
        this.changeState();
        setTimeout(() => {
          setTimeout(() => {
            this.changeState();
            if (index < this.lastTenDonations.length - 1) {
              index++;
            } else {
              clearInterval(displayDonationsInterval);
              setTimeout(() => {
                this.slideIn = !this.slideIn;
                this.omnibarContentService.setCurrentOmnibarContentId(4, 1000 * 5);
              }, 1000 * 10); // 30
            }
            // console.log('hiding donation', index, this.lastTenDonations[index]);
          }, 1000);  // slideOutToLeft => slideInFromRight
        }, 5000);   // time to show donation for
      }, 2000);     // slideInFromRight => slideOutToLeft
    }, 10000);    // total time to complete donation animation + delay between next donation

  }

}

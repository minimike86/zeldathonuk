import {AfterViewInit, Component, OnInit} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { JgServiceService } from '../../../../services/jg-service/jg-service.service';
import { Donation, FundraisingPageDonations } from '../../../../services/jg-service/fundraising-page';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  keyframes,
} from '@angular/animations';

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
  public fundraisingPageDonations$: Observable<FundraisingPageDonations>;
  public lastTenDonations: Donation[] = [];
  public highlightedDonation: Donation;
  public timeAgo: TimeAgo;
  public currentState = 'slideInFromRight';

  constructor( private jgServiceService: JgServiceService ) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');
    this.fundraisingPageDonations$ = this.jgServiceService.getFundraisingPageDonations().pipe(map(fpd => {
      this.lastTenDonations = fpd.donations.slice(-10);
      return fpd;
    }));
  }

  ngAfterViewInit(): void {
    this.displayDonations();
  }

  changeState() {
    this.currentState = this.currentState === 'slideInFromRight' ? 'slideOutToLeft' : 'slideInFromRight';
  }

  displayDonations() {
    let index = 0;
    setInterval(() => {
      this.highlightedDonation = this.lastTenDonations[index];
      setTimeout(() => {
        // console.log('showing donation', index, donations[index]);
        this.changeState();
        setTimeout(() => {
          setTimeout(() => {
          this.changeState();
          if (index < this.lastTenDonations.length - 1) {
            index++;
          } else {
            index = 0;
          }
          }, 500);  // slideOutToLeft => slideInFromRight
        }, 5000);   // time to show donation for
      }, 1000);     // slideInFromRight => slideOutToLeft
    }, 6500 + 2000);    // total time to complete donation animation + delay between next donation
  }

}

import {Component, OnInit} from '@angular/core';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DonationTrackingService} from '../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonation} from '../../services/firebase/donation-tracking/tracked-donation';


/**
 * COMPONENT IS DISPLAYED WITHIN THE DONATIONS PAGE
 */
@Component({
  selector: 'app-donations',
  templateUrl: './donations.component.html',
  styleUrls: ['./donations.component.css']
})
export class DonationsComponent implements OnInit {
  public timeAgo: TimeAgo;
  public trackedDonationIds$: Observable<TrackedDonation[]>;

  constructor( private donationTrackingService: DonationTrackingService ) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');
    this.trackedDonationIds$ = this.donationTrackingService.getTrackedDonationArray().pipe(map(trackedDonationArray => {
      console.log('trackedDonationArray:', trackedDonationArray);
      if (trackedDonationArray[0].donations) {
        return trackedDonationArray[0].donations.sort((a: TrackedDonation, b: TrackedDonation) =>
          b.donationAmount - a.donationAmount
        );
      }
    }));
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/855003971855785/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/276hr-zelda-marathon-benefitting-specialeffec', '_blank');
  }

  getDateFromJustGivingString(dateStr: string): Date {
    const date1 = parseInt(dateStr.substring(6, dateStr.length - 7), 0);
    return new Date(date1);
  }

}

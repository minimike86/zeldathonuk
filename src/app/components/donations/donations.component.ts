import {Component, OnInit} from '@angular/core';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DonationTrackingService} from '../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonationId} from '../../services/firebase/donation-tracking/tracked-donation';


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
  public trackedDonationIds$: Observable<TrackedDonationId[]>;

  constructor( private donationTrackingService: DonationTrackingService ) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');
    this.trackedDonationIds$ = this.donationTrackingService.getTrackedDonationId().pipe(map(trackedDonationIds => {
      return trackedDonationIds.sort((a: TrackedDonationId, b: TrackedDonationId) =>
        b.donationDate.toDate().getTime() - a.donationDate.toDate().getTime()
      );
    }));
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/655011391974449/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

  getDateFromJustGivingString(dateStr: string): Date {
    const date1 = parseInt(dateStr.substring(6, dateStr.length - 7), 0);
    return new Date(date1);
  }

}

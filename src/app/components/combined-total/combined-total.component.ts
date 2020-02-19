import {Component, OnInit} from '@angular/core';
import {tap} from 'rxjs/operators';
import {DonationTrackingService} from '../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonationId} from '../../services/firebase/donation-tracking/tracked-donation';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-combined-total',
  templateUrl: './combined-total.component.html',
  styleUrls: ['./combined-total.component.css']
})
export class CombinedTotalComponent implements OnInit {
  public trackedDonationIds$: Observable<TrackedDonationId[]>;
  public trackedDonationIds: TrackedDonationId[];
  public total = 0;

  constructor( private donationTrackingService: DonationTrackingService ) {
  }

  ngOnInit() {
    this.trackedDonationIds$ = this.donationTrackingService.getTrackedDonationIds().pipe(tap(trackedDonationIds => {
      this.trackedDonationIds = trackedDonationIds;

      let total = 0;
      this.trackedDonationIds.forEach(trackedDonationId => {
        if (trackedDonationId.currency === 'GBP') {
          total = total + trackedDonationId.donationAmount;
        } else if (trackedDonationId.currency === 'USD') {
          total = total + (trackedDonationId.donationAmount * 0.7740);
        } else if (trackedDonationId.currency === 'EUR') {
          total = total + (trackedDonationId.donationAmount * 0.8354);
        }
      });
      this.total = total;

    }));
  }

}

import {Component, OnInit} from '@angular/core';
import {tap} from 'rxjs/operators';
import {DonationTrackingService} from '../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonation, TrackedDonationArray} from '../../services/firebase/donation-tracking/tracked-donation';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-combined-total',
  templateUrl: './combined-total.component.html',
  styleUrls: ['./combined-total.component.css']
})
export class CombinedTotalComponent implements OnInit {
  public trackedDonationDocIds$: Observable<TrackedDonationArray[]>;
  public trackedDonations: TrackedDonation[];
  public total = 0;

  constructor( private donationTrackingService: DonationTrackingService ) {
  }

  ngOnInit() {
    this.trackedDonationDocIds$ = this.donationTrackingService.getTrackedDonationArray().pipe(tap(trackedDonationDocIds => {
      this.trackedDonations = trackedDonationDocIds[0].donations;

      let total = 0;
      this.trackedDonations.forEach(trackedDonationId => {
        if (trackedDonationId.currency === 'GBP') {
          total = total + trackedDonationId.donationAmount;
        } else if (trackedDonationId.currency === 'USD') {
          total = total + (trackedDonationId.donationAmount * 0.727415);
        } else if (trackedDonationId.currency === 'EUR') {
          total = total + (trackedDonationId.donationAmount * 0.884950);
        }
      });
      this.total = total;

    }));
  }

}

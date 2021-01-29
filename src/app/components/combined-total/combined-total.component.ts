import {AfterViewInit, Component, OnInit} from '@angular/core';
import {tap} from 'rxjs/operators';
import {DonationTrackingService} from '../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonation, TrackedDonationArray} from '../../services/firebase/donation-tracking/tracked-donation';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-combined-total',
  templateUrl: './combined-total.component.html',
  styleUrls: ['./combined-total.component.css']
})
export class CombinedTotalComponent implements OnInit, AfterViewInit {
  public trackedDonationDocIds$: Observable<TrackedDonationArray[]>;
  public trackedDonations: TrackedDonation[];
  public trackedDonationsTotal = 0;

  constructor( private donationTrackingService: DonationTrackingService ) {
  }

  ngOnInit() {
    this.trackedDonationDocIds$ = this.donationTrackingService.getTrackedDonationArray().pipe(
      tap(trackedDonationDocIds => {
        this.trackedDonations = trackedDonationDocIds[0].donations;
        this.trackedDonationsTotal = this.trackedDonations.reduce((a, b) => a + b.donationAmount, 0);
      })
    );
  }

  ngAfterViewInit(): void {
    this.trackedDonationDocIds$.subscribe();
    setInterval(() => {
      this.trackedDonationDocIds$.subscribe();
    }, 15 * 60 * 1000);
  }

}

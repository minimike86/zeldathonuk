import {Component, OnInit} from '@angular/core';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {Observable} from 'rxjs';
import {map, pluck} from 'rxjs/operators';
import {DonationTrackingService} from '../../services/firebase/donation-tracking/donation-tracking.service';
import {TrackedDonation, TrackedDonationId} from '../../services/firebase/donation-tracking/tracked-donation';


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
    this.trackedDonationIds$ = this.donationTrackingService.getTrackedDonationArray().pipe(
      map((trackedDonationId: TrackedDonationId[]) => trackedDonationId.find(x => x.id === 'DONATIONS')),
      pluck('donations'),
      map((trackedDonations: TrackedDonation[]) => {
        // console.log('trackedDonations:', trackedDonations);
        if (trackedDonations) {
          trackedDonations.sort((a: TrackedDonation, b: TrackedDonation) => b.donationAmount - a.donationAmount);
          for (const donation of trackedDonations) {
            donation.imgUrl = (donation.imgUrl === 'undefined' || donation.imgUrl === 'unknown' || donation.imgUrl === '')
              ? this.getRandomThumbnailImageUrl() : donation.imgUrl;
          }
          return trackedDonations;
        }
      })
    );
  }



  getRandomThumbnailImageUrl(): string {
    const imageUrls: string[] = [];
    imageUrls.push('../../../assets/img/thumbnails/ww-link-tingle.jpg');
    imageUrls.push('../../../assets/img/thumbnails/ss-fi-floating.jpg');
    imageUrls.push('../../../assets/img/thumbnails/oot-saria-avatar.jpg');
    imageUrls.push('../../../assets/img/thumbnails/botw-archer-link.jpg');
    imageUrls.push('../../../assets/img/thumbnails/botw-zelda-flower.jpg');
    imageUrls.push('../../../assets/img/thumbnails/z2-return-of-ganon.png');
    imageUrls.push('../../../assets/img/thumbnails/alttp-gannon-fight.jpg');
    imageUrls.push('../../../assets/img/thumbnails/tp-ganondorf-avatar.jpg');
    imageUrls.push('../../../assets/img/thumbnails/tp-goron-shop-owner.jpg');
    imageUrls.push('../../../assets/img/thumbnails/hylian-shield-avatar.jpg');
    imageUrls.push('../../../assets/img/thumbnails/mm-kid-link-keaton-mask.jpg');
    return imageUrls[Math.floor((Math.random() * imageUrls.length))];
  }

  getDateFromJustGivingString(dateStr: string): Date {
    const date1 = parseInt(dateStr.substring(6, dateStr.length - 7), 0);
    return new Date(date1);
  }

}
